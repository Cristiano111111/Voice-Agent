// Sends tailored X/Twitter DMs to leads found by x-leads.js
// Message differs based on whether they need videos or ads
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.APIFY_API_KEY;
const TWITTER_EMAIL = process.env.TWITTER_EMAIL;
const TWITTER_PASSWORD = process.env.TWITTER_PASSWORD;

const LOG_PATH = path.join(__dirname, '..', 'memory', 'x-leads-log.json');
const SENT_PATH = path.join(__dirname, '..', 'memory', 'x-dm-sent.json');

const BATCH_SIZE = 10;
const DELAY_MS = 90000; // 90s between DMs on X (stricter than IG)

const MESSAGES = {
  video: `Hey! Saw your post — I make short motion graphic explainer videos for startups and product launches. The kind that makes your product click in under 30 seconds.

Check out jayrx.net — 50% off your first video since you're seeing this.

Interested?`,

  ads: `Hey! Saw your post — I help brands scale on Meta (ad creatives + full campaign management). Most clients hit 2-3x ROAS within 60 days.

Check out jayrx.net — first month at cost, no markup on ad spend.

Worth a chat?`,
};

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) return { leads: [] };
  return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
}

function loadSent() {
  if (!fs.existsSync(SENT_PATH)) return { sent: [] };
  return JSON.parse(fs.readFileSync(SENT_PATH, 'utf-8'));
}

function saveSent(data) {
  fs.writeFileSync(SENT_PATH, JSON.stringify(data, null, 2));
}

async function sendDM(username, message) {
  const res = await fetch(`https://api.apify.com/v2/acts/apidojo~twitter-dm-scraper/run-sync-get-dataset-items?token=${TOKEN}&timeout=60`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: TWITTER_EMAIL,
      password: TWITTER_PASSWORD,
      recipients: [username],
      message,
    }),
  }).catch(() => null);

  if (!res || !res.ok) {
    // Fallback actor
    const res2 = await fetch(`https://api.apify.com/v2/acts/quacker~twitter-dm/run-sync-get-dataset-items?token=${TOKEN}&timeout=60`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        twitterUsername: TWITTER_EMAIL,
        twitterPassword: TWITTER_PASSWORD,
        recipientUsername: username,
        message,
      }),
    });
    if (!res2.ok) throw new Error(`DM actor returned ${res2.status}`);
    return res2.json();
  }
  return res.json();
}

async function run() {
  const log = loadLog();
  const sentLog = loadSent();
  const sentSet = new Set(sentLog.sent.map(s => s.username));

  const queue = log.leads.filter(l => !sentSet.has(l.username));
  const batch = queue.slice(0, BATCH_SIZE);

  if (batch.length === 0) {
    console.log('Queue empty. Run x-leads.js to find more.');
    return;
  }

  console.log(`Sending ${batch.length} DMs (${queue.length - batch.length} remaining)\n`);

  for (let i = 0; i < batch.length; i++) {
    const lead = batch[i];
    const message = MESSAGES[lead.service] || MESSAGES.video;

    try {
      process.stdout.write(`[${i + 1}/${batch.length}] @${lead.username} [${lead.service}] ... `);
      await sendDM(lead.username, message);
      console.log('sent');
      sentLog.sent.push({ username: lead.username, service: lead.service, sentAt: new Date().toISOString() });
      saveSent(sentLog);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }

    if (i < batch.length - 1) {
      const nextTime = new Date(Date.now() + DELAY_MS).toLocaleTimeString();
      console.log(`    waiting 90s (next at ${nextTime})...`);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nDone.`);
}

run().catch(console.error);
