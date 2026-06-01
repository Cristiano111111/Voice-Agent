import { getLeads, saveInsight, getInsights } from "./memory.js";

export async function analyzeLeds() {
  const leads = await getLeads();
  if (leads.length < 5) return { message: "Need at least 5 leads to find patterns.", results: [] };

  const results = [
    ...await analyzeBySource(leads),
    ...await analyzeByCity(leads),
    ...await analyzeRatings(leads),
    ...await analyzeContacts(leads),
  ];

  for (const insight of results) await saveInsight(insight);
  return { analyzed: leads.length, insights: results };
}

async function analyzeBySource(leads) {
  const sources = {};
  for (const l of leads) {
    if (!sources[l.source]) sources[l.source] = { total: 0, converted: 0 };
    sources[l.source].total++;
    if (l.status === "converted") sources[l.source].converted++;
  }
  return Object.entries(sources).map(([source, s]) => ({
    type: "source_performance", key: source, title: `Source: ${source}`,
    data: s, recommendation: s.converted/s.total > 0.1
      ? `${source} is converting well — keep using it!`
      : `${source} has low conversions — watch this source`,
  }));
}

async function analyzeByCity(leads) {
  const cities = {};
  for (const l of leads) {
    const key = `${l.city}, ${l.state}`.replace(/^,\s*/,"").trim();
    if (!key) continue;
    if (!cities[key]) cities[key] = { total: 0, new: 0 };
    cities[key].total++;
    if (l.status === "new") cities[key].new++;
  }
  return Object.entries(cities).sort((a,b)=>b[1].total-a[1].total).slice(0,5).map(([city, s]) => ({
    type: "geographic_hotspot", key: city, title: `Hotspot: ${city}`,
    data: s, recommendation: `${city} has ${s.new} untouched leads`,
  }));
}

async function analyzeRatings(leads) {
  const low  = leads.filter(l => l.rating !== null && l.rating <= 3.5).length;
  const none = leads.filter(l => l.rating === null).length;
  const results = [];
  if (low)  results.push({ type:"rating_opportunity", key:"low_rated",  title:"Low-Rated Businesses", data:{count:low},  recommendation:`${low} businesses rated ≤3.5 — strong pitch opportunity` });
  if (none) results.push({ type:"rating_opportunity", key:"no_rating",  title:"Unrated Businesses",   data:{count:none}, recommendation:`${none} businesses have no reviews — may be newer or inactive online` });
  return results;
}

async function analyzeContacts(leads) {
  const s = {
    hasPhone:   leads.filter(l=>l.phone).length,
    hasEmail:   leads.filter(l=>l.email).length,
    hasWebsite: leads.filter(l=>l.website).length,
    missingAll: leads.filter(l=>!l.phone&&!l.email&&!l.website).length,
  };
  return [{ type:"contact_completeness", key:"overview", title:"Contact Data Quality", data:s,
    recommendation: s.missingAll > 0 ? `${s.missingAll} leads are missing all contact info — flag for manual research` : "Contact data looks solid" }];
}

export async function getInsightReport() {
  const { patterns } = await getInsights();
  if (!patterns.length) return "No insights yet. Run analyze after gathering leads.";
  return ["📊 JAY'S INSIGHTS\n" + "─".repeat(40), ...patterns.map(p => `\n💡 ${p.title}\n   ${p.recommendation}`)].join("\n");
}
