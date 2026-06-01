import { getLeads, addLeads, updateLead, removeDuplicates } from "./memory.js";

export async function importLeads(rawLeads) { return addLeads(rawLeads); }

export async function queryLeads(filters = {}) {
  const leads = await getLeads();
  return leads.filter((l) => {
    if (filters.status   && l.status !== filters.status) return false;
    if (filters.source   && l.source !== filters.source) return false;
    if (filters.city     && !l.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.minRating && (l.rating || 0) < filters.minRating) return false;
    if (filters.hasPhone !== undefined && !!l.phone !== filters.hasPhone) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (![l.name, l.category, l.city, l.notes].join(" ").toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export async function getLeadStats() {
  const leads = await getLeads();
  const byStatus = {}, bySource = {}, byCity = {};
  for (const l of leads) {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    bySource[l.source] = (bySource[l.source] || 0) + 1;
    byCity[l.city || "Unknown"] = (byCity[l.city || "Unknown"] || 0) + 1;
  }
  const ratings = leads.filter((l) => l.rating).map((l) => l.rating);
  const avgRating = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : null;
  return { total: leads.length, byStatus, bySource, byCity, avgRating };
}

export async function markContacted(id, notes = "") { return updateLead(id, { status: "contacted", notes }); }
export async function markConverted(id, notes = "") { return updateLead(id, { status: "converted", notes }); }
export async function markSkipped(id, reason = "")  { return updateLead(id, { status: "skipped", skipReason: reason }); }

export async function cleanLeads() {
  const removed = await removeDuplicates();
  const leads = await getLeads();
  const flagged = [];
  for (const lead of leads) {
    if (!lead.phone && !lead.email && !lead.website) {
      await updateLead(lead.id, { status: "needs_review", reviewFlag: "missing_contact_info" });
      flagged.push(lead.id);
    }
  }
  return { duplicatesRemoved: removed, flagged: flagged.length };
}

export function formatLeadTable(leads, limit = 20) {
  const shown = leads.slice(0, limit);
  const lines = shown.map((l, i) => {
    const name   = truncate(l.name, 30).padEnd(30);
    const city   = truncate(l.city || "", 15).padEnd(15);
    const phone  = (l.phone || "—").padEnd(16);
    const rating = l.rating ? `${l.rating}★` : "—";
    return `${String(i+1).padStart(3)}. ${name} | ${city} | ${phone} | ${rating.padEnd(6)} | ${l.status}`;
  });
  const header = `  #  ${"NAME".padEnd(30)} | ${"CITY".padEnd(15)} | ${"PHONE".padEnd(16)} | RATING | STATUS`;
  return [header, "─".repeat(header.length), ...lines].join("\n");
}

function truncate(str, len) { return str.length > len ? str.slice(0, len-1) + "…" : str; }
