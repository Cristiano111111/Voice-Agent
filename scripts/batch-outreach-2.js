import { sendEmail } from './send-email.js';

const outreach = [
  {
    to: 'contact@artemissecurity.com',
    subject: 'Brand video idea for Artemis',
    body: `Hey,

$70M raised and just out of stealth — Artemis has one of the best origin stories in cybersecurity right now. The challenge is communicating what "AI-native" actually means to someone who hasn't seen it yet.

I make short motion graphic brand videos for AI companies. A 20–30 second spot that makes Artemis click immediately — built for your homepage, LinkedIn, or sales decks.

Worth a quick conversation?

— Jay
jayrx16@gmail.com`,
  },
  {
    to: 'kun@calltree.ai',
    subject: 'Motion ad idea for Calltree',
    body: `Hey Kun,

Calltree's positioning is sharp — enterprise AI support reps for call centers is a space that's heating up fast.

I make short motion graphic ads for AI companies. A quick brand video would make Calltree's pitch land immediately for any enterprise buyer who lands on your site or sees you on LinkedIn.

Open to a quick chat?

— Jay
jayrx16@gmail.com`,
  },
  {
    to: 'info@mirelo.ai',
    subject: 'Quick idea for Mirelo',
    body: `Hey,

Mirelo just raised $41M to generate sound and music for video — that's a genuinely exciting product in a space that's about to blow up.

I make short motion graphic brand videos for AI companies. You're in the visual/audio space, so you know better than anyone how much a sharp brand spot matters. I'd love to put something together that shows off what Mirelo does in 20 seconds flat.

Interested?

— Jay
jayrx16@gmail.com`,
  },
  {
    to: 'hello@peec.ai',
    subject: 'Brand content idea for Peec AI',
    body: `Hey,

Peec AI helps brands win in AI search — that's a message that needs to land fast and clearly with marketing teams who are already overwhelmed.

I make short motion graphic explainers for AI startups. A 20–30 second brand video that makes Peec's value obvious the moment someone hits your site or sees you in their feed. Quick turnaround.

Worth a quick conversation?

— Jay
jayrx16@gmail.com`,
  },
];

async function runBatch() {
  console.log(`Sending ${outreach.length} emails...\n`);
  for (const email of outreach) {
    try {
      await sendEmail(email);
      console.log(`✓ Sent to ${email.to}`);
    } catch (err) {
      console.error(`✗ Failed: ${email.to} — ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\nDone.');
}

runBatch();
