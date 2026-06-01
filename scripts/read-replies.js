// Read full content of reply emails from IMAP
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
dotenv.config();

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

async function run() {
  await client.connect();
  await client.mailboxOpen('INBOX');

  const sinceDate = new Date('2026-05-01');
  const msgs = await client.search({ since: sinceDate }, { uid: true });

  const replies = [];
  for await (const msg of client.fetch(msgs.slice(-100), { envelope: true, uid: true })) {
    const subj = msg.envelope.subject || '';
    if (subj.startsWith('Re:') || subj.startsWith('RE:') || subj === 'Re:' || subj === '') {
      replies.push({ uid: msg.uid, subject: subj, date: msg.envelope.date });
    }
  }

  console.log(`Found ${replies.length} replies. Fetching content...\n`);
  console.log('='.repeat(70));

  for (const r of replies) {
    try {
      const download = await client.download(String(r.uid), undefined, { uid: true });
      const chunks = [];
      for await (const chunk of download.content) {
        chunks.push(chunk);
      }
      const rawContent = Buffer.concat(chunks);
      const parsed = await simpleParser(rawContent);
      const from = parsed.from?.text || 'unknown';
      const text = (parsed.text || '').trim().slice(0, 800);

      console.log(`\nFROM: ${from}`);
      console.log(`DATE: ${r.date?.toLocaleString()}`);
      console.log(`SUBJ: ${r.subject}`);
      console.log('-'.repeat(70));
      console.log(text);
      console.log('='.repeat(70));
    } catch (err) {
      console.log(`Error reading uid ${r.uid}: ${err.message}`);
    }
  }

  await client.logout();
}

run().catch(console.error);
