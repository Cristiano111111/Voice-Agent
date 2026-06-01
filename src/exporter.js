import { createObjectCsvWriter } from "csv-writer";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { queryLeads } from "./leads.js";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "../exports");

export async function exportToCSV(filters = {}, filename = null) {
  const leads   = await queryLeads(filters);
  const outFile = filename || `jay-leads-${dateStamp()}.csv`;
  const fullPath = path.join(OUTPUT_DIR, outFile);
  await mkdir(OUTPUT_DIR, { recursive: true });

  const writer = createObjectCsvWriter({
    path: fullPath,
    header: [
      { id:"name",        title:"Business Name" },
      { id:"phone",       title:"Phone" },
      { id:"email",       title:"Email" },
      { id:"address",     title:"Address" },
      { id:"city",        title:"City" },
      { id:"state",       title:"State" },
      { id:"zip",         title:"ZIP" },
      { id:"website",     title:"Website" },
      { id:"rating",      title:"Rating" },
      { id:"category",    title:"Category" },
      { id:"status",      title:"Status" },
      { id:"source",      title:"Source" },
      { id:"notes",       title:"Notes" },
      { id:"addedAt",     title:"Date Added" },
    ],
  });
  await writer.writeRecords(leads);
  return { path: fullPath, count: leads.length };
}

export async function exportToJSON(filters = {}, filename = null) {
  const leads    = await queryLeads(filters);
  const outFile  = filename || `jay-leads-${dateStamp()}.json`;
  const fullPath = path.join(OUTPUT_DIR, outFile);
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(fullPath, JSON.stringify({ exported: new Date().toISOString(), count: leads.length, leads }, null, 2));
  return { path: fullPath, count: leads.length };
}

function dateStamp() { return new Date().toISOString().slice(0,10); }
