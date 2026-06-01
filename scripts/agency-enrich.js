// Enriches agency-leads.csv: scrapes each Clutch profile to get website URL, then finds email
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPFLY_KEY = 'scp-live-0ed15e14ad754df9abe87233c8795962';
const CSV_PATH = path.join(__dirname, '..', 'memory', 'agency-leads.csv');

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const SKIP = ['noreply', 'no-reply', '@sentry', '@example', '@test.com', 'email@email', '@clutch'];

async function getWebsiteFromClutch(profileUrl) {
  if (!profileUrl || !profileUrl.includes('clutch.co')) return '';
  const apiUrl = `https://api.scrapfly.io/scrape?key=${SCRAPFLY_KEY}&url=${encodeURIComponent(profileUrl)}&asp=true&rendering_wait=2000&country=us`;
  try {
    const res = await fetch(apiUrl);
    const json = await res.json();
    const content = json.result?.content || '';
    // Extract from inline JSON: "provider_website":"domain.com"
    const jsonMatch = content.match(/"provider_website":"([^"]+)"/);
    if (jsonMatch?.[1]) return `https://${jsonMatch[1]}`;
    // Fallback: extract from redirect URL parameter
    const redirectMatch = content.match(/provider_website=([^&"]+)/);
    if (redirectMatch?.[1]) return `https://${decodeURIComponent(redirectMatch[1])}`;
    return '';
  } catch { return ''; }
}

async function findEmailFromWebsite(website) {
  if (!website) return '';
  const base = website.replace(/\/$/, '');
  for (const page of [base, `${base}/contact`, `${base}/about`]) {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 7000);
      const res = await fetch(page, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
      if (!res.ok) continue;
      const html = await res.text();
      const emails = (html.match(EMAIL_RE) || []).map(e => e.toLowerCase()).filter(e => !SKIP.some(s => e.includes(s)));
      if (emails.length) return emails[0];
    } catch {}
  }
  return '';
}

async function run() {
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.trim().split('\n');
  const header = lines[0];

  // Parse CSV rows
  const rows = lines.slice(1).map(line => {
    const cols = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
      else cur += ch;
    }
    cols.push(cur);
    return cols;
  });

  // Only process Clutch rows without websites
  const toEnrich = rows.filter(r => r[1]?.includes('clutch.co') && !r[2]);
  // Cap at 80 to preserve Scrapfly credits
  const batch = toEnrich.slice(0, 80);

  console.log(`Enriching ${batch.length} Clutch agencies (of ${toEnrich.length} needing websites)...`);

  let websitesFound = 0, emailsFound = 0;
  for (let i = 0; i < batch.length; i++) {
    const row = batch[i];
    const name = row[0];
    const profileUrl = row[1];
    process.stdout.write(`[${i + 1}/${batch.length}] ${name} ... `);

    const website = await getWebsiteFromClutch(profileUrl);
    row[1] = website || profileUrl; // replace profile with website if found
    if (website) {
      websitesFound++;
      const email = await findEmailFromWebsite(website);
      row[2] = email;
      if (email) emailsFound++;
      console.log(`${website} → ${email || 'no email'}`);
    } else {
      console.log('no website found');
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  // Rebuild CSV
  const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
  const newLines = [header, ...rows.map(r => r.map(esc).join(','))];
  fs.writeFileSync(CSV_PATH, newLines.join('\n'));
  console.log(`\nDone. ${websitesFound} websites + ${emailsFound} emails added.`);
}

run().catch(console.error);
