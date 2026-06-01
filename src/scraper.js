import axios from "axios";
import * as cheerio from "cheerio";
import { logSearch } from "./memory.js";

export async function findBusinesses(businessType, location, options = {}) {
  const { maxResults = 50, sources = ["yelp", "yellowpages"] } = options;
  console.log(`\n🔍 Searching for "${businessType}" in "${location}"...`);

  const allResults = [];
  const errors = [];

  for (const source of sources) {
    try {
      let results = [];
      if (source === "yelp")        results = await scrapeYelp(businessType, location, maxResults);
      if (source === "yellowpages") results = await scrapeYellowPages(businessType, location, maxResults);
      if (source === "manta")       results = await scrapeManta(businessType, location, maxResults);
      console.log(`  ✅ ${source}: ${results.length} results`);
      allResults.push(...results);
    } catch (err) {
      console.log(`  ⚠️  ${source}: failed — ${err.message}`);
      errors.push({ source, error: err.message });
    }
  }

  await logSearch({ businessType, location, sources, resultsFound: allResults.length, errors });
  return allResults;
}

async function scrapeYelp(businessType, location, max) {
  const url = `https://www.yelp.com/search?find_desc=${encodeURIComponent(businessType)}&find_loc=${encodeURIComponent(location)}`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const leads = [];

  $('h3 a[href*="/biz/"], [class*="businessName"]').each((i, el) => {
    if (leads.length >= max) return false;
    const $el = $(el);
    const name = $el.text().trim();
    const href = $el.attr("href") || "";
    const $card = $el.closest("li, [class*='container']");
    const rating = parseFloat($card.find('[aria-label*="star"]').attr("aria-label") || "0") || null;
    const phone = extractPhone($card.text());
    const addr = $card.find("address").text().trim();
    if (name && name.length > 1) leads.push(normalize({ name, phone, address: addr, rating, source: "yelp", yelpUrl: `https://yelp.com${href}` }));
  });

  return leads;
}

async function scrapeYellowPages(businessType, location, max) {
  const url = `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(businessType)}&geo_location_terms=${encodeURIComponent(location)}`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const leads = [];

  $(".result, .organic").each((i, el) => {
    if (leads.length >= max) return false;
    const $el = $(el);
    const name  = $el.find(".business-name, h2 a").text().trim();
    const phone = $el.find(".phone").text().trim();
    const addr  = $el.find(".street-address").text().trim();
    const city  = $el.find(".locality").text().trim();
    const state = $el.find(".region").text().trim();
    const zip   = $el.find(".postal-code").text().trim();
    const cats  = $el.find(".categories a").map((_, a) => $(a).text()).get().join(", ");
    if (name) leads.push(normalize({ name, phone, address: addr, city, state, zip, category: cats, source: "yellowpages" }));
  });

  return leads;
}

async function scrapeManta(businessType, location, max) {
  const url = `https://www.manta.com/search?search[q]=${encodeURIComponent(businessType)}&search[loc]=${encodeURIComponent(location)}`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const leads = [];

  $("article[class*='result'], .company-item").each((i, el) => {
    if (leads.length >= max) return false;
    const $el = $(el);
    const name  = $el.find("h2 a, [itemprop='name']").text().trim();
    const phone = $el.find("[itemprop='telephone']").text().trim();
    const addr  = $el.find("[itemprop='streetAddress']").text().trim();
    const city  = $el.find("[itemprop='addressLocality']").text().trim();
    const state = $el.find("[itemprop='addressRegion']").text().trim();
    if (name) leads.push(normalize({ name, phone, address: addr, city, state, source: "manta" }));
  });

  return leads;
}

async function fetchPage(url, opts = {}) {
  const res = await axios.get(url, {
    timeout: opts.timeout || 10000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  return res.data;
}

function normalize(raw) {
  return {
    name: clean(raw.name), phone: formatPhone(raw.phone || ""),
    email: "", address: clean(raw.address || ""),
    city: clean(raw.city || ""), state: clean(raw.state || ""),
    zip: clean(raw.zip || ""), website: clean(raw.website || ""),
    rating: raw.rating || null, reviewCount: raw.reviewCount || null,
    category: clean(raw.category || ""), source: raw.source,
    sourceUrl: raw.yelpUrl || null, notes: "", status: "new",
  };
}

function clean(str) { return (str || "").replace(/\s+/g, " ").trim(); }

function formatPhone(str) {
  const d = str.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === "1") return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  return str.trim();
}

function extractPhone(text) {
  const m = text.match(/(\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4})/);
  return m ? m[1] : "";
}
