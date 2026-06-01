import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
puppeteerExtra.use(StealthPlugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEEN_PATH = path.join(__dirname, '..', 'memory', 'ph-seen.json');

function loadSeen() {
  if (!fs.existsSync(SEEN_PATH)) return { slugs: [] };
  return JSON.parse(fs.readFileSync(SEEN_PATH, 'utf-8'));
}
function saveSeen(data) {
  fs.writeFileSync(SEEN_PATH, JSON.stringify(data, null, 2));
}
function todayString() {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

let browser, page;

async function initBrowser() {
  browser = await puppeteerExtra.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
}

async function getHTML(url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  return page.content();
}

async function getDailyProducts() {
  const url = `https://www.producthunt.com/leaderboard/daily/${todayString()}`;
  console.log(`Fetching leaderboard: ${url}`);
  const html = await getHTML(url);

  const products = [];
  const postMatches = [...html.matchAll(/"__typename":"Post","id":"(\d+)"[^}]*?"name":"([^"]+)","slug":"([^"]+)","tagline":"([^"]+)"/g)];
  postMatches.forEach(m => {
    if (!products.find(p => p.id === m[1])) {
      products.push({ id: m[1], name: m[2], slug: m[3], tagline: m[4] });
    }
  });
  return products;
}

async function getProductMakers(slug) {
  const url = `https://www.producthunt.com/posts/${slug}`;
  const html = await getHTML(url);

  const twitterHandles = [...new Set(
    [...html.matchAll(/"twitterUsername":"([^"]+)"/g)].map(m => m[1]).filter(Boolean)
  )];

  const makerNames = [...new Set(
    [...html.matchAll(/"name":"([A-Z][a-zA-Z ]{2,40})"/g)].map(m => m[1])
  )].slice(0, 3);

  // Also grab headline/maker usernames
  const usernames = [...new Set(
    [...html.matchAll(/"username":"([a-z0-9_]{2,30})"/g)].map(m => m[1])
  )].slice(0, 3);

  return { twitterHandles, makerNames, usernames, url };
}

async function sendLeadEmail(leads) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const lines = leads.map((p, i) => {
    const twitter = p.twitterHandles.length > 0
      ? p.twitterHandles.map(h => `@${h} → https://x.com/${h}`).join('\n   ')
      : `PH profile: https://www.producthunt.com/@${p.usernames[0] || 'unknown'}`;

    return `${i + 1}. ${p.name}
   "${p.tagline}"
   PH: ${p.url}
   Twitter: ${twitter}

   DM: "Hey — congrats on the launch! I make short motion graphic explainers for startups. Might be perfect timing. jayrx.net"`;
  });

  const body = `Jay — ${leads.length} new Product Hunt launches to DM today (${today}):\n\n${lines.join('\n\n---\n\n')}`;

  await transporter.sendMail({
    from: `Jay <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `Jay — ${leads.length} PH launches to DM (${today})`,
    text: body,
  });

  console.log(`\nEmail sent to ${process.env.GMAIL_USER}`);
}

async function run() {
  await initBrowser();
  const seen = loadSeen();
  const seenSet = new Set(seen.slugs);

  const products = await getDailyProducts();
  console.log(`Found ${products.length} products on today's leaderboard`);

  const newProducts = products.filter(p => !seenSet.has(p.slug));
  console.log(`${newProducts.length} new (not yet seen)\n`);

  if (newProducts.length === 0) {
    console.log('No new launches since last check.');
    return;
  }

  const leads = [];
  for (const product of newProducts) {
    process.stdout.write(`  ${product.name}... `);
    try {
      const makers = await getProductMakers(product.slug);
      const lead = { ...product, ...makers };
      leads.push(lead);
      seen.slugs.push(product.slug);

      const tw = makers.twitterHandles.map(h => '@' + h).join(', ') || 'none';
      console.log(`twitter: ${tw}`);
    } catch (err) {
      console.log(`error: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  saveSeen(seen);

  // Console summary
  console.log('\n=== TODAY\'S LEADS ===');
  leads.forEach((p, i) => {
    const tw = p.twitterHandles?.map(h => '@' + h).join(', ') || 'none';
    console.log(`\n${i + 1}. ${p.name}`);
    console.log(`   "${p.tagline}"`);
    console.log(`   Twitter: ${tw}`);
    console.log(`   ${p.url}`);
  });

  if (leads.length > 0) {
    console.log('\nSending email summary...');
    await sendLeadEmail(leads);
  }
}

run().catch(console.error).finally(() => browser?.close());
