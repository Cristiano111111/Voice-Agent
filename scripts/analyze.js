import { analyzeLeds, getInsightReport } from "../src/analyzer.js";

console.log("📊 Running analysis...\n");

try {
  const result = await analyzeLeds();
  if (result.message) { console.log(result.message); }
  else { console.log(await getInsightReport()); console.log(`\nAnalyzed ${result.analyzed} leads.`); }
} catch (err) { console.error(`❌ ${err.message}`); process.exit(1); }
