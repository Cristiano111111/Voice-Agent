// Scrapes X (Twitter) for leads using ScrapingBee API
// Searches for people/businesses looking for video editors, ad creatives, animators
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SB_KEY = 'tb_8e5285b3de6a09b71acbcc78aec6c33f';
const OUT_PATH = path.join(__dirname, '..', 'memory', 'x-leads.csv');

// Nitter instances to try (no login needed)
const NITTER_HOSTS = [
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.1d4.us',
  'https://xcancel.com',
];

const QUERIES = [
  // Video production leads
  'looking for video editor',
  'need video editor',
  'need someone to make videos',
  'hire video editor',
  'need ad creatives',
  'looking for motion graphics',
  'need animation',
  'need explainer video',
  'looking for content creator video',
  'need video ads',
  'need ugc video',
  'need short form video',
  'need product video',
  'hire animator',
  'need video production',
  // Ad creative leads
  'need ad creative',
  'looking for ads designer',
  'need facebook ads creative',
  'need meta ads creative',
  'need social media creatives',
  'need graphics for ads',
  'looking for creative agency',
  'need marketing videos',
];

const SKIP_WORDS = ['for hire', 'available for', 'offering', 'i offer', 'my services', 'freelancer available', 'dm me for', 'check my portfolio'];
const VIDEO_WORDS = ['video', 'creative', 'ad', 'animation', 'motion', 'ugc', 'content', 'editor', 'graphic'];

function buildMessage(username, tweetText) {
  const isVideoFocus = /video|animation|motion|ugc|explainer/i.test(tweetText);
  if (isVideoFocus) {
    return `Hey @${username} — saw your post. I make short motion graphic videos and video ads for brands — fast turnaround (48–72h), no contracts. Check out jayrx.net if you want to see samples. Happy to chat.`;
  }
  return `Hey @${username} — saw your post. I produce ad creatives (video ads, motion graphics, static) on a white-label basis — 48–72h delivery, no minimums. jayrx.net has samples. Worth a quick chat?`;
}

async function sbFetch(url) {
  const apiUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SB_KEY}&url=${encodeURIComponent(url)}&render_js=true&wait=3000&premium_proxy=true&country_code=us`;
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`ScrapingBee ${res.status}: ${await res.text()}`);
  return res.text();
}

function extractNitterTweets(html, query) {
  const leads = [];
  // Match tweet containers
  const tweetBlocks = html.match(/<div class="timeline-item[^"]*"[\s\S]*?(?=<div class="timeline-item|<div class="show-more|$)/g) || [];

  for (const block of tweetBlocks) {
    try {
      // Extract username
      const userMatch = block.match(/class="username"[^>]*>@([^<]+)</);
      if (!userMatch) continue;
      const username = userMatch[1].trim();

      // Extract tweet text
      const textMatch = block.match(/class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (!textMatch) continue;
      const rawText = textMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      // Extract tweet link
      const linkMatch = block.match(/class="tweet-link"[^>]*href="([^"]+)"/);
      const tweetPath = linkMatch?.[1] || '';
      const tweetUrl = tweetPath.startsWith('http') ? tweetPath : `https://x.com${tweetPath}`;

      // Extract date
      const dateMatch = block.match(/class="tweet-date"[\s\S]*?title="([^"]+)"/);
      const date = dateMatch?.[1] || '';

      // Skip if it's someone offering services
      if (SKIP_WORDS.some(w => rawText.toLowerCase().includes(w))) continue;
      // Must contain video/creative-related words
      if (!VIDEO_WORDS.some(w => rawText.toLowerCase().includes(w))) continue;
      // Skip retweets
      if (block.includes('class="retweet-header"')) continue;

      leads.push({
        platform: 'X',
        url: tweetUrl.replace('/undefined', ''),
        username,
        tweet: rawText.slice(0, 300),
        query,
        date,
        message: buildMessage(username, rawText),
      });
    } catch {}
  }
  return leads;
}

function extractXTweets(html, query) {
  // For direct X.com scraping — look for tweet JSON patterns
  const leads = [];
  try {
    // Try to find tweet article data
    const articles = html.match(/<article[^>]*data-testid="tweet"[\s\S]*?<\/article>/g) || [];
    for (const art of articles) {
      const textMatch = art.match(/data-testid="tweetText"[^>]*>([\s\S]*?)<\/div>/);
      if (!textMatch) continue;
      const rawText = textMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      const userMatch = art.match(/href="\/([^\/?"]+)"[^>]*><span[^>]*>@/);
      if (!userMatch) continue;
      const username = userMatch[1];

      const idMatch = art.match(/href="\/[^\/]+\/status\/(\d+)/);
      const tweetId = idMatch?.[1];
      const tweetUrl = tweetId ? `https://x.com/${username}/status/${tweetId}` : '';
      if (!tweetUrl) continue;

      if (SKIP_WORDS.some(w => rawText.toLowerCase().includes(w))) continue;
      if (!VIDEO_WORDS.some(w => rawText.toLowerCase().includes(w))) continue;

      leads.push({
        platform: 'X',
        url: tweetUrl,
        username,
        tweet: rawText.slice(0, 300),
        query,
        date: '',
        message: buildMessage(username, rawText),
      });
    }
  } catch {}
  return leads;
}

async function scrapeQuery(query) {
  // Try nitter instances first (cheaper credits)
  for (const host of NITTER_HOSTS) {
    try {
      const url = `${host}/search?q=${encodeURIComponent(query)}&f=tweets`;
      process.stdout.write(`  nitter (${new URL(host).hostname}) ... `);
      const html = await sbFetch(url);

      if (html.includes('timeline-item') || html.includes('tweet-content')) {
        const leads = extractNitterTweets(html, query);
        console.log(`${leads.length} leads`);
        return leads;
      } else if (html.includes('login') || html.includes('Instance is not') || html.includes('error')) {
        console.log('down/blocked');
        continue;
      } else {
        console.log('0 leads');
        return [];
      }
    } catch (err) {
      console.log(`error: ${err.message.slice(0, 50)}`);
    }
  }

  // Fallback: X.com directly
  try {
    const url = `https://x.com/search?q=${encodeURIComponent(query)}&f=live&src=typed_query`;
    process.stdout.write(`  x.com direct ... `);
    const html = await sbFetch(url);
    if (html.includes('tweetText') || html.includes('tweet-text')) {
      const leads = extractXTweets(html, query);
      console.log(`${leads.length} leads`);
      return leads;
    }
    console.log('login wall');
  } catch (err) {
    console.log(`error: ${err.message.slice(0, 50)}`);
  }

  return [];
}

async function run() {
  const allLeads = [];
  const seen = new Set();

  console.log(`Scraping X for ${QUERIES.length} queries...\n`);

  for (let i = 0; i < QUERIES.length; i++) {
    const q = QUERIES[i];
    console.log(`[${i+1}/${QUERIES.length}] "${q}"`);
    const leads = await scrapeQuery(q);
    for (const l of leads) {
      if (!seen.has(l.url) && l.url) {
        seen.add(l.url);
        allLeads.push(l);
      }
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  // Write CSV
  const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
  const header = 'Platform,URL,Username,Tweet,Query,Date,Message';
  const rows = allLeads.map(l => [l.platform, l.url, l.username, l.tweet, l.query, l.date, l.message].map(esc).join(','));
  fs.writeFileSync(OUT_PATH, [header, ...rows].join('\n'));

  console.log(`\n${allLeads.length} unique X leads saved to memory/x-leads.csv`);

  // Stats
  const queries = [...new Set(allLeads.map(l => l.query))];
  console.log(`Queries with results: ${queries.length}`);
}

run().catch(console.error);
