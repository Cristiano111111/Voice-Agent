import { sendEmail, getDailyStats } from '../src/mailer.js';

const outreach = [
  { to: 'info@magier.ai', company: 'Magier AI', body: `Hey,\n\nMagier AI is doing interesting work. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.\n\nWorth a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'info@contactswing.com', company: 'ContactSwing', body: `Hey,\n\nContactSwing is building AI for sales outreach — a space where a sharp brand video can really show what you do better than text ever could. I make short motion graphic explainers for AI sales companies.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'riff@goriff.com', company: 'Riff', body: `Hey,\n\nRiff is building something in the audio and communication space. I make short motion graphic brand videos for AI startups that make your product pop instantly.\n\nOpen to a quick conversation?\n\n— Jay\njayrx16@gmail.com` },
];

async function runBatch() {
  const stats = getDailyStats();
  console.log(`Daily limit: ${stats.sent} sent, ${stats.remaining} remaining today`);
  let sent = 0;
  let failed = 0;

  for (const email of outreach) {
    try {
      await sendEmail({
        to: email.to,
        subject: `Quick brand video idea for ${email.company}`,
        body: email.body,
      });
      console.log(`✓ Sent to ${email.to}`);
      sent++;
    } catch (err) {
      console.error(`✗ Failed: ${email.to} — ${err.message}`);
      failed++;
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n✓ ${sent} sent | ✗ ${failed} failed`);
}

runBatch();
