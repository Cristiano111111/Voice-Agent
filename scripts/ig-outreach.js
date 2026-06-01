import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = process.env.APIFY_API_KEY;
const SESSION_ID = process.env.INSTAGRAM_SESSION_ID;

const SEEN_PATH = path.join(__dirname, '..', 'memory', 'ig-seen.json');
const LOG_PATH = path.join(__dirname, '..', 'memory', 'ig-dm-log.json');

// eCommerce brands
const HASHTAGS_ECOM = [
  'dtcbrand',
  'dtcfounder',
  'ecomfounder',
  'shopifybrand',
  'ecommercebrand',
  'dtcmarketing',
  'ecommerceentrepreneur',
  'shopifyentrepreneur',
];

// SaaS / software brands
const HASHTAGS_SAAS = [
  'saasfounder',
  'saasstartup',
  'b2bsaas',
  'saasmarketing',
  'softwarestartup',
  'saasproduct',
  'techfounder',
  'startupmarketing',
];

const HASHTAGS = [...HASHTAGS_ECOM, ...HASHTAGS_SAAS];

// Only DM accounts that look like real brands (not personal blogs or tiny pages)
const MIN_FOLLOWERS = 500;
const MAX_FOLLOWERS = 500000; // skip mega-brands who won't respond to cold DMs

const MESSAGE = `Hey! I make short motion graphic explainer videos for startups — the kind that makes your product click in under 30 seconds.\n\nCheck out jayrx.net — and since you're getting this DM, you get 50% off your first video 🎬\n\nInterested?`;

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
  throw new Error('Timed out waiting for run');
}

async function getResults(runId) {
  const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${TOKEN}&clean=true&limit=1000`);
  return res.json();
}

async function run() {
  const seen = loadSeen();
  const seenSet = new Set(seen.usernames);

  // Step 1: scrape hashtags
  console.log(`Scraping ${HASHTAGS.length} hashtags for startup founders...`);
  const scrapeRunId = await startRun('apify~instagram-hashtag-scraper', {
    hashtags: HASHTAGS,
    resultsLimit: 30,
    proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
  });
  console.log(`Run ID: ${scrapeRunId}`);
  await waitForRun(scrapeRunId);

  const posts = await getResults(scrapeRunId);
  console.log(`Got ${posts.length} posts`);

  // Step 2: extract unique new usernames — filter to real brands by follower count
  const seen_raw = new Map();
  for (const p of posts) {
    const username = p.ownerUsername || p.username;
    const followers = p.ownerFollowersCount ?? p.followersCount ?? p.owner?.followersCount ?? null;
    if (!username || typeof username !== 'string') continue;
    if (seenSet.has(username)) continue;
    if (seen_raw.has(username)) continue;
    if (followers !== null && (followers < MIN_FOLLOWERS || followers > MAX_FOLLOWERS)) continue;
    seen_raw.set(username, followers);
  }

  const usernames = [...seen_raw.keys()].slice(0, 60);
  console.log(`After follower filter (${MIN_FOLLOWERS}–${MAX_FOLLOWERS}): ${usernames.length} accounts`);
  if (seen_raw.size > 0) {
    [...seen_raw.entries()].slice(0, 10).forEach(([u, f]) => console.log(`  @${u} (${f ?? 'unknown'} followers)`));
  }

  console.log(`${usernames.length} new accounts to DM (${seenSet.size} already seen)`);

  if (usernames.length === 0) {
    console.log('No new accounts found. Run again later.');
    return;
  }

  // Step 3: lookup profiles to verify follower counts
  console.log(`\nVerifying ${Math.min(usernames.length, 60)} profiles...`);
  const verified = [];
  for (const username of usernames.slice(0, 60)) {
    try {
      const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] }),
      });
      const profiles = await r.json();
      const p = profiles[0];
      const followers = p?.followersCount ?? p?.followers ?? 0;
      const isBusinessOrCreator = p?.businessCategoryName || p?.isBusinessAccount || p?.isBusiness;

      if (followers >= MIN_FOLLOWERS && followers <= MAX_FOLLOWERS) {
        verified.push(username);
        const tag = isBusinessOrCreator ? ' [biz]' : '';
        console.log(`  ✓ @${username} — ${followers.toLocaleString()} followers${tag}`);
      } else {
        console.log(`  ✗ @${username} — ${followers.toLocaleString()} followers (skipped)`);
      }
    } catch {
      // If lookup fails, include anyway
      verified.push(username);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${verified.length} verified brand accounts added to queue`);

  // Step 4: save to queue for ig-dm-session.js to pick up
  verified.forEach(u => seen.usernames.push(u));
  saveSeen(seen);

  const log = loadLog();
  log.runs.push({ scrapeRunId, usernamesCount: verified.length, usernames: verified, scrapedAt: new Date().toISOString() });
  saveLog(log);

  console.log(`Queue ready — run "node scripts/ig-dm-session.js" to start sending (1/min, 15 at a time)`);
}

run().catch(console.error);
