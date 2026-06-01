// Scrapes X (Twitter) leads via Thunderbit API + Google site:x.com searches
// Uses Distill endpoint (1 credit/call) — finds buyers looking for video/creative help
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TB_KEY = 'tb_8e5285b3de6a09b71acbcc78aec6c33f';
const TB_BASE = 'https://openapi.thunderbit.com/openapi/v1';
const OUT_PATH = path.join(__dirname, '..', 'memory', 'x-leads.csv');

// Buyer-intent queries — phrased as requests, not offers
const QUERIES = [
  // Looking for video editors
  '"looking to hire" "video editor" site:x.com',
  '"anyone know" "video editor" site:x.com',
  '"recommend" "video editor" site:x.com -"for hire"',
  '"need help" "video editing" site:x.com',
  '"where can I find" "video editor" site:x.com',
  '"looking for" "video editor" site:x.com -"for hire" -"available"',
  // Looking for ad creatives
  '"need" "ad creatives" site:x.com -"we create" -"we make"',
  '"looking for" "ad creative" site:x.com',
  '"need someone to make" "ads" site:x.com',
  '"anyone make" "video ads" site:x.com',
  // Motion graphics / animation
  '"looking for" "motion graphics" site:x.com -"I do" -"I create"',
  '"need" "motion graphic" site:x.com',
  '"need" "explainer video" site:x.com',
  '"looking for" "animator" site:x.com -"available" -"for hire"',
  // UGC / content
  '"need" "ugc" "video" site:x.com',
  '"looking for" "content creator" "video" site:x.com',
  '"need" "short form" "video" site:x.com',
  // Budget signals
  '"budget" "video editor" site:x.com',
  '"hiring" "video editor" site:x.com',
  '"dm me" "video editor" -"I am" -"I\'m a" site:x.com',
  // Agency angle
  '"need" "creative agency" site:x.com',
  '"looking for" "video production" site:x.com',
  '"need" "brand video" site:x.com',
];

const SELLER_SIGNALS = [
  'i am a', "i'm a", 'i edit', 'i create', 'i make', 'i produce', 'hire me',
  'dm me for', 'my portfolio', 'my services', 'available for', 'i offer',
  'check out my work', 'i can help', 'freelancer', 'looking for clients',
  'let me edit', 'i help brands', 'boost your', 'want to create',
  'need a video editor?', 'video editor available', 'accepting clients',
  'open for editing', 'i am open for editing', 'if you need editing',
  'ad creatives for ecom', 'video editor |', 'ai video specialist',
  'affordable and sweet video editor', 'my workflow currently',
];

function buildMessage(username, snippet) {
  const isVideo = /video|animation|motion|ugc|explainer|reel/i.test(snippet);
  if (isVideo) {
    return `Hey @${username} — saw you're looking for video help. I make motion graphic videos and video ads — 48–72h turnaround, no contracts. Check out jayrx.net to see samples.`;
  }
  return `Hey @${username} — saw your post. I produce ad creatives (video ads, motion graphics, static) for brands — 48–72h delivery, no minimums. jayrx.net has samples. Worth a quick chat?`;
}

function cleanMarkdown(text) {
  return String(text || '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\*+/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTweetText(title, body) {
  const cleanedTitle = cleanMarkdown(title)
    .replace(/\s*[-|]?\s*X\s*$/i, '')
    .replace(/\s*!?\s*X\s*[·-].*$/i, '')
    .trim();
  const snippetMatch = body.match(/(?:\d+\s+(?:minutes?|hours?|days?|weeks?)\s+ago|ago)\s*---\s*([\s\S]*?)(?:\[Read more\]|$)/i);
  const cleanedSnippet = cleanMarkdown(snippetMatch?.[1] || body)
    .replace(/^X\s+https?:\/\/x\.com\s+›\s+Explore\s+/i, '')
    .replace(/^Web results\s+-+\s+/i, '')
    .trim();

  const text = cleanedTitle.length >= 18 ? cleanedTitle : cleanedSnippet;
  return text
    .replace(/^\[PAGE_CONTENT\]\s*/i, '')
    .replace(/^Skip to main content\s*/i, '')
    .replace(/^Search Results\s*=+\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function distill(url) {
  const res = await fetch(`${TB_BASE}/distill`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TB_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(35000),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'failed');
  return json.data?.markdown || '';
}

function parseGoogleResults(markdown, query) {
  const leads = [];

  // Thunderbit returns Google results as markdown links:
  // [### tweet title](https://x.com/user/status/id) body...
  const resultRe = /\[###\s*([\s\S]*?)\]\((https?:\/\/x\.com\/[^)#\s]+)[^)]*\)([\s\S]*?)(?=\n\[###\s|Google apps|$)/g;
  for (const match of markdown.matchAll(resultRe)) {
    const [, title, rawUrl, body] = match;
    const xLinkMatch = rawUrl.match(/^https?:\/\/x\.com\/([a-zA-Z0-9_]+)(?:\/status\/(\d+))?/);
    if (!xLinkMatch) continue;

    const username = xLinkMatch[1];
    const statusId = xLinkMatch[2];
    const tweetUrl = statusId
      ? `https://x.com/${username}/status/${statusId}`
      : `https://x.com/${username}`;
    if (!statusId) continue;

    // Skip X's own explore/search pages
    if (['explore', 'search', 'i', 'home', 'notifications', 'hashtag'].includes(username.toLowerCase())) continue;

    const snippet = normalizeTweetText(title, body);
    if (snippet.length < 15 || snippet.length > 500) continue;
    if (/^(posts|highlights|profile|explore)\b/i.test(snippet)) continue;

    // Filter out sellers
    const low = snippet.toLowerCase();
    if (SELLER_SIGNALS.some(s => low.includes(s))) continue;
    if (/@\w+\)\s*\/\s*Posts/i.test(title)) continue;

    // Must have video/creative intent
    const hasIntent = /video|creative|ad\b|ads\b|animat|motion|ugc|content|graphic|edit|visual|reel|production|footage/i.test(snippet);
    if (!hasIntent) continue;

    leads.push({
      platform: 'X',
      url: tweetUrl,
      username,
      tweet: snippet.slice(0, 280),
      query: query.replace(/ site:x\.com/g, '').replace(/["]/g, '').trim(),
      message: buildMessage(username, snippet),
    });
  }

  return leads;
}

async function scrapeQuery(query) {
  const encoded = encodeURIComponent(query + ' -"for hire" -"I am a"');
  const url = `https://www.google.com/search?q=${encoded}&tbs=qdr:m&num=20`;
  try {
    const markdown = await distill(url);
    if (!markdown || markdown.length < 300) return [];
    return parseGoogleResults(markdown, query);
  } catch (err) {
    throw err;
  }
}

async function run() {
  const allLeads = [];
  const seenUsers = new Set();

  console.log(`Scraping X leads via Thunderbit (Google site:x.com)...\n`);
  console.log(`${QUERIES.length} queries × 1 credit each = ~${QUERIES.length} credits\n`);

  let errors = 0;
  for (let i = 0; i < QUERIES.length; i++) {
    const q = QUERIES[i];
    const label = q.replace(/ site:x\.com/g, '').replace(/"/g, '');
    process.stdout.write(`[${i+1}/${QUERIES.length}] ${label} ... `);
    try {
      const leads = await scrapeQuery(q);
      let added = 0;
      for (const l of leads) {
        if (!seenUsers.has(l.username)) {
          seenUsers.add(l.username);
          allLeads.push(l);
          added++;
        }
      }
      console.log(`${added} leads`);
    } catch (err) {
      console.log(`error: ${err.message.slice(0, 60)}`);
      errors++;
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  // Write CSV
  const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
  const header = 'Platform,URL,Username,Tweet,Query,Message';
  const rows = allLeads.map(l =>
    [l.platform, l.url, l.username, l.tweet, l.query, l.message].map(esc).join(',')
  );
  fs.writeFileSync(OUT_PATH, [header, ...rows].join('\n'));

  console.log(`\n✓ ${allLeads.length} unique X leads → memory/x-leads.csv`);
  console.log(`  ${allLeads.filter(l => l.url.includes('/status/')).length} with direct tweet links`);
  console.log(`  ${errors} query errors`);
}

run().catch(console.error);
