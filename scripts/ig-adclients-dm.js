// Sends Meta ad scaling pitch to ecom brands found by ig-adclients.js
// Same safe pattern: 1 DM/min, 15 per session
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.APIFY_API_KEY;
const SESSION_ID = process.env.INSTAGRAM_SESSION_ID;

const SEEN_PATH = path.join(__dirname, '..', 'memory', 'ig-adclients-seen.json');
const SENT_PATH = path.join(__dirname, '..', 'memory', 'ig-adclients-sent.json');

const BATCH_SIZE = 15;

const MESSAGE = `Hey! I help ecom brands scale on Meta — ad creatives + full campaign management. Most of my clients 2-3x their ROAS within 60 days.

Check out jayrx.net — and since you're getting this DM, first month is at cost (no markup on ad spend).

Worth a quick chat?`;

function loadSeen() {
  if (!fs.existsSync(SEEN_PATH)) return { usernames: [] };
  return JSON.parse(fs.readFileSync(SEEN_PATH, 'utf-8'));
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
  if (!json.data?.id) throw new Error(`Failed to start DM run: ${JSON.stringify(json)}`);
  return json.data.id;
}

async function run() {
  const seen = loadSeen();
  const sentLog = loadSent();
  const sentSet = new Set(sentLog.sent.map(s => s.username));

  const queue = seen.usernames.filter(u => !sentSet.has(u));
  const batch = queue.slice(0, BATCH_SIZE);

  if (batch.length === 0) {
    console.log('Queue empty. Run ig-adclients.js to find more brands.');
    return;
  }

  const remaining = queue.length - batch.length;
  console.log(`Sending ${batch.length} DMs (${remaining} remaining after this)\n`);

  for (let i = 0; i < batch.length; i++) {
    const username = batch[i];
    try {
      process.stdout.write(`[${i + 1}/${batch.length}] @${username} ... `);
      const runId = await dmOne(username);
      console.log(`sent (run: ${runId})`);
      sentLog.sent.push({ username, runId, sentAt: new Date().toISOString() });
      saveSent(sentLog);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }

    if (i < batch.length - 1) {
      const nextTime = new Date(Date.now() + 60000).toLocaleTimeString();
      console.log(`    waiting 60s (next at ${nextTime})...`);
      await new Promise(r => setTimeout(r, 60000));
    }
  }

  console.log(`\nDone. ${batch.length} DMs sent.`);
  if (remaining > 0) console.log(`${remaining} left in queue — run again in a few hours.`);
  else console.log(`Queue empty. Run ig-adclients.js to find more.`);
}

run().catch(console.error);
