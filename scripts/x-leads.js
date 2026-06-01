// Searches X/Twitter for people asking for launch videos or Meta ads help
// Uses Puppeteer with your Twitter login — no Apify credits needed
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
puppeteerExtra.use(StealthPlugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TWITTER_EMAIL = process.env.TWITTER_EMAIL;
const TWITTER_PASSWORD = process.env.TWITTER_PASSWORD;

const SEEN_PATH = path.join(__dirname, '..', 'memory', 'x-leads-seen.json');
const LOG_PATH = path.join(__dirname, '..', 'memory', 'x-leads-log.json');

const SEARCHES = [
  { query: '"need a launch video" OR "looking for a video editor" OR "need motion graphics"', service: 'video' },
  { query: '"product launch" ("need someone" OR "looking for someone") video', service: 'video' },
  { query: '"explainer video" (recommendations OR "looking for" OR "anyone know")', service: 'video' },
  { query: 'launching saas "need" (video OR creative OR designer)', service: 'video' },
  { query: '"need help with facebook ads" OR "need help with meta ads" OR "facebook ads not working"', service: 'ads' },
  { query: '"looking for" ("ads manager" OR "media buyer" OR "facebook ads expert")', service: 'ads' },
  { query: '"struggling with" ("facebook ads" OR "meta ads" OR ROAS)', service: 'ads' },
  { query: '"run my ads" OR "run our ads" (facebook OR meta OR instagram)', service: 'ads' },
];

function loadSeen() {
  if (!fs.existsSync(SEEN_PATH)) return { usernames: [] };
  return JSON.parse(fs.readFileSync(SEEN_PATH, 'utf-8'));
}

function saveSeen(data) {
  fs.writeFileSync(SEEN_PATH, JSON.stringify(data, null, 2));
}

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) return { leads: [] };
  return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
}

function saveLog(data) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(data, null, 2));
}

async function login(page) {
  console.log('Logging into X...');
  await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // New X login flow: both fields on one page
  const emailSel = 'input[name="username_or_email"], input[autocomplete="username"]';
  await page.waitForSelector(emailSel, { timeout: 15000 });
  await page.type(emailSel, TWITTER_EMAIL, { delay: 80 });
  await new Promise(r => setTimeout(r, 800));

  await page.waitForSelector('input[name="password"]', { timeout: 10000 });
  await page.type('input[name="password"]', TWITTER_PASSWORD, { delay: 80 });
  await new Promise(r => setTimeout(r, 500));

  // Click login button or press Enter
  const loginBtn = await page.$('button[type="submit"], button[data-testid="LoginButton"]').catch(() => null);
  if (loginBtn) await loginBtn.click();
  else await page.keyboard.press('Enter');

  await new Promise(r => setTimeout(r, 5000));
  console.log('Logged in. Current URL:', page.url());
}

async function searchTweets(page, query) {
  const encoded = encodeURIComponent(query + ' lang:en -is:retweet');
  await page.goto(`https://x.com/search?q=${encoded}&f=live`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Scroll to load more tweets
  await page.evaluate(() => window.scrollBy(0, 1500));
  await new Promise(r => setTimeout(r, 2000));

  return page.evaluate(() => {
    const articles = [...document.querySelectorAll('article[data-testid="tweet"]')];
    return articles.map(article => {
      const userLink = article.querySelector('a[href*="/status/"]');
      const tweetUrl = userLink?.href || '';
      const parts = tweetUrl.match(/x\.com\/([^/]+)\/status\/(\d+)/);
      const username = parts?.[1];
      const tweetId = parts?.[2];
      const text = article.querySelector('[data-testid="tweetText"]')?.innerText || '';
      const followerEl = article.querySelector('[href$="/followers"] span');
      return { username, tweetId, tweetUrl, text: text.slice(0, 300) };
    }).filter(t => t.username && t.username !== 'undefined');
  });
}

async function run() {
  const seen = loadSeen();
  const seenSet = new Set(seen.usernames);
  const log = loadLog();
  const newLeads = [];

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    await login(page);

    for (const search of SEARCHES) {
      console.log(`\n[${search.service.toUpperCase()}] ${search.query.slice(0, 70)}...`);

      let tweets;
      try {
        tweets = await searchTweets(page, search.query);
      } catch (err) {
        console.log(`  Error: ${err.message}`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      console.log(`  Found ${tweets.length} tweets`);

      for (const tweet of tweets) {
        if (!tweet.username) continue;
        if (seenSet.has(tweet.username)) continue;
        // Skip obvious bots/spam accounts
        if (/bot|spam|promo|follow/i.test(tweet.username)) continue;

        seenSet.add(tweet.username);
        seen.usernames.push(tweet.username);

        const lead = {
          username: tweet.username,
          service: search.service,
          tweetText: tweet.text,
          tweetUrl: tweet.tweetUrl,
          foundAt: new Date().toISOString(),
        };

        newLeads.push(lead);
        log.leads.push(lead);
        console.log(`  + @${tweet.username} — ${tweet.text.slice(0, 70)}`);
      }

      saveSeen(seen);
      saveLog(log);
      await new Promise(r => setTimeout(r, 4000));
    }
  } finally {
    await browser.close();
  }

  const videoLeads = newLeads.filter(l => l.service === 'video').length;
  const adsLeads = newLeads.filter(l => l.service === 'ads').length;
  console.log(`\n${newLeads.length} new leads found — ${videoLeads} video, ${adsLeads} ads`);
  console.log(`Run "node scripts/x-dm.js" to contact them`);
}

run().catch(console.error);
