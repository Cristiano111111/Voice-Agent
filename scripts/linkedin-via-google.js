// Finds SaaS/ecom founders by searching Google for LinkedIn profiles
// Uses Apify Google Search scraper → extracts name + company → Hunter.io for emails
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.APIFY_API_KEY;
const HUNTER_KEY = process.env.HUNTER_API_KEY;

const OUT_PATH = path.join(__dirname, '..', 'memory', 'linkedin-leads.json');

const QUERIES = [
  'site:linkedin.com/in "saas founder" "currently" -jobs',
  'site:linkedin.com/in "ecommerce founder" OR "dtc founder" -jobs',
  'site:linkedin.com/in "shopify" "founder" OR "CEO" -jobs',
  'site:linkedin.com/in "b2b saas" "founder" OR "co-founder" -jobs',
  'site:linkedin.com/in "software startup" "CEO" OR "founder" -jobs',
];

function loadLeads() {
  if (!fs.existsSync(OUT_PATH)) return { leads: [] };
  return JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8'));
}

function saveLeads(data) {
  fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2));
}

async function googleSearch(query) {
  const res = await fetch(`https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queries: query,
      resultsPerPage: 10,
      maxPagesPerQuery: 1,
      languageCode: 'en',
      countryCode: 'us',
    }),
  });
  if (!res.ok) throw new Error(`Google scraper returned ${res.status}`);
  return res.json();
}

function parseProfileFromResult(item) {
  // item.title is usually "FirstName LastName - Title at Company | LinkedIn"
  // item.url is the LinkedIn profile URL
  const url = item.url || '';
  if (!url.includes('linkedin.com/in/')) return null;

  const title = item.title || '';
  const description = item.description || '';

  // Extract name from title: "John Smith - Founder at Acme | LinkedIn"
  const namePart = title.split(' - ')[0]?.trim();
  if (!namePart || namePart.length < 3 || namePart.length > 60) return null;

  const [firstName, ...rest] = namePart.split(' ');
  const lastName = rest.join(' ');
  if (!firstName || !lastName) return null;

  // Extract company: look for " at " in title or description
  const atMatch = (title + ' ' + description).match(/\bat\s+([A-Z][^|·•\n,]+)/);
  const company = atMatch?.[1]?.trim().split(' | ')[0] || '';

  // Extract headline
  const headline = title.split(' - ').slice(1).join(' - ').replace(' | LinkedIn', '').trim();

  const publicId = url.split('/in/')[1]?.split('?')[0]?.replace(/\/$/, '');

  return {
    name: namePart,
    firstName,
    lastName,
    headline,
    company,
    linkedinUrl: `https://www.linkedin.com/in/${publicId}`,
    publicId,
  };
}

async function findEmailViaHunter(firstName, lastName, domain) {
  if (!domain) return null;
  try {
    const url = `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${HUNTER_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.data?.email && json.data?.score >= 70) {
      return { email: json.data.email, confidence: json.data.score };
    }
  } catch {}
  return null;
}

function guessDomain(company) {
  if (!company) return null;
  return company.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('') + '.com';
}

async function run() {
  const data = loadLeads();
  const seenUrls = new Set(data.leads.map(l => l.linkedinUrl));
  const newLeads = [];

  for (const query of QUERIES) {
    console.log(`\nSearching: "${query}"...`);

    let results;
    try {
      results = await googleSearch(query);
    } catch (err) {
      console.log(`  Error: ${err.message}`);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    console.log(`  Got ${results.length} results`);

    for (const item of results) {
      const profile = parseProfileFromResult(item);
      if (!profile) continue;
      if (seenUrls.has(profile.linkedinUrl)) continue;
      seenUrls.add(profile.linkedinUrl);

      // Filter to founder/CEO types
      const isFounder = /founder|ceo|co-founder|owner|director/i.test(profile.headline);
      if (!isFounder) continue;

      const domain = guessDomain(profile.company);
      let emailData = null;
      if (domain && profile.firstName) {
        emailData = await findEmailViaHunter(profile.firstName, profile.lastName, domain);
        await new Promise(r => setTimeout(r, 500));
      }

      const lead = {
        name: profile.name,
        firstName: profile.firstName,
        lastName: profile.lastName,
        headline: profile.headline,
        company: profile.company,
        linkedinUrl: profile.linkedinUrl,
        email: emailData?.email || null,
        emailConfidence: emailData?.confidence || null,
        foundAt: new Date().toISOString(),
      };

      newLeads.push(lead);
      data.leads.push(lead);
      saveLeads(data);

      const emailStr = emailData ? `${emailData.email} (${emailData.confidence}%)` : 'no email';
      console.log(`  + ${profile.name} — ${profile.company} — ${emailStr}`);
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n${newLeads.length} new leads found`);
  const withEmail = newLeads.filter(l => l.email).length;
  console.log(`${withEmail} have verified emails → ready for outreach`);
  console.log(`Saved to memory/linkedin-leads.json`);
}

run().catch(console.error);
