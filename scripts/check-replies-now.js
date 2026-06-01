// Check Gmail IMAP for replies to any outreach campaigns
import { ImapFlow } from 'imapflow';
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

  // Search for replies to all our campaigns
  const sinceDate = new Date('2026-05-01');
  const msgs = await client.search({ since: sinceDate }, { uid: true });
  console.log(`Total inbox messages since May 1: ${msgs.length}`);

  // Fetch all with envelope to find replies
  const replies = [];
  for await (const msg of client.fetch(msgs.slice(-100), { envelope: true })) {
    const subj = msg.envelope.subject || '';
    const from = msg.envelope.from?.[0];
    const fromStr = from ? `${from.name || ''} <${from.mailbox}@${from.host}>`.trim() : 'unknown';
    const isReply = subj.startsWith('Re:') || subj.startsWith('RE:');
    if (isReply) {
      replies.push({
        from: fromStr,
        subject: subj,
        date: msg.envelope.date?.toLocaleString() || '',
      });
    }
  }

  await client.logout();

  if (replies.length === 0) {
    console.log('\nNo replies found in inbox.');
  } else {
    console.log(`\n${replies.length} replies found:\n`);
    replies.forEach((r, i) => {
      console.log(`${i+1}. ${r.from}`);
      console.log(`   ${r.subject}`);
      console.log(`   ${r.date}\n`);
    });
  }
}

run().catch(console.error);
