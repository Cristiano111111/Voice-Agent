import inquirer  from "inquirer";
import chalk     from "chalk";
import { getStatus, getPreferences, updatePreferences } from "./memory.js";
import { findBusinesses } from "./scraper.js";
import { importLeads, queryLeads, getLeadStats, formatLeadTable, cleanLeads } from "./leads.js";
import { analyzeLeds, getInsightReport } from "./analyzer.js";
import { exportToCSV, exportToJSON }     from "./exporter.js";

async function boot() {
  console.clear();
  console.log(chalk.bold.cyan(`
   ██╗ █████╗ ██╗   ██╗
   ██║██╔══██╗╚██╗ ██╔╝
   ██║███████║ ╚████╔╝
██ ██║██╔══██║  ╚██╔╝
╚████╔╝██║  ██║   ██║
 ╚═══╝ ╚═╝  ╚═╝   ╚═╝`) + chalk.gray("  Business Intelligence Assistant v1.0\n"));

  const status = await getStatus();
  const prefs  = await getPreferences();

  console.log(chalk.cyan("👋 Hey! I'm Jay, your business intelligence assistant."));

  if (status.totalLeads === 0) {
    console.log(chalk.yellow("  Just getting started. Let me learn your preferences first.\n"));
    await setupPreferences();
  } else {
    console.log(chalk.white(`  You have ${chalk.bold(status.totalLeads)} leads (${chalk.green(status.newLeads + " new")}).`));
    if (status.lastSearch) {
      const d = new Date(status.lastSearch.timestamp).toLocaleDateString();
      console.log(chalk.white(`  Last search: "${status.lastSearch.businessType}" in "${status.lastSearch.location}" on ${d}.`));
    }
  }

  console.log("");
  await mainMenu();
}

async function mainMenu() {
  const { action } = await inquirer.prompt([{
    type: "list", name: "action",
    message: chalk.bold("What would you like to do?"),
    choices: [
      { name: "🔍  Find new businesses", value: "find" },
      { name: "📋  View leads",          value: "view" },
      { name: "📤  Export leads",        value: "export" },
      { name: "📊  Analyze & insights",  value: "analyze" },
      { name: "🧹  Clean leads",         value: "clean" },
      { name: "⚙️   Preferences",        value: "prefs" },
      { name: "📈  Status",              value: "status" },
      new inquirer.Separator(),
      { name: "🚪  Exit",                value: "exit" },
    ],
  }]);

  if (action === "find")    await findFlow();
  if (action === "view")    await viewFlow();
  if (action === "export")  await exportFlow();
  if (action === "analyze") await analyzeFlow();
  if (action === "clean")   await cleanFlow();
  if (action === "prefs")   await setupPreferences();
  if (action === "status")  await showStatus();
  if (action === "exit") { console.log(chalk.cyan("\n👋 Jay out.\n")); process.exit(0); }

  console.log("");
  await mainMenu();
}

async function findFlow() {
  const prefs = await getPreferences();
  const answers = await inquirer.prompt([
    { type:"input", name:"businessType", message:"Business type to search for?", default: prefs.targetIndustries[0] || "", validate: v => v.trim().length > 0 || "Required" },
    { type:"input", name:"location",     message:"Location? (city, state or zip)", default: prefs.targetRegions[0] || "Rockville MD", validate: v => v.trim().length > 0 || "Required" },
    { type:"checkbox", name:"sources",   message:"Sources to search?",
      choices: [{ name:"Yelp", value:"yelp", checked:true }, { name:"Yellow Pages", value:"yellowpages", checked:true }, { name:"Manta", value:"manta" }] },
    { type:"number", name:"maxResults",  message:"Max results per source?", default: 30 },
  ]);

  console.log(chalk.cyan("\n⏳ Searching...\n"));
  try {
    const raw    = await findBusinesses(answers.businessType, answers.location, { sources: answers.sources, maxResults: answers.maxResults });
    const result = await importLeads(raw);
    console.log(chalk.green(`\n✅ Added ${chalk.bold(result.added)} new leads. (${result.skipped} duplicates skipped)`));
  } catch (err) { console.log(chalk.red(`\n❌ ${err.message}`)); }
}

async function viewFlow() {
  const { f } = await inquirer.prompt([{ type:"list", name:"f", message:"Show which leads?",
    choices: [{ name:"All", value:"all" }, { name:"New only", value:"new" }, { name:"Contacted", value:"contacted" }, { name:"Needs review", value:"needs_review" }, { name:"Search by name", value:"search" }] }]);

  let filters = {};
  if (f !== "all" && f !== "search") filters.status = f;
  if (f === "search") {
    const { q } = await inquirer.prompt([{ type:"input", name:"q", message:"Search term:" }]);
    filters.search = q;
  }

  const leads = await queryLeads(filters);
  if (!leads.length) { console.log(chalk.yellow("\n  No leads match.")); return; }
  console.log(chalk.bold(`\n  ${leads.length} leads:\n`));
  console.log(formatLeadTable(leads));
  if (leads.length > 20) console.log(chalk.gray(`  ... and ${leads.length - 20} more`));
}

async function exportFlow() {
  const { format } = await inquirer.prompt([{ type:"list", name:"format", message:"Format?", choices:[{ name:"CSV", value:"csv" }, { name:"JSON", value:"json" }] }]);
  const { sf }     = await inquirer.prompt([{ type:"list", name:"sf", message:"Which leads?", choices:[{ name:"All", value:null }, { name:"New only", value:"new" }, { name:"Contacted", value:"contacted" }] }]);
  const filters    = sf ? { status: sf } : {};
  try {
    const r = format === "json" ? await exportToJSON(filters) : await exportToCSV(filters);
    console.log(chalk.green(`\n✅ Exported ${r.count} leads to:\n   ${r.path}`));
  } catch (err) { console.log(chalk.red(`\n❌ ${err.message}`)); }
}

async function analyzeFlow() {
  console.log(chalk.cyan("\n⏳ Analyzing...\n"));
  const result = await analyzeLeds();
  if (result.message) { console.log(chalk.yellow(`\n  ${result.message}`)); return; }
  console.log(await getInsightReport());
  console.log(chalk.gray(`\n  Analyzed ${result.analyzed} leads. Found ${result.insights.length} insights.`));
}

async function cleanFlow() {
  const { ok } = await inquirer.prompt([{ type:"confirm", name:"ok", message:"Remove duplicates and flag incomplete leads?", default:true }]);
  if (!ok) return;
  const r = await cleanLeads();
  console.log(chalk.green(`\n✅ Removed ${r.duplicatesRemoved} duplicates, flagged ${r.flagged} for review.`));
}

async function showStatus() {
  const status = await getStatus();
  const stats  = await getLeadStats();
  console.log(chalk.bold("\n📈 JAY STATUS\n") + "─".repeat(30));
  console.log(`  Total leads:    ${chalk.bold(status.totalLeads)}`);
  console.log(`  New:            ${chalk.green(status.newLeads)}`);
  console.log(`  Contacted:      ${chalk.blue(status.contactedLeads)}`);
  console.log(`  Converted:      ${chalk.yellow(stats.byStatus["converted"] || 0)}`);
  console.log(`  Total searches: ${status.totalSearches}`);
  console.log(`  Last updated:   ${status.lastUpdated ? new Date(status.lastUpdated).toLocaleString() : "never"}`);
}

async function setupPreferences() {
  const prefs = await getPreferences();
  const a = await inquirer.prompt([
    { type:"input", name:"serviceTypes",     message:"Your services? (comma-separated)",         default: prefs.serviceTypes.join(", ") },
    { type:"input", name:"targetIndustries", message:"Industries you target? (comma-separated)", default: prefs.targetIndustries.join(", ") },
    { type:"input", name:"targetRegions",    message:"Target regions/cities? (comma-separated)", default: prefs.targetRegions.join(", ") },
  ]);
  const split = s => s.split(",").map(x=>x.trim()).filter(Boolean);
  await updatePreferences({ serviceTypes: split(a.serviceTypes), targetIndustries: split(a.targetIndustries), targetRegions: split(a.targetRegions) });
  console.log(chalk.green("\n✅ Preferences saved!"));
}

boot().catch(err => { console.error(chalk.red("Fatal:"), err); process.exit(1); });
