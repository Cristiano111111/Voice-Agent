import { sendEmail } from './send-email.js';

const outreach = [
  {
    to: 'founders@retellai.com',
    subject: 'Brand content idea for Retell AI',
    body: `Hey,

Retell AI is doing incredible numbers — 40M+ calls a month and 300% QoQ growth is the kind of story that needs to be seen, not just read.

I make short motion graphic ads for AI companies. A 20–30 second spot that captures what Retell does — built for LinkedIn, your homepage, or investor decks. Clean, fast, no fluff.

Interested in a quick chat?

— Jay
jayrx16@gmail.com`,
  },
  {
    to: 'info@rime.ai',
    subject: 'Motion graphic idea for Rime',
    body: `Hey,

Congrats on the $5.5M raise and landing Domino's and Wingstop as customers — that's serious traction.

I build short motion graphic ads for AI voice companies. A sharp brand video would match the credibility of your enterprise client list. I can put one together fast.

Worth a quick conversation?

— Jay
jayrx16@gmail.com`,
  },
  {
    to: 'contact@ankar.ai',
    subject: 'Brand video idea for Ankar',
    body: `Hey,

Saw that Ankar just raised a $20M Series A — congrats. Palantir pedigree plus that kind of raise means you've got a story worth telling visually.

I make short motion graphic explainers for AI companies. A 20–30 second brand video built for your site, LinkedIn, and investor materials. Quick turnaround.

Open to a quick chat?

— Jay
jayrx16@gmail.com`,
  },
  {
    to: 'hello@kana.ai',
    subject: 'Brand video for Kana',
    body: `Hey,

Kana just came out of stealth with $15M and a sharp positioning — AI agents for marketers. That's a story that's hard to explain in text but lands perfectly in motion.

I make short explainer and brand videos for AI companies. I'd love to put together a 20–30 second spot that makes Kana click immediately for any marketer who sees it.

Interested?

— Jay
jayrx16@gmail.com`,
  },
  {
    to: 'contact@axiommath.ai',
    subject: 'Visual brand idea for Axiom Math',
    body: `Hey,

$64M at a $300M valuation for an AI math research company is a remarkable raise. The challenge with deep research brands is making the work feel accessible and exciting to people outside the field.

I make short motion graphic videos for AI companies — clean, concept-driven, built to communicate what you do without dumbing it down.

Worth a quick conversation?

— Jay
jayrx16@gmail.com`,
  },
  {
    to: 'contact@throxy.com',
    subject: 'Motion ad idea for Throxy',
    body: `Hey,

Throxy books meetings for software companies — which means your pitch has to be sharp enough to sell the concept of AI-powered outbound in seconds.

That's exactly what a good motion graphic ad does. I make short brand videos for AI sales companies — the kind you drop into a cold email, a LinkedIn post, or a demo page to make people instantly get it.

Interested in a quick chat?

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
    // Small delay to avoid spam filters
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\nDone.');
}

runBatch();
