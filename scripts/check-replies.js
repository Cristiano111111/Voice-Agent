import { ImapFlow } from 'imapflow';
import { sendEmail } from '../src/mailer.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPLIES_PATH = path.join(__dirname, '..', 'memory', 'replies.json');

function loadReplies() {
  if (!fs.existsSync(REPLIES_PATH)) return { seen: [], replies: [] };
  return JSON.parse(fs.readFileSync(REPLIES_PATH, 'utf-8'));
}

function saveReplies(data) {
  fs.writeFileSync(REPLIES_PATH, JSON.stringify(data, null, 2));
}

async function checkReplies() {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    logger: false,
  });

  const store = loadReplies();
  const newReplies = [];

  try {
    await client.connect();
    await client.mailboxOpen('INBOX');

    // Search for replies to our outreach subject
    const messages = await client.search({
      subject: 'Re: Quick brand video idea for',
    });

    if (messages.length === 0) {
      console.log('No replies found.');
      await client.logout();
      return [];
    }

    for await (const msg of client.fetch(messages, {
      envelope: true,
      bodyStructure: true,
      source: false,
    })) {
      const uid = String(msg.uid);
      if (store.seen.includes(uid)) continue;

      const from = msg.envelope.from?.[0];
      const fromEmail = from ? `${from.name ? from.name + ' ' : ''}<${from.mailbox}@${from.host}>`.trim() : 'unknown';
      const subject = msg.envelope.subject || '';
      const date = msg.envelope.date?.toISOString() || new Date().toISOString();

      const reply = { uid, from: fromEmail, subject, date };
      newReplies.push(reply);
      store.seen.push(uid);
      store.replies.push(reply);
    }

    await client.logout();
  } catch (err) {
    console.error('IMAP error:', err.message);
    process.exit(1);
  }

  if (newReplies.length === 0) {
    console.log('No new replies since last check.');
    return [];
  }

  saveReplies(store);
  console.log(`Found ${newReplies.length} new reply/replies.`);

  // Build summary email
  const lines = newReplies.map((r, i) =>
    `${i + 1}. From: ${r.from}\n   Subject: ${r.subject}\n   Date: ${new Date(r.date).toLocaleString()}`
  );

  const body = `Jay here — here's your daily outreach reply summary:\n\n${lines.join('\n\n')}\n\nLog in to jayrx16@gmail.com to read and respond.\n\n— Jay`;

  try {
    await sendEmail({
      to: process.env.GMAIL_USER,
      subject: `Jay — ${newReplies.length} new reply${newReplies.length > 1 ? 's' : ''} to your outreach`,
      body,
    });
    console.log(`Summary sent to ${process.env.GMAIL_USER}`);
  } catch (err) {
    console.error('Could not send summary email:', err.message);
  }

  return newReplies;
}

checkReplies();
