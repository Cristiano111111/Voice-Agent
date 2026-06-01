import { exportToCSV, exportToJSON } from "../src/exporter.js";

const [,, format = "csv", status = null] = process.argv;
const filters = status ? { status } : {};

try {
  const r = format === "json" ? await exportToJSON(filters) : await exportToCSV(filters);
  console.log(`✅ Exported ${r.count} leads to: ${r.path}`);
} catch (err) { console.error(`❌ ${err.message}`); process.exit(1); }
