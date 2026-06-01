import { Resend } from 'resend';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRACKER_PATH = path.join(__dirname, '..', 'memory', 'email-tracker.json');
const DAILY_LIMIT = 100;

const resend = new Resend(process.env.RESEND_API_KEY);

function loadTracker() {
  if (!fs.existsSync(TRACKER_PATH)) {
    return { date: '', sent: 0, log: [] };
  }
  return JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf-8'));
}

function saveTracker(tracker) {
  fs.writeFileSync(TRACKER_PATH, JSON.stringify(tracker, null, 2));
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyStats() {
  const tracker = loadTracker();
  const today = getTodayString();
  if (tracker.date !== today) return { sent: 0, remaining: DAILY_LIMIT };
  return { sent: tracker.sent, remaining: DAILY_LIMIT - tracker.sent };
}

export async function sendEmail({ to, subject, body }) {
  const tracker = loadTracker();
  const today = getTodayString();

  if (tracker.date !== today) {
    tracker.date = today;
    tracker.sent = 0;
    tracker.log = [];
  }

  if (tracker.sent >= DAILY_LIMIT) {
    throw new Error(`Daily limit of ${DAILY_LIMIT} reached. Resets tomorrow.`);
  }

  const { data, error } = await resend.emails.send({
    from: `Jay <${process.env.RESEND_FROM_EMAIL}>`,
    reply_to: process.env.GMAIL_USER,
    to,
    subject,
    text: body,
  });

  if (error) throw new Error(error.message);
  const response = data;

  tracker.sent += 1;
  tracker.log.push({ to, subject, sentAt: new Date().toISOString() });
  saveTracker(tracker);

  console.log(`Sent to ${to} — ${tracker.sent}/${DAILY_LIMIT} today`);
  return response;
}
