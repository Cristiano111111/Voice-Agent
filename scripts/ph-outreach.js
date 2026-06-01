// Sends cold email outreach to PH founders who have verified emails
// Uses Resend API — run after hunter-batch.js populates emails
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL;

const PH_LEADS_PATH = path.join(__dirname, '..', 'memory', 'ph-leads.json');
const SENT_LOG_PATH = path.join(__dirname, '..', 'memory', 'ph-outreach-sent.json');

const DAILY_LIMIT = 80;
const DELAY_MS = 3000;

function loadLeads() {
  if (!fs.existsSync(PH_LEADS_PATH)) return { leads: [] };
  return JSON.parse(fs.readFileSync(PH_LEADS_PATH, 'utf-8'));
}

function loadSent() {
  if (!fs.existsSync(SENT_LOG_PATH)) return { sent: [] };
  return JSON.parse(fs.readFileSync(SENT_LOG_PATH, 'utf-8'));
}

function saveSent(data) {
  fs.writeFileSync(SENT_LOG_PATH, JSON.stringify(data, null, 2));
}

function buildEmail(lead) {
  const firstName = lead.firstName || lead.name?.split(' ')[0] || 'there';
  const product = lead.company || 'your product';
  const tagline = lead.phTagline ? `"${lead.phTagline}"` : 'your launch';

  return {
    subject: `Quick question about ${product}`,
    html: `<p>Hey ${firstName},</p>

<p>Saw ${product} on Product Hunt — ${tagline}. Nice work getting it out there.</p>

<p>I make short motion graphic explainer videos for SaaS products — the kind that makes your product click in under 30 seconds. A good launch video can double your PH upvotes and drive traffic long after launch day.</p>

<p>Check out <a href="https://jayrx.net">jayrx.net</a> — and since you're getting this email, you get <strong>50% off your first video</strong>.</p>

<p>Worth a quick chat?</p>

<p>Jay<br>
<a href="https://jayrx.net">jayrx.net</a></p>`,
    text: `Hey ${firstName},

Saw ${product} on Product Hunt — ${tagline}. Nice work getting it out there.

I make short motion graphic explainer videos for SaaS products — the kind that makes your product click in under 30 seconds. A good launch video can double your PH upvotes and drive traffic long after launch day.

Check out jayrx.net — and since you're getting this email, you get 50% off your first video.

Worth a quick chat?

Jay
jayrx.net`,
  };
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
  const data = loadLeads();
  const sentLog = loadSent();
  const sentEmails = new Set(sentLog.sent.map(s => s.email));

  // Deduplicate: one email per unique address (first lead wins)
  const seenEmails = new Set(sentEmails);
  const toSend = [];
  for (const l of data.leads) {
    if (l.email && !seenEmails.has(l.email)) {
      seenEmails.add(l.email);
      toSend.push(l);
    }
  }

  console.log(`${toSend.length} leads with emails ready to contact`);
  console.log(`${sentEmails.size} already sent\n`);

  if (toSend.length === 0) {
    console.log('Nothing to send. Run hunter-batch.js first to populate emails.');
    return;
  }

  const batch = toSend.slice(0, DAILY_LIMIT);
  console.log(`Sending ${batch.length} emails (Resend limit: ${DAILY_LIMIT}/day)...\n`);

  let sent = 0;
  for (const lead of batch) {
    try {
      const { subject, html, text } = buildEmail(lead);
      const id = await sendEmail(lead.email, subject, html, text);
      sentLog.sent.push({
        email: lead.email,
        name: lead.name,
        company: lead.company,
        phSlug: lead.phSlug,
        resendId: id,
        sentAt: new Date().toISOString(),
      });
      saveSent(sentLog);
      sent++;
      console.log(`  ✓ ${lead.name} — ${lead.email}`);
      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (err) {
      console.log(`  ✗ ${lead.name} — ${err.message}`);
    }
  }

  console.log(`\n${sent} emails sent`);
  const remaining = toSend.length - sent;
  if (remaining > 0) console.log(`${remaining} remaining — run again tomorrow`);
}

run().catch(console.error);
