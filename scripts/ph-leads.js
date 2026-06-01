// Pulls maker (founder) data from PH products we already track via Puppeteer
// Matches ph-monitor.js approach to bypass bot detection
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
puppeteerExtra.use(StealthPlugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HUNTER_KEY = process.env.HUNTER_API_KEY;

const SEEN_PATH = path.join(__dirname, '..', 'memory', 'ph-seen.json');
const OUT_PATH = path.join(__dirname, '..', 'memory', 'ph-leads.json');

function loadSeen() {
  if (!fs.existsSync(SEEN_PATH)) return { slugs: [] };
  return JSON.parse(fs.readFileSync(SEEN_PATH, 'utf-8'));
}

function loadLeads() {
  if (!fs.existsSync(OUT_PATH)) return { leads: [] };
  return JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8'));
}

function saveLeads(data) {
  fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2));
}

async function fetchProductMakers(page, slug) {
  await page.goto(`https://www.producthunt.com/posts/${slug}`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await new Promise(r => setTimeout(r, 2000));

  const html = await page.content();

  // PH embeds data as JSON in page scripts (no __NEXT_DATA__)
  const makersStart = html.indexOf('"makers":[');
  if (makersStart === -1) throw new Error('makers array not found');

  // Extract the full makers JSON array by tracking bracket depth
  const arrayStart = makersStart + '"makers":'.length;  // points to '['
  let bracketDepth = 0, arrayEnd = arrayStart;
  for (let i = arrayStart; i < html.length; i++) {
    if (html[i] === '[') bracketDepth++;
    if (html[i] === ']') {
      bracketDepth--;
      if (bracketDepth === 0) { arrayEnd = i; break; }
    }
  }
  let makers;
  try {
    makers = JSON.parse(html.slice(arrayStart, arrayEnd + 1));
  } catch {
    throw new Error('Failed to parse makers JSON');
  }

  // Search the full HTML for product name, domain, tagline near the slug
  const slugIdx = html.indexOf(`"slug":"${slug}"`);
  const slugContext = slugIdx >= 0 ? html.slice(slugIdx, slugIdx + 600) : '';
  const domainMatch = slugContext.match(/"websiteDomain":"([^"]+)"/) ||
                      html.match(/"websiteDomain":"([^"]+)"/);
  const websiteMatch = slugContext.match(/"websiteUrl":"(https?:\/\/[^"]+)"/) ||
                       html.match(/"websiteUrl":"(https?:\/\/[^"]+)"/);
  const nameMatch = html.match(new RegExp(`"name":"([^"]+)","slug":"${slug}"`));
  const taglineMatch = slugContext.match(/"tagline":"([^"]+)"/);

  // Fallback: get name from H1
  const h1 = await page.$eval('h1', el => el.textContent?.trim()).catch(() => null);

  return {
    name: nameMatch?.[1] || h1 || slug,
    tagline: taglineMatch?.[1] || '',
    website: websiteMatch?.[1] || null,
    domain: domainMatch?.[1] || null,
    makers,
  };
}

async function findEmailViaHunter(firstName, lastName, domain) {
  if (!domain || !firstName) return null;
  try {
    const url = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${HUNTER_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.data?.email && json.data?.score >= 70) {
      return { email: json.data.email, confidence: json.data.score };
    }
  } catch {}
  return null;
}

function extractDomain(url) {
  if (!url) return null;
  try {
    const d = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
    return d.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function run() {
  const seen = loadSeen();
  const data = loadLeads();
  const processedSlugs = new Set(data.leads.map(l => l.phSlug).filter(Boolean));
  const newLeads = [];

  const slugs = seen.slugs.filter(s => !processedSlugs.has(s));
  console.log(`Processing ${slugs.length} new PH products (${processedSlugs.size} already done)...`);

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const slug of slugs) {
    try {
      const post = await fetchProductMakers(page, slug);
      const domain = extractDomain(post.website);
      console.log(`\n[${slug}] ${post.name} — ${domain || 'no domain'} — ${post.makers?.length || 0} makers`);

      for (const maker of (post.makers || [])) {
        const nameParts = (maker.name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        if (!firstName) continue;

        let emailData = null;
        if (domain) {
          emailData = await findEmailViaHunter(firstName, lastName, domain);
          await new Promise(r => setTimeout(r, 400));
        }

        const lead = {
          name: maker.name,
          firstName,
          lastName,
          headline: maker.headline || '',
          phUsername: maker.username,
          twitterUsername: maker.twitterUsername || null,
          company: post.name,
          website: post.website || null,
          domain,
          email: emailData?.email || null,
          emailConfidence: emailData?.confidence || null,
          phSlug: slug,
          phTagline: post.tagline,
          foundAt: new Date().toISOString(),
        };

        newLeads.push(lead);
        data.leads.push(lead);
        saveLeads(data);

        const emailStr = emailData ? `${emailData.email} (${emailData.confidence}%)` : 'no email';
        const twitterStr = maker.twitterUsername ? `@${maker.twitterUsername}` : maker.username;
        console.log(`  + ${maker.name} — ${twitterStr} — ${emailStr}`);
      }

      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.log(`  [${slug}] Error: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  await browser.close();

  console.log(`\n${newLeads.length} new leads found`);
  const withEmail = newLeads.filter(l => l.email).length;
  const withTwitter = newLeads.filter(l => l.twitterUsername).length;
  console.log(`${withEmail} have verified emails`);
  console.log(`${withTwitter} have Twitter handles`);
  console.log(`Saved to memory/ph-leads.json`);
}

run().catch(console.error);
