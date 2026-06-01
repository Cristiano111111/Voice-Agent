import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = path.join(__dirname, "../memory");

const FILES = {
  leads:       path.join(MEMORY_DIR, "leads.json"),
  preferences: path.join(MEMORY_DIR, "preferences.json"),
  history:     path.join(MEMORY_DIR, "history.json"),
  insights:    path.join(MEMORY_DIR, "insights.json"),
};

const DEFAULTS = {
  leads: { leads: [], total: 0, lastUpdated: null },
  preferences: {
    serviceTypes: [], targetIndustries: [], targetRegions: [],
    leadQualityFilters: { minRating: null, maxRating: null, requiresWebsite: false, requiresPhone: true, requiresEmail: false },
    excludeKeywords: [], created: new Date().toISOString(),
  },
  history: { searches: [], totalSearches: 0 },
  insights: { patterns: [], lastAnalyzed: null, leadsAnalyzed: 0 },
};

export async function readMemory(key) {
  try {
    const raw = await fs.readFile(FILES[key], "utf-8");
    return JSON.parse(raw);
  } catch { return structuredClone(DEFAULTS[key]); }
}

export async function writeMemory(key, data) {
  await fs.mkdir(MEMORY_DIR, { recursive: true });
  await fs.writeFile(FILES[key], JSON.stringify(data, null, 2), "utf-8");
}

export async function getLeads() {
  const mem = await readMemory("leads");
  return mem.leads;
}

export async function addLeads(newLeads) {
  const mem = await readMemory("leads");
  const existing = new Set(mem.leads.map(normalizeKey));
  const deduped = newLeads.filter((l) => !existing.has(normalizeKey(l)));
  const timestamped = deduped.map((l) => ({
    ...l, id: generateId(), addedAt: new Date().toISOString(), status: l.status || "new",
  }));
  mem.leads = [...mem.leads, ...timestamped];
  mem.total = mem.leads.length;
  mem.lastUpdated = new Date().toISOString();
  await writeMemory("leads", mem);
  return { added: timestamped.length, skipped: newLeads.length - timestamped.length };
}

export async function updateLead(id, updates) {
  const mem = await readMemory("leads");
  const idx = mem.leads.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error(`Lead ${id} not found`);
  mem.leads[idx] = { ...mem.leads[idx], ...updates, updatedAt: new Date().toISOString() };
  await writeMemory("leads", mem);
  return mem.leads[idx];
}

export async function removeDuplicates() {
  const mem = await readMemory("leads");
  const seen = new Set();
  const cleaned = mem.leads.filter((l) => {
    const key = normalizeKey(l);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  const removed = mem.leads.length - cleaned.length;
  mem.leads = cleaned; mem.total = cleaned.length;
  mem.lastUpdated = new Date().toISOString();
  await writeMemory("leads", mem);
  return removed;
}

export async function getPreferences() { return readMemory("preferences"); }

export async function updatePreferences(updates) {
  const prefs = await readMemory("preferences");
  const merged = { ...prefs, ...updates, updatedAt: new Date().toISOString() };
  await writeMemory("preferences", merged);
  return merged;
}

export async function logSearch(query) {
  const mem = await readMemory("history");
  mem.searches.unshift({ ...query, id: generateId(), timestamp: new Date().toISOString() });
  mem.searches = mem.searches.slice(0, 200);
  mem.totalSearches += 1;
  await writeMemory("history", mem);
}

export async function getHistory(limit = 10) {
  const mem = await readMemory("history");
  return mem.searches.slice(0, limit);
}

export async function saveInsight(pattern) {
  const mem = await readMemory("insights");
  const existing = mem.patterns.findIndex((p) => p.type === pattern.type && p.key === pattern.key);
  if (existing >= 0) {
    mem.patterns[existing] = { ...mem.patterns[existing], ...pattern, updatedAt: new Date().toISOString() };
  } else {
    mem.patterns.push({ ...pattern, id: generateId(), createdAt: new Date().toISOString() });
  }
  mem.lastAnalyzed = new Date().toISOString();
  await writeMemory("insights", mem);
}

export async function getInsights() { return readMemory("insights"); }

export async function getStatus() {
  const [leadsMem, prefs, history, insights] = await Promise.all([
    readMemory("leads"), readMemory("preferences"), readMemory("history"), readMemory("insights"),
  ]);
  return {
    totalLeads: leadsMem.total, lastUpdated: leadsMem.lastUpdated,
    serviceTypes: prefs.serviceTypes, targetIndustries: prefs.targetIndustries,
    targetRegions: prefs.targetRegions, totalSearches: history.totalSearches,
    lastSearch: history.searches[0] || null, insightCount: insights.patterns.length,
    newLeads: leadsMem.leads.filter((l) => l.status === "new").length,
    contactedLeads: leadsMem.leads.filter((l) => l.status === "contacted").length,
  };
}

function normalizeKey(lead) {
  const name  = (lead.name || "").toLowerCase().replace(/\s+/g, "");
  const phone = (lead.phone || "").replace(/\D/g, "");
  const addr  = (lead.address || "").toLowerCase().replace(/\s+/g, "");
  return `${name}|${phone}|${addr}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
