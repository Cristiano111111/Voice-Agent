// Scrapes emails from founder websites: homepage + /contact page
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PH_LEADS_PATH = path.join(__dirname, '..', 'memory', 'ph-leads.json');

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Domains to skip (no-reply, generic, not owner emails)
const SKIP_PATTERNS = [
  'noreply', 'no-reply', 'support', 'help', 'info@', 'hello@example',
  'sentry', 'intercom', 'mailchimp', 'sendgrid', 'postmark', 'stripe',
  '@sentry.io', '@intercom.io', '@example.com', '@test.com',
];

function isValidEmail(email, domain) {
  const lower = email.toLowerCase();
  if (SKIP_PATTERNS.some(p => lower.includes(p))) return false;
  // Prefer emails matching the company domain
  return true;
}

function rankEmail(email, domain) {
  const lower = email.toLowerCase();
  const d = domain?.replace(/^www\./, '');
  if (d && lower.includes(d)) return 10;
  if (lower.startsWith('founder') || lower.startsWith('ceo') || lower.startsWith('hi@') || lower.startsWith('me@')) return 8;
  if (lower.startsWith('hello@') || lower.startsWith('hey@')) return 7;
  if (lower.startsWith('contact@') || lower.startsWith('team@')) return 5;
  return 3;
}

async function fetchText(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function findEmailsForSite(website) {
  const base = website.replace(/\/$/, '');
  const pages = [base, `${base}/contact`, `${base}/about`, `${base}/team`];
  const domain = new URL(base).hostname.replace(/^www\./, '');

  const allEmails = new Set();

  for (const page of pages) {
    const html = await fetchText(page);
    if (!html) continue;
    const found = html.match(EMAIL_RE) || [];
    found.forEach(e => {
      if (isValidEmail(e, domain)) allEmails.add(e.toLowerCase());
    });
    if (allEmails.size > 0) break; // stop once we find something
  }

  if (allEmails.size === 0) return null;

  // Rank and pick best
  const sorted = [...allEmails].sort((a, b) => rankEmail(b, domain) - rankEmail(a, domain));
  return sorted[0];
}

async function run() {
  const data = JSON.parse(fs.readFileSync(PH_LEADS_PATH, 'utf-8'));
  const needEmail = data.leads.filter(l => !l.email && l.website);
  console.log(`Scraping emails for ${needEmail.length} leads...\n`);

  let found = 0;
  for (let i = 0; i < needEmail.length; i++) {
    const lead = needEmail[i];
    process.stdout.write(`[${i + 1}/${needEmail.length}] ${lead.name} (${lead.website}) ... `);
    try {
      const email = await findEmailsForSite(lead.website);
      const idx = data.leads.findIndex(l => l.phUsername === lead.phUsername);
      if (email) {
        data.leads[idx].email = email;
        data.leads[idx].emailSource = 'website-scrape';
        found++;
        console.log(email);
      } else {
        console.log('not found');
      }
    } catch (err) {
      console.log(`error: ${err.message}`);
    }
    // Save every 10 leads
    if ((i + 1) % 10 === 0) fs.writeFileSync(PH_LEADS_PATH, JSON.stringify(data, null, 2));
  }

  fs.writeFileSync(PH_LEADS_PATH, JSON.stringify(data, null, 2));
  console.log(`\nDone. ${found}/${needEmail.length} emails found.`);
}

run().catch(console.error);
