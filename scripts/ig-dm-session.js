// Sends 15 DMs, 1 per minute. Run this 3-4x per day.
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.APIFY_API_KEY;
const SESSION_ID = process.env.INSTAGRAM_SESSION_ID;

const QUEUE_PATH = path.join(__dirname, '..', 'memory', 'ig-seen.json');
const SENT_PATH  = path.join(__dirname, '..', 'memory', 'ig-dm-sent.json');

const BATCH_SIZE    = 15;
const DELAY_MS      = 60 * 1000; // 1 minute between each DM

const MESSAGE = `Hey! I make short motion graphic explainer videos for startups — the kind that makes your product click in under 30 seconds.

Check out jayrx.net — and since you're getting this DM, you get 50% off your first video 🎬

Interested?`;

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8')).usernames || [];
}

function loadSent() {
  if (!fs.existsSync(SENT_PATH)) return { sent: [] };
  return JSON.parse(fs.readFileSync(SENT_PATH, 'utf-8'));
}

function saveSent(data) {
  fs.writeFileSync(SENT_PATH, JSON.stringify(data, null, 2));
}

async function dmOne(username) {
  const res = await fetch(`https://api.apify.com/v2/acts/aqd2l2tPvV8IZTqji/runs?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipients: username,
      message: MESSAGE,
      sessionId: SESSION_ID,
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data.id;
}

async function run() {
  const queue = loadQueue();
  const sentLog = loadSent();
  const sentSet = new Set(sentLog.sent.map(e => e.username));

  const pending = queue.filter(u => !sentSet.has(u));

  if (pending.length === 0) {
    console.log('Queue empty — run ig-outreach.js to scrape more accounts.');
    return;
  }

  const batch = pending.slice(0, BATCH_SIZE);
  console.log(`Sending ${batch.length} DMs (${pending.length - batch.length} remaining after this)\n`);

  for (let i = 0; i < batch.length; i++) {
    const username = batch[i];
    process.stdout.write(`[${i + 1}/${batch.length}] @${username} ... `);

    try {
      const runId = await dmOne(username);
      console.log(`sent (run: ${runId})`);
      sentLog.sent.push({ username, runId, sentAt: new Date().toISOString() });
      saveSent(sentLog);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }

    if (i < batch.length - 1) {
      const next = new Date(Date.now() + DELAY_MS);
      console.log(`    waiting 60s (next at ${next.toLocaleTimeString()})...`);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  const remaining = pending.length - batch.length;
  console.log(`\nDone. ${batch.length} DMs sent.`);
  if (remaining > 0) {
    console.log(`${remaining} left — run this script again in a couple hours.`);
  } else {
    console.log('All accounts DM\'d. Run ig-outreach.js to find more.');
  }
}

run().catch(console.error);
