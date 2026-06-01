import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEEN_PATH = path.join(__dirname, '..', 'memory', 'x-seen.json');

const SEARCH_QUERIES = [
  'just launched startup explainer',
  'we launched AI startup',
  'just shipped product YC',
  'launching today startup video',
  'just went live startup',
];

function loadSeen() {
  if (!fs.existsSync(SEEN_PATH)) return { urls: [] };
  return JSON.parse(fs.readFileSync(SEEN_PATH, 'utf-8'));
}

function saveSeen(data) {
  fs.writeFileSync(SEEN_PATH, JSON.stringify(data, null, 2));
}

async function login(page) {
  console.log('Logging into X...');
  await page.goto('https://x.com/login', { waitUntil: 'networkidle2', timeout: 30000 });

  // Step 1: username/email
  await page.waitForSelector('input[autocomplete="username"]', { timeout: 15000 });
  await page.click('input[autocomplete="username"]');
  await page.type('input[autocomplete="username"]', process.env.TWITTER_EMAIL, { delay: 80 });
  await new Promise(r => setTimeout(r, 500));
  // Click the Next button
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button, div[role="button"]')];
    const next = btns.find(b => b.innerText?.trim() === 'Next');
    if (next) next.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // Step 2: X sometimes asks "enter your phone or username" as a verification step
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.toLowerCase().includes('phone') || (bodyText.toLowerCase().includes('unusual') )) {
    console.log('Verification step detected, entering username...');
    const verifyInput = await page.$('input[name="text"]');
    if (verifyInput) {
      await verifyInput.click();
      await verifyInput.type('jayrx16', { delay: 80 });
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button, div[role="button"]')];
        const next = btns.find(b => b.innerText?.trim() === 'Next');
        if (next) next.click();
      });
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Step 3: password
  await page.waitForSelector('input[type="password"]', { timeout: 15000 });
  await page.click('input[type="password"]');
  await page.type('input[type="password"]', process.env.TWITTER_PASSWORD, { delay: 80 });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button, div[role="button"]')];
    const login = btns.find(b => b.innerText?.trim() === 'Log in');
    if (login) login.click();
  });
  await new Promise(r => setTimeout(r, 5000));
  console.log('Logged in.');
}

async function searchAndScrape(page, query) {
  const encoded = encodeURIComponent(`${query} -filter:replies lang:en`);
  const url = `https://x.com/search?q=${encoded}&f=live`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Scroll to load more tweets
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, 1200));
    await new Promise(r => setTimeout(r, 1500));
  }

  const tweets = await page.evaluate(() => {
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    const results = [];

    for (const article of articles) {
      const textEl = article.querySelector('[data-testid="tweetText"]');
      const text = textEl?.innerText?.trim() || '';

      const linkEl = article.querySelector('a[href*="/status/"]');
      const href = linkEl?.getAttribute('href') || '';
      const tweetUrl = href ? `https://x.com${href}` : '';

      const handleEl = article.querySelector('[data-testid="User-Name"] a');
      const handle = handleEl?.getAttribute('href')?.replace('/', '@') || '';

      const nameEl = article.querySelector('[data-testid="User-Name"] span');
      const name = nameEl?.innerText?.trim() || '';

      if (text && tweetUrl) {
        results.push({ text, tweetUrl, handle, name });
      }
    }
    return results;
  });

  return tweets;
}

async function sendLeadAlert(leads) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const lines = leads.map((l, i) =>
    `${i + 1}. ${l.name} (${l.handle})\n   "${l.text.slice(0, 120)}..."\n   ${l.tweetUrl}\n\n   DM: "Hey — saw you launched. I make short motion graphic explainers for AI startups. Might be perfect timing. jayrx.net"`
  );

  const body = `Jay — ${leads.length} new launch leads found on X:\n\n${lines.join('\n\n---\n\n')}`;

  await transporter.sendMail({
    from: `Jay <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `Jay — ${leads.length} new X leads to DM`,
    text: body,
  });

  console.log(`Alert sent with ${leads.length} leads.`);
}

async function run() {
  const seen = loadSeen();
  const seenSet = new Set(seen.urls);
  const allNewLeads = [];

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    await login(page);

    for (const query of SEARCH_QUERIES) {
      console.log(`Searching: "${query}"`);
      const tweets = await searchAndScrape(page, query);
      console.log(`  Found ${tweets.length} tweets`);

      for (const tweet of tweets) {
        if (!seenSet.has(tweet.tweetUrl) && tweet.tweetUrl) {
          allNewLeads.push(tweet);
          seenSet.add(tweet.tweetUrl);
          seen.urls.push(tweet.tweetUrl);
        }
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    saveSeen(seen);
    console.log(`\nTotal new leads: ${allNewLeads.length}`);

    if (allNewLeads.length > 0) {
      await sendLeadAlert(allNewLeads);
    } else {
      console.log('No new leads since last check.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

run();
