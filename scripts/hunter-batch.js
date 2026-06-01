// Runs Hunter.io email lookups on ph-leads.json entries that have no email yet
// Safe to run any time — skips leads that already have emails
// Designed to run after Hunter.io monthly reset (resets June 18, 2026)
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HUNTER_KEY = process.env.HUNTER_API_KEY;
const PH_LEADS_PATH = path.join(__dirname, '..', 'memory', 'ph-leads.json');
const LI_LEADS_PATH = path.join(__dirname, '..', 'memory', 'linkedin-leads.json');

async function checkHunterCredits() {
  const res = await fetch(`https://api.hunter.io/v2/account?api_key=${HUNTER_KEY}`);
  const json = await res.json();
  return json?.data?.requests?.credits;
}

async function findEmail(firstName, lastName, domain) {
  if (!domain || !firstName) return null;
  try {
    const url = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${HUNTER_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.data?.email && json.data?.score >= 60) {
      return { email: json.data.email, confidence: json.data.score };
    }
    if (json.errors) console.log(`  Hunter error: ${json.errors[0]?.details}`);
  } catch {}
  return null;
}

function loadLeads(filePath) {
  if (!fs.existsSync(filePath)) return { leads: [] };
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveLeads(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function run() {
  // Check credits first
  const credits = await checkHunterCredits();
  console.log(`Hunter.io credits: ${credits?.used}/${credits?.used + credits?.available} used`);
  if (credits?.available === 0) {
    console.log('No credits available. Resets on the 18th of each month.');
    return;
  }
  console.log(`${credits?.available} lookups available\n`);

  let totalFound = 0;
  let creditsUsed = 0;
  const maxCredits = credits?.available || 0;

  // Process PH leads
  const phData = loadLeads(PH_LEADS_PATH);
  const phNeedEmail = phData.leads.filter(l => !l.email && l.domain && l.firstName &&
    !l.domain.includes('apple.com') && !l.domain.includes('google.com') &&
    !l.domain.includes('github.com') && !l.domain.includes('cursor.com'));

  console.log(`PH leads needing emails: ${phNeedEmail.length}`);

  for (const lead of phNeedEmail) {
    if (creditsUsed >= maxCredits) {
      console.log('\nCredits exhausted — stopping. Run again after reset.');
      break;
    }
    const emailData = await findEmail(lead.firstName, lead.lastName, lead.domain);
    creditsUsed++;
    if (emailData) {
      lead.email = emailData.email;
      lead.emailConfidence = emailData.confidence;
      totalFound++;
      console.log(`  ✓ ${lead.name} — ${lead.company} — ${emailData.email} (${emailData.confidence}%)`);
    }
    await new Promise(r => setTimeout(r, 600));
  }

  saveLeads(PH_LEADS_PATH, phData);

  // Also process LinkedIn leads if any exist
  const liData = loadLeads(LI_LEADS_PATH);
  const liNeedEmail = liData.leads.filter(l => !l.email && l.domain && l.firstName);
  if (liNeedEmail.length > 0) {
    console.log(`\nLinkedIn leads needing emails: ${liNeedEmail.length}`);
    for (const lead of liNeedEmail) {
      if (creditsUsed >= maxCredits) break;
      const emailData = await findEmail(lead.firstName, lead.lastName, lead.domain);
      creditsUsed++;
      if (emailData) {
        lead.email = emailData.email;
        lead.emailConfidence = emailData.confidence;
        totalFound++;
        console.log(`  ✓ ${lead.name} — ${lead.company} — ${emailData.email}`);
      }
      await new Promise(r => setTimeout(r, 600));
    }
    saveLeads(LI_LEADS_PATH, liData);
  }

  console.log(`\n${totalFound} emails found | ${creditsUsed} credits used`);
  const phWithEmail = phData.leads.filter(l => l.email).length;
  console.log(`PH leads with email: ${phWithEmail}/${phData.leads.length}`);
}

run().catch(console.error);
