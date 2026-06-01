// Finds people on Reddit actively asking for launch videos or Meta ads help
// Uses Reddit's public JSON API — no auth, no API key needed
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.join(__dirname, '..', 'memory', 'reddit-leads.json');
const SEEN_PATH = path.join(__dirname, '..', 'memory', 'reddit-seen.json');

const SEARCHES = [
  // Launch video / motion graphics
  { sub: 'entrepreneur', q: 'launch video explainer', service: 'video' },
  { sub: 'SaaS', q: 'launch video demo video explainer', service: 'video' },
  { sub: 'startups', q: 'launch video explainer video', service: 'video' },
  { sub: 'forhire', q: 'video editor motion graphics explainer', service: 'video' },
  { sub: 'entrepreneur', q: 'need video creator animator', service: 'video' },
  // Meta / Facebook ads
  { sub: 'FacebookAds', q: 'need help agency looking for', service: 'ads' },
  { sub: 'PPC', q: 'facebook meta ads help agency', service: 'ads' },
  { sub: 'ecommerce', q: 'facebook ads help struggling ROAS', service: 'ads' },
  { sub: 'entrepreneur', q: 'facebook ads meta ads struggling help', service: 'ads' },
  { sub: 'smallbusiness', q: 'facebook ads need help run ads', service: 'ads' },
  { sub: 'dropship', q: 'facebook ads meta ads help', service: 'ads' },
];

// Keywords that signal genuine buying intent
const VIDEO_INTENT = /need.*video|want.*video|looking.*video|hire.*video|video.*editor|explainer.*video|launch.*video|demo.*video|need.*animator|motion.*graphic/i;
const ADS_INTENT = /need.*ads|help.*ads|ads.*help|struggling.*ads|hire.*media|looking.*agency|run.*ads|manage.*ads|ads.*manager|facebook.*ads.*help|meta.*ads.*help/i;

function loadSeen() {
  if (!fs.existsSync(SEEN_PATH)) return { ids: [] };
  return JSON.parse(fs.readFileSync(SEEN_PATH, 'utf-8'));
}

function saveSeen(data) {
  fs.writeFileSync(SEEN_PATH, JSON.stringify(data, null, 2));
}

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) return { leads: [] };
  return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
}

function saveLog(data) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(data, null, 2));
}

async function searchReddit(subreddit, query) {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=new&restrict_sr=1&limit=25&t=week`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OutreachBot/1.0 (personal project)' },
  });
  if (!res.ok) throw new Error(`Reddit API ${res.status}`);
  const data = await res.json();
  return data?.data?.children?.map(c => c.data) || [];
}

async function run() {
  const seen = loadSeen();
  const seenSet = new Set(seen.ids);
  const log = loadLog();
  const newLeads = [];

  for (const search of SEARCHES) {
    console.log(`\n[${search.service.toUpperCase()}] r/${search.sub} — "${search.query || search.q}"`);

    let posts;
    try {
      posts = await searchReddit(search.sub, search.q);
    } catch (err) {
      console.log(`  Error: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    console.log(`  Got ${posts.length} posts`);

    for (const post of posts) {
      if (seenSet.has(post.id)) continue;
      if (post.author === '[deleted]' || post.author === 'AutoModerator') continue;
      // Skip posts older than 2 weeks
      const ageHours = (Date.now() / 1000 - post.created_utc) / 3600;
      if (ageHours > 336) continue;

      const fullText = (post.title + ' ' + (post.selftext || '')).toLowerCase();
      const intentMatch = search.service === 'video'
        ? VIDEO_INTENT.test(post.title + ' ' + post.selftext)
        : ADS_INTENT.test(post.title + ' ' + post.selftext);

      if (!intentMatch) continue;

      seenSet.add(post.id);
      seen.ids.push(post.id);

      const lead = {
        username: post.author,
        subreddit: post.subreddit,
        title: post.title,
        body: (post.selftext || '').slice(0, 300),
        postUrl: `https://reddit.com${post.permalink}`,
        service: search.service,
        ageHours: Math.round(ageHours),
        score: post.score,
        foundAt: new Date().toISOString(),
        contacted: false,
      };

      newLeads.push(lead);
      log.leads.push(lead);
      console.log(`  + u/${post.author} — "${post.title.slice(0, 60)}" (${Math.round(ageHours)}h ago)`);
    }

    saveSeen(seen);
    saveLog(log);
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${newLeads.length} new leads found`);
  console.log(`  ${newLeads.filter(l => l.service === 'video').length} need videos`);
  console.log(`  ${newLeads.filter(l => l.service === 'ads').length} need ads`);

  if (newLeads.length > 0) {
    console.log('\n--- TOP LEADS TO CONTACT ---');
    for (const l of newLeads.slice(0, 10)) {
      console.log(`[${l.service.toUpperCase()}] u/${l.username} | ${l.title.slice(0, 60)}`);
      console.log(`  ${l.postUrl}`);
    }
    console.log('\nReply to their posts or run "node scripts/reddit-dm.js" to DM them.');
  }
}

run().catch(console.error);
