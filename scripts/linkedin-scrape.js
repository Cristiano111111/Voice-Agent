// Scrapes LinkedIn people search using li_at session cookie
// Targets SaaS/ecom founders, extracts names + companies, runs through Hunter for emails
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LI_AT = process.env.LINKEDIN_SESSION;
const HUNTER_KEY = process.env.HUNTER_API_KEY;

const OUT_PATH = path.join(__dirname, '..', 'memory', 'linkedin-leads.json');

// Search queries — LinkedIn people search with title filters
const SEARCHES = [
  { keywords: 'saas founder', title: 'Founder' },
  { keywords: 'saas CEO startup', title: 'CEO' },
  { keywords: 'ecommerce founder DTC brand', title: 'Founder' },
  { keywords: 'shopify brand founder', title: 'Co-Founder' },
  { keywords: 'b2b software startup founder', title: 'Founder' },
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/vnd.linkedin.normalized+json+2.1',
  'Accept-Language': 'en-US,en;q=0.9',
  'x-li-lang': 'en_US',
  'x-restli-protocol-version': '2.0.0',
  'csrf-token': 'ajax:4205010936943989888',
  'Cookie': `li_at=${LI_AT}; JSESSIONID="ajax:4205010936943989888"`,
};

function loadLeads() {
  if (!fs.existsSync(OUT_PATH)) return { leads: [] };
  return JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8'));
}

function saveLeads(data) {
  fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2));
}

async function searchLinkedIn(keywords, start = 0, retries = 3) {
  const params = new URLSearchParams({
    decorationId: 'com.linkedin.voyager.deco.jserp.WebSearchPeopleResultWithDistance-5',
    q: 'people',
    query: `(keywords:${keywords},flagshipSearchIntent:SEARCH_SRP,queryParameters:List((key:resultType,value:List(PEOPLE))),includeFiltersInResponse:false)`,
    start: start.toString(),
    count: '10',
  });

  const url = `https://www.linkedin.com/voyager/api/search/blended?${params}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 429) {
      const waitMs = (attempt + 1) * 30000;
      console.log(`  Rate limited — waiting ${waitMs / 1000}s before retry ${attempt + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }
    if (!res.ok) {
      throw new Error(`LinkedIn API returned ${res.status}`);
    }
    return res.json();
  }
  throw new Error('LinkedIn API: rate limited after all retries');
}

function extractProfiles(data) {
  const profiles = [];
  const elements = data?.elements || [];

  for (const el of elements) {
    for (const item of (el.elements || [])) {
      const profile = item.hitInfo?.['com.linkedin.voyager.search.SearchProfile'];
      if (!profile) continue;

      const miniProfile = profile.miniProfile;
      if (!miniProfile) continue;

      const name = `${miniProfile.firstName || ''} ${miniProfile.lastName || ''}`.trim();
      const headline = miniProfile.occupation || '';
      const publicId = miniProfile.publicIdentifier;
      const entityUrn = miniProfile.entityUrn;

      // Try to get current company from occupation or headline
      const company = profile.currentPositions?.[0]?.companyName ||
                      profile.headline?.text?.split(' at ')?.[1]?.split(' · ')?.[0] || '';

      if (name && publicId) {
        profiles.push({
          name,
          headline,
          company,
          linkedinUrl: `https://www.linkedin.com/in/${publicId}`,
          publicId,
        });
      }
    }
  }
  return profiles;
}

async function findEmailViaHunter(firstName, lastName, domain) {
  if (!domain) return null;
  try {
    const url = `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${HUNTER_KEY}`;
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

  for (const search of SEARCHES) {
    console.log(`\nSearching: "${search.keywords}"...`);

    try {
      const result = await searchLinkedIn(search.keywords);
      const profiles = extractProfiles(result);
      console.log(`  Found ${profiles.length} profiles`);

      for (const p of profiles) {
        if (seenUrls.has(p.linkedinUrl)) continue;
        seenUrls.add(p.linkedinUrl);

        // Only keep if title suggests founder/CEO
        const isFounder = /founder|ceo|co-founder|owner|director/i.test(p.headline);
        if (!isFounder) continue;

        const [firstName, ...rest] = p.name.split(' ');
        const lastName = rest.join(' ');
        const domain = guessDomain(p.company);

        let emailData = null;
        if (domain && firstName) {
          emailData = await findEmailViaHunter(firstName, lastName, domain);
          await new Promise(r => setTimeout(r, 500));
        }

        const lead = {
          name: p.name,
          firstName,
          lastName,
          headline: p.headline,
          company: p.company,
          linkedinUrl: p.linkedinUrl,
          email: emailData?.email || null,
          emailConfidence: emailData?.confidence || null,
          foundAt: new Date().toISOString(),
        };

        newLeads.push(lead);
        data.leads.push(lead);
        saveLeads(data);

        const emailStr = emailData ? `${emailData.email} (${emailData.confidence}%)` : 'no email';
        console.log(`  ✓ ${p.name} — ${p.company} — ${emailStr}`);
      }
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 15000));
  }

  console.log(`\n${newLeads.length} new leads found`);
  const withEmail = newLeads.filter(l => l.email).length;
  console.log(`${withEmail} have verified emails → ready for outreach`);
  console.log(`Saved to memory/linkedin-leads.json`);
}

run().catch(console.error);
