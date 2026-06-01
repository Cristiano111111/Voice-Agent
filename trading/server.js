import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3030;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const STARTING_CASH = 1_000_000;

// Black-Scholes for server-side options repricing
function ncdf(x){const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;const s=x<0?-1:1;x=Math.abs(x)/Math.sqrt(2);const t=1/(1+p*x);return 0.5*(1+s*(1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x)));}
function bsVal(S,K,T,r,iv,type){if(T<=0)return type==='call'?Math.max(0,S-K):Math.max(0,K-S);const d1=(Math.log(S/K)+(r+iv*iv/2)*T)/(iv*Math.sqrt(T)),d2=d1-iv*Math.sqrt(T);return type==='call'?S*ncdf(d1)-K*Math.exp(-r*T)*ncdf(d2):K*Math.exp(-r*T)*ncdf(-d2)-S*ncdf(-d1);}

// ── In-memory storage (persists within a serverless function instance) ────────
let _portfolio = { cash: STARTING_CASH, holdings: {}, options: {}, createdAt: new Date().toISOString() };
let _history   = [];
let _orders    = [];

const clone  = o => JSON.parse(JSON.stringify(o));
const readPortfolio  = () => Promise.resolve(clone(_portfolio));
const readHistory    = () => Promise.resolve(clone(_history));
const readOrders     = () => Promise.resolve(clone(_orders));
const writePortfolio = d  => { _portfolio = clone(d); return Promise.resolve(); };
const writeHistory   = d  => { _history   = clone(d); return Promise.resolve(); };
const writeOrders    = d  => { _orders    = clone(d); return Promise.resolve(); };

const YH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/',
};
const YH = { headers: YH_HEADERS };

// Crumb cache for Yahoo Finance authenticated endpoints
let yfCrumb = null, yfCookie = null;
async function getYFCrumb() {
  if (yfCrumb) return { crumb: yfCrumb, cookie: yfCookie };
  try {
    const r1 = await fetch('https://finance.yahoo.com/quote/AAPL', { headers: { 'User-Agent': YH_HEADERS['User-Agent'] } });
    const cookies = r1.headers.get('set-cookie') || '';
    yfCookie = cookies.split(';')[0];
    const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { ...YH_HEADERS, 'Cookie': yfCookie }
    });
    yfCrumb = await r2.text();
    return { crumb: yfCrumb, cookie: yfCookie };
  } catch { return null; }
}

async function yfetchAuth(url) {
  const auth = await getYFCrumb();
  const hdrs = { ...YH_HEADERS };
  if (auth?.cookie) hdrs['Cookie'] = auth.cookie;
  const fullUrl = auth?.crumb ? `${url}${url.includes('?')?'&':'?'}crumb=${encodeURIComponent(auth.crumb)}` : url;
  const r = await fetch(fullUrl, { headers: hdrs });
  if (!r.ok) throw new Error(`YF HTTP ${r.status}`);
  return r.json();
}

// ── Yahoo Finance helpers ─────────────────────────────────────────────────────
async function yfetch(url) {
  const r = await fetch(url, YH);
  if (!r.ok) throw new Error(`YF HTTP ${r.status}`);
  return r.json();
}

async function fetchQuote(symbol) {
  const data = await yfetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&range=1d`);
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('No data');
  const m = result.meta;
  const price = m.regularMarketPrice;
  const prev  = m.chartPreviousClose || m.previousClose || price;
  const change = price - prev;
  return {
    symbol: m.symbol, name: m.shortName || m.symbol,
    price: +price.toFixed(2), change: +change.toFixed(2),
    changePct: +(change / prev * 100).toFixed(2),
    volume: m.regularMarketVolume || 0,
    high: m.regularMarketDayHigh || price, low: m.regularMarketDayLow || price,
    currency: m.currency || 'USD', exchange: m.exchangeName || '',
    timestamp: new Date().toISOString(),
  };
}

async function fetchCandles(symbol, interval, range) {
  const data = await yfetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=${interval}&range=${range}`);
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('No data');
  const ts = result.timestamp || [];
  const q  = result.indicators?.quote?.[0] || {};
  return ts.map((t, i) => ({
    time: t,
    open:   q.open?.[i]   != null ? +q.open[i].toFixed(4)   : null,
    high:   q.high?.[i]   != null ? +q.high[i].toFixed(4)   : null,
    low:    q.low?.[i]    != null ? +q.low[i].toFixed(4)     : null,
    close:  q.close?.[i]  != null ? +q.close[i].toFixed(4)  : null,
    volume: q.volume?.[i] || 0,
  })).filter(c => c.open && c.high && c.low && c.close);
}

async function fetchSearch(q) {
  const data = await yfetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`);
  return (data?.quotes || [])
    .filter(r => r.quoteType === 'EQUITY' || r.quoteType === 'ETF')
    .slice(0, 6)
    .map(r => ({ symbol: r.symbol, name: r.shortname || r.longname || r.symbol, type: r.quoteType, exchange: r.exchange }));
}

// ── Order execution helper ────────────────────────────────────────────────────
async function executeOrderFill(order, fillPrice) {
  const portfolio = await readPortfolio();
  const history   = await readHistory();
  const { symbol, action, shares, orderType } = order;
  const totalCost = fillPrice * shares;

  if (action === 'buy') {
    if (totalCost > portfolio.cash) return false;
    portfolio.cash -= totalCost;
    if (portfolio.holdings[symbol]) {
      const h = portfolio.holdings[symbol];
      const newShares = h.shares + shares;
      h.avgCost = +((h.avgCost * h.shares + totalCost) / newShares).toFixed(4);
      h.shares  = newShares;
    } else {
      portfolio.holdings[symbol] = { symbol, name: order.name || symbol, shares, avgCost: fillPrice, boughtAt: new Date().toISOString() };
    }
  } else {
    const h = portfolio.holdings[symbol];
    if (!h || h.shares < shares) return false;
    portfolio.cash += totalCost;
    h.shares -= shares;
    if (h.shares === 0) delete portfolio.holdings[symbol];
  }

  history.push({ id: Date.now(), symbol, name: order.name || symbol, action, shares, price: fillPrice, total: +totalCost.toFixed(2), orderType: orderType || 'market', timestamp: new Date().toISOString() });
  await Promise.all([writePortfolio(portfolio), writeHistory(history)]);
  return true;
}

// Check orders against a price and fill any that triggered
async function checkAndFillOrders(symbol, price) {
  const orders = await readOrders();
  const triggered = [];
  for (const o of orders) {
    if (o.status !== 'pending' || o.symbol !== symbol) continue;
    let fill = false;
    if (o.orderType === 'limit-buy'    && price <= o.triggerPrice) fill = true;
    if (o.orderType === 'limit-sell'   && price >= o.triggerPrice) fill = true;
    if (o.orderType === 'stop-loss'    && price <= o.triggerPrice) fill = true;
    if (o.orderType === 'take-profit'  && price >= o.triggerPrice) fill = true;
    if (o.orderType === 'stop-limit-buy'  && price <= o.triggerPrice) fill = true;
    if (o.orderType === 'stop-limit-sell' && price >= o.triggerPrice) fill = true;
    if (fill) {
      const ok = await executeOrderFill(o, price);
      o.status    = ok ? 'filled' : 'failed';
      o.fillPrice = price;
      o.filledAt  = new Date().toISOString();
      if (ok) triggered.push(o);
    }
  }
  if (triggered.length) await writeOrders(orders);
  return triggered;
}

// ── Routes: quotes ────────────────────────────────────────────────────────────
app.get('/api/quote/:symbol', async (req, res) => {
  try { res.json(await fetchQuote(req.params.symbol)); }
  catch(e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/quotes', async (req, res) => {
  const syms = (req.query.symbols || '').split(',').filter(Boolean);
  if (!syms.length) return res.json([]);
  const results = await Promise.allSettled(syms.map(fetchQuote));
  res.json(results.filter(r => r.status === 'fulfilled').map(r => r.value));
});

// ── Routes: candles ───────────────────────────────────────────────────────────
app.get('/api/candles/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const interval = req.query.interval || '5m';
    const range    = req.query.range    || '1d';
    res.json(await fetchCandles(symbol, interval, range));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Historical candles for a specific date (YYYY-MM-DD)
app.get('/api/historical/:symbol', async (req, res) => {
  try {
    const symbol   = req.params.symbol.toUpperCase();
    const date     = req.query.date; // YYYY-MM-DD
    const interval = req.query.interval || '1m';
    if (!date) return res.status(400).json({ error: 'date required' });

    // Calculate how many days ago the requested date is
    const targetMs = new Date(date + 'T00:00:00Z').getTime();
    const nowMs    = Date.now();
    const daysAgo  = Math.ceil((nowMs - targetMs) / 86400000);

    // Pick range + honor interval. Yahoo limits: 1m≤7d, 5m/15m/30m≤60d, 1h≤730d.
    let range, useInterval = interval;
    if (interval === '1m') {
      if (daysAgo <= 6) { range = `${Math.max(daysAgo+1,2)}d`; }
      else              { range = '1mo'; useInterval = '5m'; } // 1m not available, fall back
    } else if (interval === '5m' || interval === '15m' || interval === '30m') {
      if (daysAgo <= 59)  { range = `${Math.min(Math.max(daysAgo+2,5),30)}d`; }
      else if (daysAgo <= 364) { range = '3mo'; useInterval = '1h'; }
      else                { range = '1y';  useInterval = '1d'; }
    } else if (interval === '1h') {
      if (daysAgo <= 729) { range = daysAgo<=29?'1mo':daysAgo<=89?'3mo':daysAgo<=364?'1y':'2y'; }
      else                { range = '5y';  useInterval = '1d'; }
    } else {
      range = '1mo'; useInterval = '5m';
    }

    const data   = await yfetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${useInterval}&range=${range}`);
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(400).json({ error: 'No data available' });

    const ts = result.timestamp || [];
    const q  = result.indicators?.quote?.[0] || {};
    const allCandles = ts.map((t, i) => ({
      time:   t,
      open:   q.open?.[i]   != null ? +q.open[i].toFixed(4)   : null,
      high:   q.high?.[i]   != null ? +q.high[i].toFixed(4)   : null,
      low:    q.low?.[i]    != null ? +q.low[i].toFixed(4)     : null,
      close:  q.close?.[i]  != null ? +q.close[i].toFixed(4)  : null,
      volume: q.volume?.[i] || 0,
    })).filter(c => c.open && c.high && c.low && c.close);

    // Filter to just the requested date (ET: UTC-4 or UTC-5, use UTC-5 to be safe)
    const dayStart = Math.floor(new Date(date + 'T13:00:00Z').getTime() / 1000);
    const dayEnd   = Math.floor(new Date(date + 'T22:00:00Z').getTime() / 1000);
    let dayCandles = allCandles.filter(c => c.time >= dayStart && c.time <= dayEnd);

    // Fallback: if filter finds nothing (e.g. day boundary edge case), return latest session
    if (!dayCandles.length && allCandles.length) {
      // Return the most-recent batch that looks like a single trading day
      const lastT = allCandles[allCandles.length-1].time;
      const sessionStart = lastT - 7 * 3600; // ~7 hours back
      dayCandles = allCandles.filter(c => c.time >= sessionStart);
    }

    res.json(dayCandles);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Routes: options ───────────────────────────────────────────────────────────
// Black-Scholes options chain (uses real underlying price + computed IV)
function normCDF(x) {
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const sign=x<0?-1:1; x=Math.abs(x)/Math.sqrt(2);
  const t=1/(1+p*x);
  const y=1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return 0.5*(1+sign*y);
}
function bsPrice(S,K,T,r,sigma,type) {
  if(T<=0) return type==='call'?Math.max(0,S-K):Math.max(0,K-S);
  const d1=(Math.log(S/K)+(r+sigma*sigma/2)*T)/(sigma*Math.sqrt(T));
  const d2=d1-sigma*Math.sqrt(T);
  if(type==='call') return S*normCDF(d1)-K*Math.exp(-r*T)*normCDF(d2);
  return K*Math.exp(-r*T)*normCDF(-d2)-S*normCDF(-d1);
}
function bsDelta(S,K,T,r,sigma,type) {
  if(T<=0) return type==='call'?(S>K?1:0):(S<K?-1:0);
  const d1=(Math.log(S/K)+(r+sigma*sigma/2)*T)/(sigma*Math.sqrt(T));
  return type==='call'?normCDF(d1):normCDF(d1)-1;
}
function bsTheta(S,K,T,r,sigma,type) {
  if(T<=0) return 0;
  const d1=(Math.log(S/K)+(r+sigma*sigma/2)*T)/(sigma*Math.sqrt(T));
  const d2=d1-sigma*Math.sqrt(T);
  const pdf=Math.exp(-d1*d1/2)/Math.sqrt(2*Math.PI);
  if(type==='call') return (-(S*pdf*sigma)/(2*Math.sqrt(T))-r*K*Math.exp(-r*T)*normCDF(d2))/365;
  return (-(S*pdf*sigma)/(2*Math.sqrt(T))+r*K*Math.exp(-r*T)*normCDF(-d2))/365;
}

function generateChain(S, expirationTs, iv) {
  const now = Date.now()/1000;
  const T = Math.max(0.001, (expirationTs - now) / (365*24*3600));
  const r = 0.053; // risk-free rate
  // Strike range: ±25% from underlying in ~5% steps, round to nice numbers
  const step = S < 10?0.5:S<50?1:S<200?5:S<500?10:S<1000?25:50;
  const minK = Math.round(S*0.75/step)*step, maxK = Math.round(S*1.25/step)*step;
  const strikes=[];for(let k=minK;k<=maxK;k+=step)strikes.push(parseFloat(k.toFixed(2)));

  const calls=[], puts=[];
  strikes.forEach(K=>{
    // Skew: OTM puts have higher IV (volatility smile)
    const moneyness = Math.log(S/K);
    const skew = Math.abs(moneyness)*0.3;
    const callIV = Math.max(0.05, iv + (K>S?skew*0.3:-skew*0.1));
    const putIV  = Math.max(0.05, iv + (K<S?skew*0.5: skew*0.1));

    const callPrice = bsPrice(S,K,T,r,callIV,'call');
    const putPrice  = bsPrice(S,K,T,r,putIV,'put');
    const callDelta = bsDelta(S,K,T,r,callIV,'call');
    const putDelta  = bsDelta(S,K,T,r,putIV,'put');
    const spread = Math.max(0.01, callPrice*0.04);

    calls.push({
      contractSymbol:`${S.toFixed(0)}${K}C`,strike:K,
      lastPrice:+callPrice.toFixed(2),bid:+(callPrice-spread).toFixed(2),ask:+(callPrice+spread).toFixed(2),
      impliedVolatility:+callIV.toFixed(4),delta:+callDelta.toFixed(3),
      theta:+bsTheta(S,K,T,r,callIV,'call').toFixed(4),
      volume:Math.floor(Math.random()*2000+100),openInterest:Math.floor(Math.random()*10000+500),
      inTheMoney:S>K,expiration:expirationTs,
    });
    puts.push({
      contractSymbol:`${S.toFixed(0)}${K}P`,strike:K,
      lastPrice:+putPrice.toFixed(2),bid:+(putPrice-spread).toFixed(2),ask:+(putPrice+spread).toFixed(2),
      impliedVolatility:+putIV.toFixed(4),delta:+putDelta.toFixed(3),
      theta:+bsTheta(S,K,T,r,putIV,'put').toFixed(4),
      volume:Math.floor(Math.random()*2000+100),openInterest:Math.floor(Math.random()*10000+500),
      inTheMoney:S<K,expiration:expirationTs,
    });
  });
  return { calls, puts };
}

app.get('/api/options/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const quote = await fetchQuote(symbol);
    const S = quote.price;

    // Estimate IV from day's move + a base (rough proxy for 30-day HV)
    const dayMoveIV = Math.abs(quote.changePct/100) * Math.sqrt(252);
    const baseIV = Math.max(0.15, Math.min(0.90, dayMoveIV + 0.20));

    // Generate expiration dates: next 6 Fridays + monthly
    const expirations = [];
    const d = new Date(); d.setHours(16,0,0,0);
    for (let i=0; i<8; i++) {
      const nd = new Date(d);
      // next Friday
      const daysUntilFri = (5 - nd.getDay() + 7) % 7 || 7;
      nd.setDate(nd.getDate() + daysUntilFri + i*7);
      expirations.push(Math.floor(nd.getTime()/1000));
    }
    // Deduplicate & sort
    const expTs = [...new Set(expirations)].sort((a,b)=>a-b).slice(0,6);

    const selectedExp = req.query.date ? parseInt(req.query.date) : expTs[0];
    const { calls, puts } = generateChain(S, selectedExp, baseIV);

    res.json({
      symbol, underlyingPrice: S,
      expirationDates: expTs,
      strikes: [...new Set([...calls.map(c=>c.strike)])],
      calls, puts,
      generatedIV: +baseIV.toFixed(3),
      note: 'Prices computed via Black-Scholes using live underlying price',
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/options/trade', async (req, res) => {
  const { contractSymbol, underlyingSymbol, optionType, strike, expiration, contracts, premium, action, impliedVolatility } = req.body;
  if (!contractSymbol || !contracts || contracts < 1 || !premium)
    return res.status(400).json({ error: 'Missing fields' });
  try {
    const portfolio = await readPortfolio();
    const history   = await readHistory();
    if (!portfolio.options) portfolio.options = {};
    const totalCost = premium * 100 * contracts;

    if (action === 'buy') {
      if (totalCost > portfolio.cash) return res.status(400).json({ error: `Insufficient funds. Need $${totalCost.toFixed(2)}` });
      portfolio.cash -= totalCost;
      if (portfolio.options[contractSymbol]) {
        const pos = portfolio.options[contractSymbol];
        const newContracts = pos.contracts + contracts;
        pos.avgPremium = +((pos.avgPremium * pos.contracts + totalCost) / newContracts).toFixed(4);
        pos.contracts  = newContracts;
      } else {
        portfolio.options[contractSymbol] = {
          contractSymbol, underlyingSymbol, optionType, strike, expiration,
          contracts, avgPremium: premium, totalCost,
          iv: impliedVolatility || 0.3,
          boughtAt: new Date().toISOString(),
        };
      }
    } else {
      const pos = portfolio.options[contractSymbol];
      if (!pos || pos.contracts < contracts) return res.status(400).json({ error: 'Not enough contracts' });
      portfolio.cash += totalCost;
      pos.contracts -= contracts;
      if (pos.contracts === 0) delete portfolio.options[contractSymbol];
    }

    history.push({ id: Date.now(), symbol: contractSymbol, name: `${underlyingSymbol} ${strike}${optionType === 'call' ? 'C' : 'P'}`, action, shares: contracts * 100, price: premium, total: +totalCost.toFixed(2), orderType: 'option', timestamp: new Date().toISOString() });
    await Promise.all([writePortfolio(portfolio), writeHistory(history)]);
    res.json({ success: true, cash: +portfolio.cash.toFixed(2) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: clear all options ──────────────────────────────────────────────────
app.post('/api/admin/clear-options', async (req, res) => {
  const portfolio = await readPortfolio();
  // Refund premiums for all open positions back to cash
  for (const pos of Object.values(portfolio.options || {})) {
    portfolio.cash += pos.avgPremium * 100 * pos.contracts;
  }
  portfolio.options = {};
  await writePortfolio(portfolio);
  res.json({ success: true, cash: +portfolio.cash.toFixed(2) });
});

// ── Routes: search ────────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  try { res.json(await fetchSearch(req.query.q || '')); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Routes: portfolio ─────────────────────────────────────────────────────────
app.get('/api/portfolio', async (req, res) => {
  try {
    const portfolio = await readPortfolio();
    if (!portfolio.options) portfolio.options = {};
    const symbols = Object.keys(portfolio.holdings);
    let quotes = [];
    if (symbols.length) {
      const results = await Promise.allSettled(symbols.map(fetchQuote));
      quotes = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    }

    // Check orders against current prices
    for (const q of quotes) await checkAndFillOrders(q.symbol, q.price);

    let marketValue = 0, totalCostBasis = 0;
    const enriched = {};
    for (const sym of symbols) {
      const h  = portfolio.holdings[sym];
      const q  = quotes.find(x => x.symbol === sym);
      const cp = q?.price || h.avgCost;
      const val = cp * h.shares, cost = h.avgCost * h.shares;
      enriched[sym] = { ...h, currentPrice: cp, value: +val.toFixed(2), costBasis: +cost.toFixed(2), pnl: +(val-cost).toFixed(2), pnlPct: +((val-cost)/cost*100).toFixed(2), change: q?.change || 0, changePct: q?.changePct || 0, name: q?.name || h.name || sym };
      marketValue += val; totalCostBasis += cost;
    }

    // Options current value via Black-Scholes
    let optionsValue = 0;
    const enrichedOptions = {};
    for (const [cs, pos] of Object.entries(portfolio.options || {})) {
      const uq = quotes.find(x => x.symbol === pos.underlyingSymbol) || await fetchQuote(pos.underlyingSymbol).catch(() => null);
      const up = uq?.price || 0;
      const T = Math.max(0.0001, (pos.expiration - Date.now()/1000) / (365*24*3600));
      const estPrice = up > 0 ? Math.max(0.01, bsVal(up, pos.strike, T, 0.053, pos.iv||0.3, pos.optionType)) : pos.avgPremium;
      const currentVal = estPrice * 100 * pos.contracts;
      const costVal    = pos.avgPremium * 100 * pos.contracts;
      enrichedOptions[cs] = { ...pos, underlyingPrice: up, currentPrice: +estPrice.toFixed(2), currentValue: +currentVal.toFixed(2), pnl: +(currentVal - costVal).toFixed(2), pnlPct: +((currentVal - costVal) / costVal * 100).toFixed(2) };
      optionsValue += currentVal;
    }

    const totalValue = portfolio.cash + marketValue + optionsValue;
    res.json({
      cash: +portfolio.cash.toFixed(2),
      marketValue: +marketValue.toFixed(2),
      optionsValue: +optionsValue.toFixed(2),
      totalValue: +totalValue.toFixed(2),
      totalPnl: +(totalValue - STARTING_CASH).toFixed(2),
      totalPnlPct: +((totalValue - STARTING_CASH) / STARTING_CASH * 100).toFixed(2),
      realizedPnl: +(portfolio.realizedPnl || 0).toFixed(2),
      holdings: enriched,
      options: enrichedOptions,
      createdAt: portfolio.createdAt,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Routes: trade ─────────────────────────────────────────────────────────────
app.post('/api/trade', async (req, res) => {
  const { symbol, action, shares, stopLoss, takeProfit, limitPrice, orderType = 'market' } = req.body;
  if (!symbol || !action || !shares || shares <= 0) return res.status(400).json({ error: 'Invalid trade' });
  if (!['buy', 'sell'].includes(action)) return res.status(400).json({ error: 'Action must be buy or sell' });

  try {
    const quote     = await fetchQuote(symbol.toUpperCase());
    const portfolio = await readPortfolio();
    const history   = await readHistory();
    const orders    = await readOrders();

    // For limit orders, just queue them
    if (orderType === 'limit' || orderType === 'stop') {
      if (!limitPrice) return res.status(400).json({ error: 'limitPrice required for limit/stop orders' });
      const order = {
        id: Date.now(), symbol: quote.symbol, name: quote.name, action, shares,
        orderType: orderType === 'limit' ? (action === 'buy' ? 'limit-buy' : 'limit-sell') : (action === 'buy' ? 'stop-limit-buy' : 'stop-limit-sell'),
        triggerPrice: limitPrice,
        status: 'pending', createdAt: new Date().toISOString(),
      };
      orders.push(order);
      await writeOrders(orders);
      return res.json({ success: true, queued: true, order });
    }

    // Market order
    const fillPrice = quote.price;
    const totalCost = fillPrice * shares;

    if (action === 'buy') {
      if (totalCost > portfolio.cash) return res.status(400).json({ error: `Need $${totalCost.toLocaleString('en-US',{minimumFractionDigits:2})} but have $${portfolio.cash.toLocaleString('en-US',{minimumFractionDigits:2})}` });
      portfolio.cash -= totalCost;
      if (portfolio.holdings[quote.symbol]) {
        const h = portfolio.holdings[quote.symbol];
        const ns = h.shares + shares;
        h.avgCost = +((h.avgCost * h.shares + totalCost) / ns).toFixed(4);
        h.shares  = ns;
      } else {
        portfolio.holdings[quote.symbol] = { symbol: quote.symbol, name: quote.name, shares, avgCost: fillPrice, boughtAt: new Date().toISOString() };
      }
      // Auto-create stop loss / take profit orders
      if (stopLoss) orders.push({ id: Date.now()+1, symbol: quote.symbol, name: quote.name, action: 'sell', shares, orderType: 'stop-loss', triggerPrice: stopLoss, status: 'pending', createdAt: new Date().toISOString() });
      if (takeProfit) orders.push({ id: Date.now()+2, symbol: quote.symbol, name: quote.name, action: 'sell', shares, orderType: 'take-profit', triggerPrice: takeProfit, status: 'pending', createdAt: new Date().toISOString() });
    } else {
      const h = portfolio.holdings[quote.symbol];
      if (!h || h.shares < shares) return res.status(400).json({ error: `You only own ${h?.shares || 0} shares` });
      const pnl = (fillPrice - h.avgCost) * shares;
      portfolio.cash += totalCost;
      portfolio.realizedPnl = (portfolio.realizedPnl || 0) + pnl;
      h.shares -= shares;
      if (h.shares === 0) delete portfolio.holdings[quote.symbol];
    }

    const trade = { id: Date.now(), symbol: quote.symbol, name: quote.name, action, shares, price: fillPrice, total: +totalCost.toFixed(2), orderType, stopLoss: stopLoss || null, takeProfit: takeProfit || null, timestamp: new Date().toISOString() };
    history.push(trade);
    await Promise.all([writePortfolio(portfolio), writeHistory(history), writeOrders(orders)]);
    res.json({ success: true, trade, cash: +portfolio.cash.toFixed(2) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Routes: orders ────────────────────────────────────────────────────────────
app.get('/api/orders', async (req, res) => {
  try { res.json(await readOrders()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const orders = (await readOrders()).filter(o => o.id !== parseInt(req.params.id));
    await writeOrders(orders);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Manually trigger order check (called by frontend on price updates)
app.post('/api/orders/check', async (req, res) => {
  try {
    const { symbol, price } = req.body;
    const triggered = await checkAndFillOrders(symbol, price);
    res.json({ triggered });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Routes: history ───────────────────────────────────────────────────────────
app.get('/api/history', async (req, res) => {
  try { res.json((await readHistory()).slice().reverse().slice(0, 200)); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Routes: market status ─────────────────────────────────────────────────────
app.get('/api/market-status', (req, res) => {
  const etStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const et = new Date(etStr);
  const h = et.getHours(), m = et.getMinutes(), day = et.getDay(), t = h * 60 + m;
  const isWeekend = day === 0 || day === 6;
  let status = 'closed';
  if (!isWeekend) {
    if (t >= 570 && t < 960)   status = 'open';
    else if (t >= 240 && t < 570) status = 'pre-market';
    else if (t >= 960 && t < 1200) status = 'after-hours';
  }
  res.json({ status, etHour: h, etMin: m, day, isWeekend });
});

// ── Routes: reset ─────────────────────────────────────────────────────────────
app.post('/api/reset', async (req, res) => {
  const init = { cash: STARTING_CASH, holdings: {}, options: {}, createdAt: new Date().toISOString() };
  await Promise.all([writePortfolio(init), writeHistory([]), writeOrders([])]);
  res.json({ success: true });
});

// Local dev: listen on port. Vercel: export the app.
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => console.log(`\n  Jay Trading → http://localhost:${PORT}\n`));
}

export default app;
