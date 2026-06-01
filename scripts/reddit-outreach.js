// Sends Reddit PMs via API token; skips users with DMs disabled
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.REDDIT_TOKEN;
const USERNAME = process.env.REDDIT_USERNAME;

const LOG_PATH = path.join(__dirname, '..', 'memory', 'reddit-leads.json');

const BATCH_SIZE = 20;
const DELAY_MS = 30000; // 30s between successful sends only

const MESSAGES = {
  video: `Hey! Saw your post — I make short motion graphic explainer videos for SaaS products and launches. The kind that makes your product click in under 30 seconds.

Check out [jayrx.net](https://jayrx.net) — and since you saw this, 50% off your first video.

Interested?`,

  ads: `Hey! Saw your post — I help brands scale on Meta (ad creatives + full campaign management). Most clients see 2-3x ROAS improvement within 60 days.

Check out [jayrx.net](https://jayrx.net) — first month at cost, no markup on ad spend.

Worth a quick chat?`,
};

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) return { leads: [] };
  return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
}

function saveLog(data) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(data, null, 2));
}

async function sendPM(to, subject, text) {
  const body = new URLSearchParams({ api_type: 'json', to, subject, text });
  const res = await fetch('https://oauth.reddit.com/api/compose', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'User-Agent': `OutreachBot/1.0 by ${USERNAME}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  const json = await res.json();
  const errors = json?.json?.errors;
  if (errors?.length > 0) {
    const errMsg = errors[0].join(': ');
    const err = new Error(errMsg);
    err.code = errors[0][0]; // e.g. RESTRICTED_TO_PM
    throw err;
  }
  if (!res.ok) throw new Error(`Reddit API ${res.status}`);
  return json;
}

async function run() {
  const log = loadLog();
  const queue = log.leads.filter(l => !l.contacted && !l.dmDisabled);
  const batch = queue.slice(0, BATCH_SIZE);

  if (batch.length === 0) {
    const disabled = log.leads.filter(l => l.dmDisabled).length;
    console.log(`No sendable leads. Run reddit-leads.js to find more. (${disabled} leads have DMs disabled)`);
    return;
  }

  console.log(`Processing ${batch.length} leads (${queue.length - batch.length} remaining after this)\n`);

  let sent = 0;
  for (let i = 0; i < batch.length; i++) {
    const lead = batch[i];
    const message = MESSAGES[lead.service] || MESSAGES.video;
    const idx = log.leads.findIndex(l => l.username === lead.username && l.postUrl === lead.postUrl);

    process.stdout.write(`[${i + 1}/${batch.length}] u/${lead.username} [${lead.service}] ... `);

    try {
      await sendPM(lead.username, 'Quick question', message);
      console.log('sent ✓');
      if (idx !== -1) log.leads[idx].contacted = true;
      saveLog(log);
      sent++;

      // Only delay between successful sends
      if (i < batch.length - 1) {
        const nextTime = new Date(Date.now() + DELAY_MS).toLocaleTimeString();
        console.log(`    waiting 30s (next at ${nextTime})...`);
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    } catch (pmErr) {
      if (pmErr.code === 'RESTRICTED_TO_PM') {
        console.log('DMs disabled — skipping');
        if (idx !== -1) log.leads[idx].dmDisabled = true;
      } else {
        console.log(`ERROR: ${pmErr.message}`);
      }
      saveLog(log);
    }
  }

  const totalSent = log.leads.filter(l => l.contacted).length;
  const remaining = log.leads.filter(l => !l.contacted && !l.dmDisabled).length;
  const disabled = log.leads.filter(l => l.dmDisabled).length;
  console.log(`\nDone. ${sent} sent this batch | ${totalSent} total sent | ${remaining} remaining | ${disabled} unreachable`);
  if (remaining > 0) console.log(`Run again to send the next batch.`);
}

run().catch(console.error);
