// Scrapes Reddit + Twitter for warm leads and exports a CSV spreadsheet
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPFLY_KEY = 'scp-live-0ed15e14ad754df9abe87233c8795962';
const OUT_CSV = path.join(__dirname, '..', 'memory', 'outreach-leads.csv');

// ─── Reddit Queries — subreddit-targeted for high intent ─────────────────────
// Only search WITHIN subreddits where people go to hire / ask for help
const REDDIT_VIDEO_QUERIES = [
  { q: 'explainer video', sub: 'forhire' },
  { q: 'explainer video', sub: 'hireafreelancer' },
  { q: 'video', sub: 'forhire' },
  { q: 'motion graphic', sub: 'forhire' },
  { q: 'explainer video', sub: 'SaaS' },
  { q: 'product video', sub: 'SaaS' },
  { q: 'explainer video', sub: 'startups' },
  { q: 'launch video', sub: 'startups' },
  { q: 'explainer video', sub: 'Entrepreneur' },
  { q: 'video production', sub: 'Entrepreneur' },
  { q: 'explainer video', sub: 'marketing' },
  { q: 'video marketing', sub: 'marketing' },
  { q: 'explainer video', sub: 'indiehackers' },
  { q: 'demo video', sub: 'indiehackers' },
];

const REDDIT_ADS_QUERIES = [
  // FacebookAds / PPC subs — people actively discussing their ad problems
  { q: 'help', sub: 'FacebookAds' },
  { q: 'ROAS', sub: 'FacebookAds' },
  { q: 'struggling', sub: 'FacebookAds' },
  { q: 'not working', sub: 'FacebookAds' },
  { q: 'meta ads', sub: 'PPC' },
  { q: 'help', sub: 'PPC' },
  { q: 'ROAS', sub: 'PPC' },
  { q: 'facebook ads', sub: 'ecommerce' },
  { q: 'meta ads', sub: 'ecommerce' },
  { q: 'ads help', sub: 'Entrepreneur' },
  { q: 'facebook ads', sub: 'Entrepreneur' },
  { q: 'ads manager', sub: 'smallbusiness' },
  { q: 'facebook ads', sub: 'smallbusiness' },
  { q: 'hire', sub: 'FacebookAds' },
];

// ─── Twitter/X Queries ────────────────────────────────────────────────────────
const TWITTER_VIDEO_QUERIES = [
  'need explainer video saas',
  'looking for product demo video',
  'need motion graphics video',
  'launch video startup',
  'animated explainer video needed',
];

const TWITTER_ADS_QUERIES = [
  'Meta ads not working',
  'Facebook ads ROAS help',
  'need Meta ads expert',
  'facebook ads struggling',
  'ecommerce Meta ads help',
];

// ─── Message Templates ────────────────────────────────────────────────────────
function buildVideoMessage(username, postSnippet) {
  const hook = postSnippet.length > 80 ? postSnippet.slice(0, 77) + '...' : postSnippet;
  return `Hey u/${username} — saw your post ("${hook}"). I make short motion graphic explainer videos for SaaS products that make your product click in under 30 seconds. Check out jayrx.net — 50% off your first video since you're seeing this.`;
}

function buildAdsMessage(username, postSnippet) {
  const hook = postSnippet.length > 80 ? postSnippet.slice(0, 77) + '...' : postSnippet;
  return `Hey u/${username} — saw your post ("${hook}"). I help brands scale on Meta — ad creatives + full campaign management, most clients 2-3x ROAS within 60 days. Check out jayrx.net — first month at cost, no markup on ad spend.`;
}

function buildTwitterVideoMessage(username, tweetSnippet) {
  const hook = tweetSnippet.length > 60 ? tweetSnippet.slice(0, 57) + '...' : tweetSnippet;
  return `Hey @${username} — saw your tweet ("${hook}"). I make short motion graphic explainer videos for SaaS. Under 30 seconds, makes your product click. Check jayrx.net — 50% off your first video.`;
}

function buildTwitterAdsMessage(username, tweetSnippet) {
  const hook = tweetSnippet.length > 60 ? tweetSnippet.slice(0, 57) + '...' : tweetSnippet;
  return `Hey @${username} — saw your tweet ("${hook}"). I help brands scale on Meta — creatives + full campaign management, 2-3x ROAS in 60 days. Check jayrx.net — first month at cost.`;
}

// Keywords that signal the post is actually relevant (not just incidentally matching)
const VIDEO_INTENT = ['explainer', 'motion graphic', 'demo video', 'product video', 'promo video', 'launch video', 'animation', 'animated', 'video production', 'video maker', 'video creator', 'hire', 'looking for', 'need a video', 'anyone make', 'recommend'];
const ADS_INTENT = ['meta ads', 'facebook ads', 'fb ads', 'roas', 'cpc', 'cpm', 'ad spend', 'campaign', 'ads manager', 'ad creative', 'retargeting', 'lookalike', 'ad account', 'struggling with ads', 'ads not', 'help with ads', 'hire'];

function isRelevant(post, service) {
  const text = (post.title + ' ' + (post.selftext || '')).toLowerCase();
  const keywords = service === 'video' ? VIDEO_INTENT : ADS_INTENT;
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

// ─── Reddit Scraper ───────────────────────────────────────────────────────────
async function searchReddit(query, subreddit, service) {
  const base = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&limit=25&t=year`;

  try {
    const res = await fetch(base, {
      headers: { 'User-Agent': 'LeadScraper/1.0 (lead research bot)' },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const posts = json.data?.children || [];

    return posts
      .map(p => p.data)
      .filter(p => !p.stickied)
      // Skip people selling/offering their own services — we want buyers
      .filter(p => !/^\[(for hire|available|offering|services)\]/i.test(p.title.trim()))
      .filter(p => isRelevant(p, service))
      .map(p => {
        const msg = service === 'video'
          ? buildVideoMessage(p.author, p.title)
          : buildAdsMessage(p.author, p.title);
        return {
          platform: 'Reddit',
          url: `https://www.reddit.com${p.permalink}`,
          username: p.author,
          post: p.title.slice(0, 120),
          subreddit: p.subreddit,
          service,
          message: msg,
          score: p.score,
        };
      });
  } catch (err) {
    console.log(`  Reddit error (${query}): ${err.message}`);
    return [];
  }
}

// ─── Twitter Scraper via Scrapfly ─────────────────────────────────────────────
async function searchTwitter(query, service) {
  const twitterUrl = `https://x.com/search?q=${encodeURIComponent(query)}&f=live&src=typed_query`;
  const url = `https://api.scrapfly.io/scrape?key=${SCRAPFLY_KEY}&url=${encodeURIComponent(twitterUrl)}&render_js=true&asp=true&rendering_wait=8000&country=us`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const content = json.result?.content || '';

    if (!content.includes('tweetText')) {
      console.log(`  Twitter: no tweets found for "${query}" (login wall or empty)`);
      return [];
    }

    // Parse tweets from rendered HTML using regex
    const tweets = [];
    const articleRe = /<article[^>]*data-testid="tweet"[^>]*>([\s\S]*?)<\/article>/g;
    let match;
    while ((match = articleRe.exec(content)) !== null) {
      const article = match[1];

      // Extract tweet text
      const textMatch = article.match(/data-testid="tweetText"[^>]*>([\s\S]*?)<\/div>/);
      const rawText = textMatch?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
      if (!rawText || rawText.length < 10) continue;

      // Extract username
      const userMatch = article.match(/data-testid="User-Name"[^>]*>[\s\S]*?@(\w+)/);
      const username = userMatch?.[1];
      if (!username) continue;

      // Extract tweet link (status URL)
      const linkMatch = article.match(/href="(\/[^/]+\/status\/\d+)"/);
      const statusPath = linkMatch?.[1];
      const tweetUrl = statusPath ? `https://x.com${statusPath}` : null;
      if (!tweetUrl) continue;

      const msg = service === 'video'
        ? buildTwitterVideoMessage(username, rawText)
        : buildTwitterAdsMessage(username, rawText);

      tweets.push({
        platform: 'Twitter/X',
        url: tweetUrl,
        username,
        post: rawText.slice(0, 120),
        subreddit: '',
        service,
        message: msg,
        score: 0,
      });
    }
    return tweets;
  } catch (err) {
    console.log(`  Twitter error (${query}): ${err.message}`);
    return [];
  }
}

// ─── Dedup ─────────────────────────────────────────────────────────────────────
function dedup(leads) {
  const seen = new Set();
  return leads.filter(l => {
    const key = l.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function toCSV(leads) {
  const headers = ['Platform', 'URL', 'Username', 'Post/Tweet', 'Service', 'Message'];
  const escape = v => `"${String(v).replace(/"/g, '""')}"`;
  const rows = leads.map(l => [
    escape(l.platform),
    escape(l.url),
    escape(l.username),
    escape(l.post),
    escape(l.service),
    escape(l.message),
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const allLeads = [];

  // Reddit video leads
  console.log('Scraping Reddit (video)...');
  for (const { q, sub } of REDDIT_VIDEO_QUERIES) {
    process.stdout.write(`  "${q}"${sub ? ` r/${sub}` : ''} ... `);
    const results = await searchReddit(q, sub, 'video');
    console.log(`${results.length} posts`);
    allLeads.push(...results);
    await new Promise(r => setTimeout(r, 800));
  }

  // Reddit ads leads
  console.log('\nScraping Reddit (ads)...');
  for (const { q, sub } of REDDIT_ADS_QUERIES) {
    process.stdout.write(`  "${q}"${sub ? ` r/${sub}` : ''} ... `);
    const results = await searchReddit(q, sub, 'ads');
    console.log(`${results.length} posts`);
    allLeads.push(...results);
    await new Promise(r => setTimeout(r, 800));
  }

  // Twitter video leads
  console.log('\nScraping Twitter/X (video)...');
  for (const q of TWITTER_VIDEO_QUERIES) {
    process.stdout.write(`  "${q}" ... `);
    const results = await searchTwitter(q, 'video');
    console.log(`${results.length} tweets`);
    allLeads.push(...results);
    await new Promise(r => setTimeout(r, 2000));
  }

  // Twitter ads leads
  console.log('\nScraping Twitter/X (ads)...');
  for (const q of TWITTER_ADS_QUERIES) {
    process.stdout.write(`  "${q}" ... `);
    const results = await searchTwitter(q, 'ads');
    console.log(`${results.length} tweets`);
    allLeads.push(...results);
    await new Promise(r => setTimeout(r, 2000));
  }

  const unique = dedup(allLeads);
  const csv = toCSV(unique);
  fs.writeFileSync(OUT_CSV, csv);

  const redditCount = unique.filter(l => l.platform === 'Reddit').length;
  const twitterCount = unique.filter(l => l.platform === 'Twitter/X').length;
  const videoCount = unique.filter(l => l.service === 'video').length;
  const adsCount = unique.filter(l => l.service === 'ads').length;

  console.log(`\n✓ ${unique.length} unique leads saved to memory/outreach-leads.csv`);
  console.log(`  Reddit: ${redditCount} | Twitter: ${twitterCount}`);
  console.log(`  Video leads: ${videoCount} | Ads leads: ${adsCount}`);
}

run().catch(console.error);
