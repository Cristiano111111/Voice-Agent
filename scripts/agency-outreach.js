// Cold email outreach to agencies from agency-leads.csv
// Uses Resend API — sends white-label creative pitch
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL;

const CSV_PATH = path.join(__dirname, '..', 'memory', 'agency-leads.csv');
const SENT_LOG = path.join(__dirname, '..', 'memory', 'agency-outreach-sent.json');

const DAILY_LIMIT = 80;
const DELAY_MS = 2500;

function loadSent() {
  if (!fs.existsSync(SENT_LOG)) return { sent: [] };
  return JSON.parse(fs.readFileSync(SENT_LOG, 'utf-8'));
}

function saveSent(data) {
  fs.writeFileSync(SENT_LOG, JSON.stringify(data, null, 2));
}

function parseCSV(raw) {
  const lines = raw.trim().split('\n');
  const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const cols = []; let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
      else cur += ch;
    }
    cols.push(cur);
    const obj = {};
    header.forEach((h, i) => obj[h] = cols[i] || '');
    return obj;
  });
}

function buildEmail(agency) {
  const name = agency['Agency Name'];
  const subject = `White-label ad creatives for ${name}`;

  const html = `<p>Hey ${name} team,</p>

<p>I produce ad creatives — motion graphics, short video ads, and static — for agencies on a white-label basis.</p>

<p>The deal is simple: you handle the client and strategy, I produce the work at wholesale rates, you mark up and keep the margin. 48–72h turnaround, no contracts, no minimums.</p>

<p>If you're running Meta or Google campaigns and want to offload the creative side, this could be a clean fit. Take a look at <a href="https://jayrx.net">jayrx.net</a>.</p>

<p>Worth a quick call?</p>

<p>Jay<br>
<a href="https://jayrx.net">jayrx.net</a></p>`;

  const text = `Hey ${name} team,

I produce ad creatives — motion graphics, short video ads, and static — for agencies on a white-label basis.

The deal is simple: you handle the client and strategy, I produce the work at wholesale rates, you mark up and keep the margin. 48–72h turnaround, no contracts, no minimums.

If you're running Meta or Google campaigns and want to offload the creative side, this could be a clean fit. Take a look at jayrx.net.

Worth a quick call?

Jay
jayrx.net`;

  return { subject, html, text };
}

async function sendEmail(to, subject, html, text) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html, text }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Resend ${res.status}`);
  return json.id;
}

async function run() {
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const agencies = parseCSV(raw);

  const sentLog = loadSent();
  const sentEmails = new Set(sentLog.sent.map(s => s.email));

  const seenEmails = new Set(sentEmails);
  const toSend = [];
  for (const a of agencies) {
    const email = a['Email']?.trim();
    if (email && email.includes('@') && !seenEmails.has(email)) {
      seenEmails.add(email);
      toSend.push(a);
    }
  }

  console.log(`${toSend.length} agencies with unsent emails`);
  console.log(`${sentEmails.size} already contacted\n`);

  if (toSend.length === 0) {
    console.log('Nothing to send.');
    return;
  }

  const batch = toSend.slice(0, DAILY_LIMIT);
  console.log(`Sending ${batch.length} emails...\n`);

  let sent = 0;
  for (const agency of batch) {
    const email = agency['Email'];
    try {
      const { subject, html, text } = buildEmail(agency);
      const id = await sendEmail(email, subject, html, text);
      sentLog.sent.push({
        email,
        agency: agency['Agency Name'],
        source: agency['Source'],
        resendId: id,
        sentAt: new Date().toISOString(),
      });
      saveSent(sentLog);
      sent++;
      console.log(`  ✓ ${agency['Agency Name']} — ${email}`);
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (err) {
      console.log(`  ✗ ${agency['Agency Name']} — ${err.message}`);
    }
  }

  console.log(`\n${sent}/${batch.length} emails sent`);
  const remaining = toSend.length - sent;
  if (remaining > 0) console.log(`${remaining} remaining — run again tomorrow`);
}

run().catch(console.error);
