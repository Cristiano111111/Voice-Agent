// Finds small marketing agencies on Clutch.co + Reddit r/agency
// Target: agencies that run Meta ads but don't produce creatives in-house
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPFLY_KEY = 'scp-live-0ed15e14ad754df9abe87233c8795962';
const OUT_CSV = path.join(__dirname, '..', 'memory', 'agency-leads.csv');

const AGENCY_MESSAGE = (name) =>
  `Hey ${name} — I produce ad creatives (motion graphics, short video ads, static) for agencies on a white-label basis. You handle the client and strategy, I produce the work at wholesale rates, you mark up and keep the margin. Fast turnaround (48–72h), no contracts, no minimums. Could be a good fit if you're running Meta campaigns and want to offload creative production. Check out jayrx.net — worth a quick chat?`;

// ─── Clutch Scraper ───────────────────────────────────────────────────────────
async function scrapeClutchPage(category, page = 1) {
  const url = `https://clutch.co/agencies/${category}?employees[]=1-10&employees[]=11-50&sort_by=most_reviewed&page=${page}`;
  const apiUrl = `https://api.scrapfly.io/scrape?key=${SCRAPFLY_KEY}&url=${encodeURIComponent(url)}&asp=true&render_js=true&rendering_wait=4000&country=us`;

  const res = await fetch(apiUrl);
  const json = await res.json();
  const content = json.result?.content || '';
  if (!content.includes('provider-list-item')) return [];

  const agencies = [];

  // Extract each provider card
  const cardRe = /<li class="provider-list-item"[^>]*>([\s\S]*?)<\/li>/g;
  let match;
  while ((match = cardRe.exec(content)) !== null) {
    const card = match[1];

    // Agency name from data-title or h3
    const nameMatch = card.match(/data-title="([^"]+)"/);
    const name = nameMatch?.[1];
    if (!name) continue;

    // Clutch profile URL
    const profileMatch = card.match(/href="(\/profile\/[^"]+)"/);
    const clutchProfile = profileMatch ? `https://clutch.co${profileMatch[1]}` : '';

    // Website (external link)
    const websiteMatch = card.match(/href="(https?:\/\/(?!clutch\.co)[^"]+)"[^>]*>[^<]*Visit Website/i) ||
                         card.match(/data-href="(https?:\/\/(?!clutch\.co)[^"]+)"/);
    const website = websiteMatch?.[1] || '';

    // Location
    const locationMatch = card.match(/locality[^>]*>([^<]+)/);
    const location = locationMatch?.[1]?.trim() || '';

    // Rating
    const ratingMatch = card.match(/aria-label="([0-9.]+) Stars"/);
    const rating = ratingMatch?.[1] || '';

    // Reviews count
    const reviewsMatch = card.match(/(\d+)\s+reviews?/i);
    const reviews = reviewsMatch?.[1] || '0';

    // Description
    const descMatch = card.match(/<p[^>]*class="[^"]*summary[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    const description = descMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || '';

    agencies.push({
      name,
      clutchProfile,
      website,
      location,
      rating,
      reviews: parseInt(reviews),
      description: description.slice(0, 120),
      source: 'clutch',
      category,
      email: '',
      message: AGENCY_MESSAGE(name),
    });
  }
  return agencies;
}

async function scrapeClutchCategory(category, pages = 3) {
  const all = [];
  for (let p = 1; p <= pages; p++) {
    process.stdout.write(`  ${category} page ${p}/${pages} ... `);
    const results = await scrapeClutchPage(category, p);
    console.log(`${results.length} agencies`);
    all.push(...results);
    if (p < pages) await new Promise(r => setTimeout(r, 2000));
  }
  return all;
}

// ─── Reddit r/agency scraper ──────────────────────────────────────────────────
async function scrapeRedditAgency() {
  const queries = [
    { q: 'white label', sub: 'agency' },
    { q: 'creatives', sub: 'agency' },
    { q: 'ad creative', sub: 'digital_marketing' },
    { q: 'white label creatives', sub: 'PPC' },
    { q: 'creative production', sub: 'FacebookAds' },
    { q: 'creative freelancer', sub: 'agency' },
    { q: 'production partner', sub: 'agency' },
    { q: 'outsource creatives', sub: 'FacebookAds' },
  ];

  const results = [];
  for (const { q, sub } of queries) {
    try {
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&limit=25&t=year`;
      const res = await fetch(url, { headers: { 'User-Agent': 'LeadScraper/1.0' } });
      if (!res.ok) continue;
      const json = await res.json();
      const posts = (json.data?.children || []).map(p => p.data)
        .filter(p => !p.stickied)
        .filter(p => {
          const text = (p.title + ' ' + (p.selftext || '')).toLowerCase();
          return text.includes('agency') || text.includes('client') || text.includes('white label') ||
                 text.includes('creative') || text.includes('outsource') || text.includes('vendor');
        })
        .filter(p => !/^\[(for hire|offering|services)\]/i.test(p.title))
        .map(p => ({
          name: `u/${p.author}`,
          clutchProfile: '',
          website: '',
          location: '',
          rating: '',
          reviews: p.score,
          description: p.title.slice(0, 120),
          source: 'reddit',
          category: `r/${p.subreddit}`,
          email: '',
          message: `Hey u/${p.author} — saw your post about "${p.title.slice(0, 60)}". I produce ad creatives (motion graphics, video ads, static) for agencies on a white-label basis. You handle the client, I produce the work at wholesale, you keep the margin. Check out jayrx.net.`,
        }));
      process.stdout.write(`  r/${sub} "${q}" ... `);
      console.log(`${posts.length} posts`);
      results.push(...posts);
    } catch {}
    await new Promise(r => setTimeout(r, 600));
  }
  return results;
}

// ─── Email scraper for agency websites ───────────────────────────────────────
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const SKIP = ['noreply', 'no-reply', '@sentry', '@example', '@test.com', 'email@email'];

async function findEmail(website) {
  if (!website) return '';
  const base = website.replace(/\/$/, '');
  for (const page of [base, `${base}/contact`, `${base}/about`]) {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 6000);
      const res = await fetch(page, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'follow',
      });
      if (!res.ok) continue;
      const html = await res.text();
      const emails = (html.match(EMAIL_RE) || [])
        .map(e => e.toLowerCase())
        .filter(e => !SKIP.some(s => e.includes(s)));
      if (emails.length > 0) return emails[0];
    } catch {}
  }
  return '';
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function toCSV(leads) {
  const headers = ['Agency Name', 'Website', 'Email', 'Location', 'Rating', 'Reviews', 'Source', 'Category', 'Description', 'Outreach Message'];
  const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
  const rows = leads.map(l => [
    esc(l.name), esc(l.website || l.clutchProfile), esc(l.email),
    esc(l.location), esc(l.rating), esc(l.reviews),
    esc(l.source), esc(l.category), esc(l.description), esc(l.message),
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const all = [];

  // Clutch — PPC and social media agencies
  console.log('Scraping Clutch.co (PPC agencies)...');
  const ppcAgencies = await scrapeClutchCategory('ppc', 4);
  all.push(...ppcAgencies);

  console.log('\nScraping Clutch.co (social media agencies)...');
  const smAgencies = await scrapeClutchCategory('social-media-marketing', 4);
  all.push(...smAgencies);

  // Dedup by name
  const seen = new Set();
  const unique = all.filter(a => {
    const key = a.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  console.log(`\n${unique.length} unique Clutch agencies found`);

  // Reddit agency posts
  console.log('\nScraping Reddit r/agency...');
  const redditAgencies = await scrapeRedditAgency();
  console.log(`${redditAgencies.length} Reddit posts found`);

  const allLeads = [...unique, ...redditAgencies];

  // Scrape emails for Clutch agencies that have websites
  console.log('\nScraping emails from agency websites...');
  let emailsFound = 0;
  for (let i = 0; i < unique.length; i++) {
    const agency = unique[i];
    if (!agency.website) continue;
    process.stdout.write(`  [${i + 1}/${unique.length}] ${agency.name} ... `);
    const email = await findEmail(agency.website);
    agency.email = email;
    if (email) { console.log(email); emailsFound++; }
    else console.log('—');
  }
  console.log(`\n${emailsFound} emails found`);

  // Save
  fs.writeFileSync(OUT_CSV, toCSV(allLeads));
  console.log(`\n✓ Saved ${allLeads.length} agency leads to memory/agency-leads.csv`);
  console.log(`  Clutch: ${unique.length} | Reddit: ${redditAgencies.length} | Emails: ${emailsFound}`);
}

run().catch(console.error);
