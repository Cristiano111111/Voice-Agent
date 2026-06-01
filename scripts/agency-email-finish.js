// Scrapes emails for agencies without emails — crash-safe version
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// HTTP/2 socket errors from undici/fetch bypass try-catch; swallow them here
process.on('uncaughtException', (err) => {
  if (err?.code === 'UND_ERR_SOCKET' || err?.message?.includes('other side closed')) return;
  console.error('Uncaught:', err);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '..', 'memory', 'agency-leads.csv');

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const SKIP = ['noreply', 'no-reply', '@sentry', '@example', '@test.com', 'email@email', '@clutch', 'wix.com', 'wordpress', 'schema.org', 'w3.org', 'google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'linkedin.com', 'apple.com', 'microsoft.com'];
const FAKE = [/^sample@/i, /^test@/i, /^user@/i, /^you@/i, /^your@/i, /^name@/i, /^email@/i, /^example@/i, /^placeholder@/i, /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp|pdf|zip)$/i, /^\d+@/];

function isReal(e) {
  if (!e) return false;
  const low = e.toLowerCase();
  if (SKIP.some(s => low.includes(s))) return false;
  if (FAKE.some(p => p.test(low))) return false;
  return true;
}

async function findEmail(website) {
  const base = website.replace(/\/$/, '');
  for (const page of [base, `${base}/contact`, `${base}/about`, `${base}/contact-us`]) {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 8000);
      const res = await fetch(page, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        redirect: 'follow'
      });
      if (!res.ok) continue;
      const html = await res.text();
      const emails = [...new Set((html.match(EMAIL_RE) || []).map(e => e.toLowerCase()).filter(isReal))];
      // Prefer contact/info/hello emails, then anything
      const preferred = emails.find(e => /^(contact|info|hello|hey|hi|sales|team|support)@/.test(e));
      if (preferred) return preferred;
      if (emails.length) return emails[0];
    } catch {}
  }
  return '';
}

const raw = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = raw.trim().split('\n');
const header = lines[0];

const rows = lines.slice(1).map(line => {
  const cols = []; let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
    else cur += ch;
  }
  cols.push(cur);
  return cols;
});

// Only process rows with a real website but no email
const toProcess = rows.filter(r => r[1]?.match(/^https?:\/\//) && !r[1].includes('clutch.co') && !r[2]);

console.log(`Processing ${toProcess.length} agencies without emails...`);

const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
function saveCSV() {
  fs.writeFileSync(CSV_PATH, [header, ...rows.map(r => r.map(esc).join(','))].join('\n'));
}

let found = 0;
for (let i = 0; i < toProcess.length; i++) {
  const row = toProcess[i];
  process.stdout.write(`[${i+1}/${toProcess.length}] ${row[0]} ... `);
  const email = await findEmail(row[1]);
  if (email) {
    row[2] = email;
    found++;
    console.log(email);
    saveCSV(); // save immediately so crashes don't lose progress
  } else {
    console.log('—');
  }
  await new Promise(r => setTimeout(r, 600));
}

saveCSV();
console.log(`\nDone. ${found} new emails added.`);
