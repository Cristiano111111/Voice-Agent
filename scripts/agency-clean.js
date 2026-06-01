// Cleans agency-leads.csv: removes fake/placeholder emails and image filenames
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV = path.join(__dirname, '..', 'memory', 'agency-leads.csv');

// Patterns that indicate a fake / placeholder / non-human email
const FAKE_PATTERNS = [
  /^sample@/i, /^test@/i, /^user@/i, /^you@/i, /^your@/i, /^name@/i,
  /^email@email/i, /^example@/i, /^hello@example/i, /^placeholder@/i,
  /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp|pdf|zip|mp4|mov)$/i, // image/file extensions as TLD
  /^\d+@/,  // starts with number (usually not real)
];

function isRealEmail(email) {
  if (!email) return false;
  return !FAKE_PATTERNS.some(p => p.test(email.toLowerCase()));
}

const raw = fs.readFileSync(CSV, 'utf-8');
const lines = raw.trim().split('\n');
const header = lines[0];

let cleaned = 0;
const rows = lines.slice(1).map(line => {
  const cols = []; let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
    else cur += ch;
  }
  cols.push(cur);
  if (cols[2] && !isRealEmail(cols[2])) {
    console.log('Removing fake email:', cols[2], 'from', cols[0]);
    cols[2] = '';
    cleaned++;
  }
  return cols;
});

const esc = v => '"' + String(v || '').replace(/"/g, '""') + '"';
fs.writeFileSync(CSV, [header, ...rows.map(r => r.map(esc).join(','))].join('\n'));

const withEmail = rows.filter(r => r[2]).length;
const clutch = rows.filter(r => r[6] === 'clutch').length;
const reddit = rows.filter(r => r[6] === 'reddit').length;

console.log(`\nCleaned ${cleaned} fake emails`);
console.log(`Final: ${rows.length} total agencies | ${withEmail} with real emails`);
console.log(`Clutch: ${clutch} | Reddit: ${reddit}`);
