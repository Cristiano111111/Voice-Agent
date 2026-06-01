import { sendEmail, getDailyStats } from '../src/mailer.js';

// Remaining emails that hit Gmail's daily limit — resume tomorrow
const outreach = [
  { to: 'founders@beesafe.ai', company: 'BeeSafe AI', body: `Hey,\n\nBeeSafe AI is solving a real safety problem. I make short motion graphic explainers for AI companies that help buyers instantly understand why they need your product.\n\nWorth a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@velum-labs.com', company: 'Velum Labs', body: `Hey,\n\nVelum Labs looks like a company with a sharp technical foundation. I make short motion graphic brand videos for early-stage AI startups — built for your homepage, LinkedIn, and investor decks.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@usecardboard.com', company: 'Cardboard', body: `Hey,\n\nCardboard is an interesting product name — I'd love to help you build a brand visual that matches. I make short motion graphic ads for B2B startups.\n\nOpen to a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'team@trycardinal.ai', company: 'Cardinal AI', body: `Hey,\n\nCardinal AI is operating in a space where a sharp brand video can really move the needle with enterprise buyers. I make short motion graphic explainers for B2B AI companies.\n\nWorth a quick conversation?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@bookoapp.com', company: 'Booko', body: `Hey,\n\nBooko looks like a consumer product that could really pop with the right short-form motion ad. I help apps and consumer startups build brand videos that convert on social.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@traverse.so', company: 'Traverse', body: `Hey,\n\nTraverse is building in the data space — I make short motion graphic explainers for data and AI companies that make complex products click immediately for buyers.\n\nOpen to a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'rohan@veriad.ai', company: 'Veriad', body: `Hey Rohan,\n\nVeriad is building in an exciting space. I make short motion graphic brand videos for AI startups — the kind that help you convert site visitors who won't read a wall of text.\n\nWorth a quick conversation?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@voygr.tech', company: 'VOYGR', body: `Hey,\n\nVOYGR has a great name and I'd love to help build a visual brand to match. I make short motion graphic ads for hardware and deep-tech startups.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@confluence.sh', company: 'Confluence Labs', body: `Hey,\n\nConfluence Labs is doing infrastructure work that needs a clear, compelling story for developers. I make short motion graphic explainers for dev-tool companies.\n\nWorth a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@autumnai.com', company: 'Autumn AI', body: `Hey,\n\nAutumn AI is building something important. I make short motion graphic brand videos for AI companies — clean explainers that make your product click immediately for any buyer.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@usesalus.ai', company: 'Salus', body: `Hey,\n\nSalus is tackling AI agent reliability — a genuinely important problem. I make short motion graphic explainers for AI infrastructure companies.\n\nWorth a quick conversation?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@runcascade.com', company: 'Cascade', body: `Hey,\n\nCascade is building in a hot space — I make short motion graphic brand videos for AI infrastructure startups that help you stand out in a crowded market.\n\nOpen to a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@copperlane.ai', company: 'Copperlane', body: `Hey,\n\nCopperlane is operating in fintech AI — a space where trust and clarity matter more than anywhere else. I make short motion graphic explainers for fintech AI startups.\n\nWorth a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@proximitty.ai', company: 'Proximitty', body: `Hey,\n\nProximitty is an interesting play. I make short motion graphic brand videos for AI startups — the kind that make your value clear in under 30 seconds.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'contact@servo7.com', company: 'Servo7', body: `Hey,\n\nServo7 is building in the robotics space — I make short motion graphic explainers for robotics companies that make complex products accessible to buyers.\n\nWorth a quick conversation?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@onerobot.io', company: 'OneRobot', body: `Hey,\n\nOneRobot is building something ambitious. I make short motion graphic brand videos for robotics startups — visual storytelling that makes the tech feel real.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'info@congruent.io', company: 'Congruent', body: `Hey,\n\nCongruent is doing interesting work. I make short motion graphic brand videos for AI companies — built for your homepage, LinkedIn, and investor materials.\n\nOpen to a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'contact@gru.space', company: 'GRU Space', body: `Hey,\n\nGRU Space is working on something genuinely exciting. I make short motion graphic brand videos for deep-tech and space companies.\n\nWorth a quick conversation?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@condor.energy', company: 'Condor Energy', body: `Hey,\n\nCondor Energy is tackling a massive problem. I make short motion graphic explainers for energy tech startups that make the mission clear to any audience.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'hello@squid.energy', company: 'Squid Energy', body: `Hey,\n\nSquid Energy is building AI-powered grid planning — a mission-critical product that needs clear visual communication. I make short motion graphic explainers for energy tech companies.\n\nWorth a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'hello@unifold.io', company: 'Unifold', body: `Hey,\n\nUnifold is building in on-chain payments. I make short motion graphic brand videos for fintech and web3 startups — the kind that build trust and clarity fast.\n\nOpen to a quick conversation?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'gabe@zerosettle.io', company: 'ZeroSettle', body: `Hey Gabe,\n\nZeroSettle is working in a space where instant credibility matters. I make short motion graphic brand videos for fintech startups.\n\nWorth a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'hello@dittobio.com', company: 'Ditto Bio', body: `Hey,\n\nDitto Bio is doing cutting-edge work in biotech. I make short motion graphic brand videos for biotech startups — visual storytelling that makes your science accessible.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'yash@origin.bio', company: 'Origin Bio', body: `Hey Yash,\n\nOrigin Bio is working on something important. I make short motion graphic brand videos for biotech startups that help you tell a compelling story for investors.\n\nWorth a quick conversation?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'leo.kankkunen@daivin.tech', company: 'DAIVIN', body: `Hey Leo,\n\nDAIVIN is doing interesting work in manufacturing AI. I make short motion graphic explainers for industrial AI companies.\n\nOpen to a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'contact@pirislabs.io', company: 'Piris Labs', body: `Hey,\n\nPiris Labs is building infrastructure that needs a clear visual story. I make short motion graphic brand videos for AI and cloud companies.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'hello@usechamber.com', company: 'Chamber', body: `Hey,\n\nChamber is building something in B2B — I make short motion graphic explainers that make it immediately obvious why someone should care about your product.\n\nWorth a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@runanywhere.ai', company: 'RunAnywhere', body: `Hey,\n\nRunAnywhere is tackling a real infrastructure problem. I make short motion graphic brand videos for AI infra companies.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@haladir.com', company: 'Haladir', body: `Hey,\n\nHaladir is building something new. I make short motion graphic brand videos for early-stage AI companies — clean, sharp, and built to make your pitch land immediately.\n\nOpen to a quick conversation?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'support@runcaptain.com', company: 'Captain', body: `Hey,\n\nCaptain looks like a developer tool that could really benefit from a sharp brand video. I make short motion graphic ads for dev-tool startups.\n\nWorth a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'support@usekita.com', company: 'Kita', body: `Hey,\n\nKita is building in a space where trust and visual clarity are everything. I make short motion graphic brand videos for fintech startups.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'founders@autositu.com', company: 'AutoSitu', body: `Hey,\n\nAutoSitu is modernizing permitting — a process that desperately needs clearer communication. I make short motion graphic explainers for govtech and legal AI companies.\n\nWorth a quick conversation?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'iqbol@wayco.ai', company: 'Wayco', body: `Hey Iqbol,\n\nWayco is solving a real problem in legal case routing. I make short motion graphic explainers for legal AI companies.\n\nOpen to a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'team@syntheticsciences.ai', company: 'Synthetic Sciences', body: `Hey,\n\nSynthetic Sciences is doing deep technical work. I make short motion graphic brand videos for science and AI companies that make complex research accessible.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'hello@returnsignals.com', company: 'Return Signals', body: `Hey,\n\nReturn Signals is tackling a pain point every e-commerce brand deals with. I make short motion graphic brand videos for e-commerce AI startups.\n\nWorth a quick chat?\n\n— Jay\njayrx16@gmail.com` },
  { to: 'contact@crosslayerlabs.com', company: 'Crosslayer Labs', body: `Hey,\n\nCrossLayer Labs is solving a serious cybersecurity problem. I make short motion graphic explainers for cybersecurity AI companies — clear, urgent, and built to convert.\n\nInterested?\n\n— Jay\njayrx16@gmail.com` },
];

async function runBatch() {
  const stats = getDailyStats();
  console.log(`Daily limit: ${stats.sent} sent, ${stats.remaining} remaining today`);
  const toSend = outreach.slice(0, stats.remaining);
  console.log(`Sending ${toSend.length} of ${outreach.length} emails now...\n`);
  let sent = 0;
  let failed = 0;

  for (const email of toSend) {
    try {
      await sendEmail({
        to: email.to,
        subject: `Quick brand video idea for ${email.company}`,
        body: email.body,
      });
      console.log(`✓ [${sent + failed + 1}/${outreach.length}] Sent to ${email.to}`);
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
