import { Resend } from 'resend';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resend = new Resend(process.env.RESEND_API_KEY);

const GMAIL_LOG_PATH = path.join(__dirname, '..', 'memory', 'gmail-sent-log.json');
const RESEND_LOG_PATH = path.join(__dirname, '..', 'memory', 'resend-sent-log.json');

function loadGmailSent() {
  if (!fs.existsSync(GMAIL_LOG_PATH)) return new Set();
  const log = JSON.parse(fs.readFileSync(GMAIL_LOG_PATH, 'utf-8'));
  return new Set(log.sent.map(e => e.to));
}

function loadResendLog() {
  if (!fs.existsSync(RESEND_LOG_PATH)) return { sent: [], failed: [] };
  return JSON.parse(fs.readFileSync(RESEND_LOG_PATH, 'utf-8'));
}

function saveResendLog(log) {
  fs.writeFileSync(RESEND_LOG_PATH, JSON.stringify(log, null, 2));
}

const outreach = [
  { to: 'adam@redbarnrobotics.com', company: 'Red Barn Robotics', firstName: 'Adam' },
  { to: 'cayden@mentra.glass', company: 'Mentra', firstName: 'Cayden' },
  { to: 'bernardo@blindpay.com', company: 'BlindPay', firstName: 'Bernardo' },
  { to: 'love@vantel.ai', company: 'Vantel', firstName: 'Love' },
  { to: 'alex@firaresearch.com', company: 'Fira', firstName: 'Alex' },
  { to: 'simon@assistant-ui.com', company: 'assistant-ui', firstName: 'Simon' },
  { to: 'ross@artifact.engineer', company: 'Artifact', firstName: 'Ross' },
  { to: 'samai@axal.ai', company: 'Axal', firstName: 'Samai' },
  { to: 'regina@getdexterity.com', company: 'Dexterity', firstName: 'Regina' },
  { to: 'jarrett@tallyhq.com', company: 'Tally', firstName: 'Jarrett' },
  { to: 'joe@sammylabs.com', company: 'Sammy Labs', firstName: 'Joe' },
  { to: 'alex@instinct-space.com', company: 'Instinct', firstName: 'Alex' },
  { to: 'lukas@mercura.ai', company: 'Mercura', firstName: 'Lukas' },
  { to: 'joshua@tamlabs.ai', company: 'TamLabs', firstName: 'Joshua' },
  { to: 'graham@runcopycat.com', company: 'CopyCat', firstName: 'Graham' },
  { to: 'pablo@paratushealth.com', company: 'Paratus Health', firstName: 'Pablo' },
  { to: 'tycho@tensorpool.dev', company: 'TensorPool', firstName: 'Tycho' },
  { to: 'sebastian@dalus.io', company: 'Dalus', firstName: 'Sebastian' },
  { to: 'celia@rebolt.ai', company: 'Rebolt', firstName: 'Celia' },
  { to: 'manu@spott.io', company: 'Spott', firstName: 'Manu' },
  { to: 'ben@withwoz.com', company: 'Woz', firstName: 'Ben' },
  { to: 'jay@proception.ai', company: 'Proception', firstName: 'Jay' },
  { to: 'dev@joindemeter.com', company: 'Demeter', firstName: 'Dev' },
  { to: 'kaushik@wild-card.ai', company: 'Wildcard', firstName: 'Kaushik' },
  { to: 'adam@permitify.com', company: 'Permitify', firstName: 'Adam' },
  { to: 'stef@reditus.space', company: 'Reditus Space', firstName: 'Stef' },
  { to: 'christian@startpinch.com', company: 'Pinch', firstName: 'Christian' },
  { to: 'sandra@retrofit.shop', company: 'Retrofit', firstName: 'Sandra' },
  { to: 'george@archon.inc', company: 'Archon', firstName: 'George' },
  { to: 'sam@mastra.ai', company: 'Mastra', firstName: 'Sam' },
  { to: 'carlos@afterquery.com', company: 'AfterQuery', firstName: 'Carlos' },
  { to: 'boateng@fuse.ai', company: 'Fuse AI', firstName: 'Boateng' },
  { to: 'tyrone@miyagilabs.ai', company: 'Miyagi Labs', firstName: 'Tyrone' },
  { to: 'yash@triplezip.ai', company: 'TripleZip', firstName: 'Yash' },
  { to: 'sachitt@usepeppr.ai', company: 'Peppr', firstName: 'Sachitt' },
  { to: 'sriman@sennu.ai', company: 'Sennu AI', firstName: 'Sriman' },
  { to: 'ben@orbitalops.tech', company: 'Orbital Operations', firstName: 'Ben' },
  { to: 'saurabh@usemesh.com', company: 'Mesh', firstName: 'Saurabh' },
  { to: 'josh@outlit.ai', company: 'Outlit', firstName: 'Josh' },
  { to: 'dakotah@harperinsure.com', company: 'Harper', firstName: 'Dakotah' },
  { to: 'kun@calltree.ai', company: 'Calltree AI', firstName: 'Kun' },
  { to: 'ben@nitrode.com', company: 'Nitrode', firstName: 'Ben' },
  { to: 'shahryar@gokarsa.com', company: 'Karsa', firstName: 'Shahryar' },
  { to: 'pranav@exla.ai', company: 'Exla', firstName: 'Pranav' },
  { to: 'shaun@withriviera.com', company: 'Riviera', firstName: 'Shaun' },
  { to: 'charlie@vovana.com', company: 'Vovana', firstName: 'Charlie' },
  { to: 'sankeerth@agentin.ai', company: 'Agentin AI', firstName: 'Sankeerth' },
  { to: 'wilco@rejot.dev', company: 'ReJot', firstName: 'Wilco' },
  { to: 'joshua@generaltrajectory.com', company: 'General Trajectory', firstName: 'Joshua' },
  { to: 'mark@solidroad.com', company: 'SolidRoad', firstName: 'Mark' },
  { to: 'eric@trytrata.com', company: 'Trata', firstName: 'Eric' },
  { to: 'ansh@sophris.ai', company: 'Sophris', firstName: 'Ansh' },
  { to: 'abhinav@lucidic.ai', company: 'Lucidic AI', firstName: 'Abhinav' },
  { to: 'naijide@mundoai.world', company: 'Mundo AI', firstName: 'Naijide' },
  { to: 'alan@athenahq.ai', company: 'AthenaHQ', firstName: 'Alan' },
  { to: 'aamish@lopus.ai', company: 'Lopus AI', firstName: 'Aamish' },
  { to: 'kofi@joincenote.com', company: 'Cenote', firstName: 'Kofi' },
  { to: 'sophia@harbera.com', company: 'Harbera', firstName: 'Sophia' },
  { to: 'linus@augento.ai', company: 'Augento', firstName: 'Linus' },
  { to: 'haokun@galevisa.com', company: 'Gale', firstName: 'Haokun' },
  { to: 'josh@pave-robotics.com', company: 'Pave Robotics', firstName: 'Josh' },
  { to: 'bardia@fromolive.com', company: 'Olive', firstName: 'Bardia' },
  { to: 'jay@hud.so', company: 'HUD', firstName: 'Jay' },
  { to: 'yong@cuckoo.so', company: 'Cuckoo Labs', firstName: 'Yong' },
  { to: 'ahmed@mecha-health.ai', company: 'Mecha Health', firstName: 'Ahmed' },
  { to: 'max@gradewiz.ai', company: 'GradeWiz', firstName: 'Max' },
  { to: 'josh@gethealthkey.com', company: 'HealthKey', firstName: 'Josh' },
  { to: 'moses@mosaicco.com', company: 'Mosaic', firstName: 'Moses' },
  { to: 'ghita@zeroentropy.dev', company: 'ZeroEntropy', firstName: 'Ghita' },
  { to: 'areg@cardamon.ai', company: 'Cardamon', firstName: 'Areg' },
  { to: 'yos@tryamby.com', company: 'Amby Health', firstName: 'Yos' },
  { to: 'alex@carecycle.ai', company: 'careCycle', firstName: 'Alex' },
  { to: 'ishir@heysift.com', company: 'Sift Dev', firstName: 'Ishir' },
  { to: 'david@maive.ai', company: 'Maive', firstName: 'David' },
  { to: 'ethan@caseflood.ai', company: 'Caseflood', firstName: 'Ethan' },
  { to: 'gaurav@trytejas.ai', company: 'Tejas AI', firstName: 'Gaurav' },
  { to: 'pushkar@usevora.ai', company: 'Vora AI', firstName: 'Pushkar' },
  { to: 'justin@maritimefusion.com', company: 'Maritime Fusion', firstName: 'Justin' },
  { to: 'pasha@a1base.com', company: 'A1Base', firstName: 'Pasha' },
  { to: 'kashyab@verbiflow.com', company: 'Verbiflow', firstName: 'Kashyab' },
  { to: 'johnny@toothy.ai', company: 'Toothy AI', firstName: 'Johnny' },
  { to: 'alan@rocketable.com', company: 'Rocketable', firstName: 'Alan' },
  { to: 'dylan@sublingual.ai', company: 'Sublingual', firstName: 'Dylan' },
  { to: 'aditya@contrario.ai', company: 'Contrario', firstName: 'Aditya' },
  { to: 'andrew@ovlo.ai', company: 'Ovlo', firstName: 'Andrew' },
  { to: 'shaunak@trytruffle.ai', company: 'Truffle AI', firstName: 'Shaunak' },
  { to: 'adina@superglue.ai', company: 'superglue', firstName: 'Adina' },
  { to: 'aaron@closure-intel.com', company: 'Closure', firstName: 'Aaron' },
  { to: 'prithvi@gopromptless.ai', company: 'Promptless', firstName: 'Prithvi' },
  { to: 'pranav@scoutforschools.com', company: 'Scout', firstName: 'Pranav' },
  { to: 'adhityaa@subtrace.dev', company: 'Subtrace', firstName: 'Adhityaa' },
  { to: 'brogan@vocalityhealth.com', company: 'Vocality Health', firstName: 'Brogan' },
  { to: 'alex@astroenergy.ai', company: 'Astro', firstName: 'Alex' },
  { to: 'thomas@dollyglot.com', company: 'Dollyglot', firstName: 'Thomas' },
  { to: 'archit@stampmail.ai', company: 'Stamp', firstName: 'Archit' },
  { to: 'kevin@guse.io', company: 'Guse', firstName: 'Kevin' },
  { to: 'alex@subimage.io', company: 'SubImage', firstName: 'Alex' },
  { to: 'jason@nextbyte.ai', company: 'NextByte', firstName: 'Jason' },
  { to: 'kevin@leapingai.com', company: 'Leaping AI', firstName: 'Kevin' },
  { to: 'roop@bild.ai', company: 'Bild AI', firstName: 'Roop' },
];

const variants = [
  (f, c) => `Hey ${f},\n\n${c} is doing interesting work in AI. I make short motion graphic brand videos for AI startups — clean explainers that make your value clear in under 30 seconds.\n\nWorth a quick chat?\n\n— Jay\njayrx.net\njayrx16@gmail.com`,
  (f, c) => `Hey ${f},\n\n${c} caught my eye. I make short motion graphic brand videos for startups that turn what you do into something instantly clear and shareable.\n\nOpen to a quick conversation?\n\n— Jay\njayrx.net\njayrx16@gmail.com`,
  (f, c) => `Hey ${f},\n\nI make short motion graphic brand videos for AI startups — the kind that makes your product click in under 30 seconds. Thought ${c} would be a great fit.\n\nInterested?\n\n— Jay\njayrx.net\njayrx16@gmail.com`,
  (f, c) => `Hey ${f},\n\n${c} is building something worth showing properly. I make short motion graphic brand videos for AI startups that make complex products instantly understandable.\n\nWorth a quick chat?\n\n— Jay\njayrx.net\njayrx16@gmail.com`,
  (f, c) => `Hey ${f},\n\nI make short motion graphic brand videos for AI startups — clean explainers that make your product pop. ${c} seems like a strong fit.\n\nQuick chat?\n\n— Jay\njayrx.net\njayrx16@gmail.com`,
];

async function run() {
  const gmailSent = loadGmailSent();
  const log = loadResendLog();
  const alreadySent = new Set([...gmailSent, ...log.sent.map(e => e.to)]);

  const toSend = outreach.filter(e => !alreadySent.has(e.to));
  console.log(`${toSend.length} to send (${alreadySent.size} already delivered)\n`);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < toSend.length; i++) {
    const email = toSend[i];
    const body = variants[i % variants.length](email.firstName, email.company);

    try {
      const { data, error } = await resend.emails.send({
        from: `Jay <${process.env.RESEND_FROM_EMAIL}>`,
        reply_to: process.env.GMAIL_USER,
        to: email.to,
        subject: `Quick brand video idea for ${email.company}`,
        text: body,
      });

      if (error) throw new Error(error.message);

      console.log(`✓ ${email.company} → ${email.to}`);
      log.sent.push({ to: email.to, company: email.company, sentAt: new Date().toISOString() });
      sent++;
    } catch (err) {
      console.error(`✗ ${email.company} → ${email.to}: ${err.message}`);
      log.failed.push({ to: email.to, company: email.company, error: err.message, failedAt: new Date().toISOString() });
      failed++;

      if (err.message.includes('rate') || err.message.includes('limit') || err.message.includes('429')) {
        console.log('\nRate limit hit — saving progress and stopping.');
        saveResendLog(log);
        break;
      }
    }
    saveResendLog(log);
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nDone. ${sent} sent, ${failed} failed.`);
}

run().catch(console.error);
