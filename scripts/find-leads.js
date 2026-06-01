import { findBusinesses } from "../src/scraper.js";
import { importLeads }    from "../src/leads.js";

const [,, businessType, location, maxArg] = process.argv;
if (!businessType || !location) { console.error('Usage: node scripts/find-leads.js "business type" "City, State"'); process.exit(1); }

const maxResults = parseInt(maxArg) || 30;
console.log(`\n🔍 Searching for "${businessType}" in "${location}"...\n`);

try {
  const leads  = await findBusinesses(businessType, location, { maxResults });
  const result = await importLeads(leads);
  console.log(`\n✅ Found: ${leads.length} | Added: ${result.added} | Skipped: ${result.skipped}\n`);
} catch (err) { console.error(`\n❌ ${err.message}`); process.exit(1); }
