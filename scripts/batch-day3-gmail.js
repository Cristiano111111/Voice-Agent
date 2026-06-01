import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.join(__dirname, '..', 'memory', 'gmail-sent-log.json');

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) return { sent: [], failed: [] };
  return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
}

function saveLog(log) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'memory', 'founder-emails.json'), 'utf-8'));

const outreach = data.map((c, i) => {
  const firstName = c.founderFirstName
    ? c.founderFirstName.charAt(0).toUpperCase() + c.founderFirstName.slice(1)
    : 'there';

  const variants = [
    `Hey ${firstName},\n\n${c.name} is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.\n\nWorth a quick chat?\n\n— Jay\njayrx.net\njayrx16@gmail.com`,
    `Hey ${firstName},\n\n${c.name} caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.\n\nOpen to a quick conversation?\n\n— Jay\njayrx.net\njayrx16@gmail.com`,
    `Hey ${firstName},\n\nI make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought ${c.name} would be a great fit.\n\nInterested?\n\n— Jay\njayrx.net\njayrx16@gmail.com`,
    `Hey ${firstName},\n\n${c.name} is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.\n\nWorth a quick chat?\n\n— Jay\njayrx.net\njayrx16@gmail.com`,
    `Hey ${firstName},\n\nI make short motion graphic brand videos for AI startups — clean explainers that make your product pop. ${c.name} seems like a strong fit.\n\nQuick chat?\n\n— Jay\njayrx.net\njayrx16@gmail.com`,
  ];

  return {
    to: c.email,
    company: c.name,
    body: variants[i % variants.length],
  };
});

async function runBatch() {
  const log = loadLog();
  const alreadySent = new Set(log.sent.map(e => e.to));

  const toSend = outreach.filter(e => !alreadySent.has(e.to));
  console.log(`${toSend.length} emails to send (${outreach.length - toSend.length} already sent)...\n`);

  let sent = 0;
  let failed = 0;

  for (const email of toSend) {
    try {
      await transporter.sendMail({
        from: `Jay <${process.env.GMAIL_USER}>`,
        to: email.to,
        subject: `Quick brand video idea for ${email.company}`,
        text: email.body,
      });
      console.log(`✓ ${email.company} → ${email.to}`);
      log.sent.push({ to: email.to, company: email.company, sentAt: new Date().toISOString() });
      sent++;
    } catch (err) {
      console.error(`✗ ${email.company} → ${email.to}: ${err.message}`);
      log.failed.push({ to: email.to, company: email.company, error: err.message, failedAt: new Date().toISOString() });
      failed++;
    }
    saveLog(log);
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\nDone. ${sent} sent, ${failed} failed.`);
}

runBatch();
