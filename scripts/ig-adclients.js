// Finds ecom/DTC brands on Instagram that could benefit from Meta ad scaling
// Different from ig-outreach.js — higher follower floor, product-focused hashtags
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.APIFY_API_KEY;
const SESSION_ID = process.env.INSTAGRAM_SESSION_ID;

const SEEN_PATH = path.join(__dirname, '..', 'memory', 'ig-adclients-seen.json');
const LOG_PATH = path.join(__dirname, '..', 'memory', 'ig-adclients-log.json');

// Product/brand hashtags — people buying and selling physical/digital products
const HASHTAGS = [
  'shopifystore',
  'dtcbrand',
  'ecommercestore',
  'onlinestore',
  'dtcgrowth',
  'ecomgrowth',
  'shopifyseller',
  'brandowner',
  'ecommercebusiness',
  'productbusiness',
  'skincarebrand',
  'fashionbrand',
  'fitnessbrand',
  'candles',
  'jewelrybrand',
];

// Ecom brands typically have more followers — raise the floor
const MIN_FOLLOWERS = 1000;
const MAX_FOLLOWERS = 500000;

function loadSeen() {
  if (!fs.existsSync(SEEN_PATH)) return { usernames: [] };
  return JSON.parse(fs.readFileSync(SEEN_PATH, 'utf-8'));
}

function saveSeen(data) {
  fs.writeFileSync(SEEN_PATH, JSON.stringify(data, null, 2));
}

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) return { runs: [] };
  return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
}

function saveLog(data) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(data, null, 2));
}

async function startRun(actorId, input) {
  const res = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.data?.id) throw new Error(`Failed to start ${actorId}: ${JSON.stringify(json)}`);
  return json.data.id;
}

async function waitForRun(runId, timeoutMs = 300000) {
  const start = Date.now();
  process.stdout.write('Waiting');
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${TOKEN}`);
    const json = await res.json();
    const status = json.data?.status;
    if (status === 'SUCCEEDED') { process.stdout.write(' done\n'); return; }
    if (status === 'FAILED' || status === 'ABORTED') throw new Error(`Run ${status}`);
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Timed out');
}

async function getResults(runId) {
  const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${TOKEN}&clean=true&limit=1000`);
  return res.json();
}

async function run() {
  const seen = loadSeen();
  const seenSet = new Set(seen.usernames);

  console.log(`Scraping ${HASHTAGS.length} hashtags for ecom brands...`);
  const scrapeRunId = await startRun('apify~instagram-hashtag-scraper', {
    hashtags: HASHTAGS,
    resultsLimit: 30,
    proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
  });
  console.log(`Run ID: ${scrapeRunId}`);
  await waitForRun(scrapeRunId);

  const posts = await getResults(scrapeRunId);
  console.log(`Got ${posts.length} posts`);

  const candidates = new Map();
  for (const p of posts) {
    const username = p.ownerUsername || p.username;
    const followers = p.ownerFollowersCount ?? p.followersCount ?? p.owner?.followersCount ?? null;
    if (!username || typeof username !== 'string') continue;
    if (seenSet.has(username)) continue;
    if (candidates.has(username)) continue;
    if (followers !== null && (followers < MIN_FOLLOWERS || followers > MAX_FOLLOWERS)) continue;
    candidates.set(username, followers);
  }

  const usernames = [...candidates.keys()].slice(0, 60);
  console.log(`After follower filter (${MIN_FOLLOWERS}–${MAX_FOLLOWERS}): ${usernames.length} candidates`);

  if (usernames.length === 0) {
    console.log('No new accounts found. Run again later.');
    return;
  }

  // Verify via profile scraper
  console.log(`\nVerifying ${usernames.length} profiles...`);
  const verified = [];
  for (const username of usernames) {
    try {
      const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] }),
      });
      const profiles = await r.json();
      const p = profiles[0];
      const followers = p?.followersCount ?? p?.followers ?? 0;
      const isBiz = p?.businessCategoryName || p?.isBusinessAccount || p?.isBusiness;

      if (followers >= MIN_FOLLOWERS && followers <= MAX_FOLLOWERS) {
        verified.push(username);
        const tag = isBiz ? ' [biz]' : '';
        console.log(`  ✓ @${username} — ${followers.toLocaleString()} followers${tag}`);
      } else {
        console.log(`  ✗ @${username} — ${followers.toLocaleString()} (skipped)`);
      }
    } catch {
      verified.push(username);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  verified.forEach(u => seen.usernames.push(u));
  saveSeen(seen);

  const log = loadLog();
  log.runs.push({ scrapeRunId, count: verified.length, usernames: verified, scrapedAt: new Date().toISOString() });
  saveLog(log);

  console.log(`\n${verified.length} verified ecom brands added to queue`);
  console.log(`Run "node scripts/ig-adclients-dm.js" to start sending`);
}

run().catch(console.error);
