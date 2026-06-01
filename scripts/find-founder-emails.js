import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const companies = [
  { name: 'Red Barn Robotics', domain: 'redbarnrobotics.com', slug: 'red-barn-robotics' },
  { name: 'Mentra', domain: 'mentra.glass', slug: 'mentra' },
  { name: 'BlindPay', domain: 'blindpay.com', slug: 'blindpay' },
  { name: 'Vantel', domain: 'vantel.ai', slug: 'vantel' },
  { name: 'Fira', domain: 'firaresearch.com', slug: 'fira' },
  { name: 'assistant-ui', domain: 'assistant-ui.com', slug: 'assistant-ui' },
  { name: 'Artifact', domain: 'artifact.engineer', slug: 'artifact' },
  { name: 'Axal', domain: 'axal.ai', slug: 'axal' },
  { name: 'Dexterity', domain: 'getdexterity.com', slug: 'dexterity' },
  { name: 'Tally', domain: 'tallyhq.com', slug: 'tally' },
  { name: 'Sammy Labs', domain: 'sammylabs.com', slug: 'sammy-labs' },
  { name: 'Instinct', domain: 'instinct-space.com', slug: 'instinct' },
  { name: 'Mercura', domain: 'mercura.ai', slug: 'mercura' },
  { name: 'TamLabs', domain: 'tamlabs.ai', slug: 'tamlabs' },
  { name: 'CopyCat', domain: 'runcopycat.com', slug: 'copycat' },
  { name: 'Paratus Health', domain: 'paratushealth.com', slug: 'paratus-health' },
  { name: 'TensorPool', domain: 'tensorpool.dev', slug: 'tensorpool' },
  { name: 'Dalus', domain: 'dalus.io', slug: 'dalus' },
  { name: 'Rebolt', domain: 'rebolt.ai', slug: 'rebolt' },
  { name: 'Spott', domain: 'spott.io', slug: 'spott' },
  { name: 'Woz', domain: 'withwoz.com', slug: 'woz' },
  { name: 'Proception', domain: 'proception.ai', slug: 'proception' },
  { name: 'Demeter', domain: 'joindemeter.com', slug: 'demeter' },
  { name: 'Wildcard', domain: 'wild-card.ai', slug: 'wildcard' },
  { name: 'Permitify', domain: 'permitify.com', slug: 'permitify' },
  { name: 'Reditus Space', domain: 'reditus.space', slug: 'reditus-space' },
  { name: 'Pinch', domain: 'startpinch.com', slug: 'pinch' },
  { name: 'Retrofit', domain: 'retrofit.shop', slug: 'retrofit' },
  { name: 'Archon', domain: 'archon.inc', slug: 'archon' },
  { name: 'Mastra', domain: 'mastra.ai', slug: 'mastra' },
  { name: 'AfterQuery', domain: 'afterquery.com', slug: 'afterquery' },
  { name: 'Fuse AI', domain: 'fuse.ai', slug: 'fuse-ai' },
  { name: 'Miyagi Labs', domain: 'miyagilabs.ai', slug: 'miyagi-labs' },
  { name: 'TripleZip', domain: 'triplezip.ai', slug: 'triplezip' },
  { name: 'Peppr', domain: 'usepeppr.ai', slug: 'peppr' },
  { name: 'Sennu AI', domain: 'sennu.ai', slug: 'sennu-ai' },
  { name: 'Orbital Operations', domain: 'orbitalops.tech', slug: 'orbital-operations' },
  { name: 'Mesh', domain: 'usemesh.com', slug: 'mesh' },
  { name: 'Outlit', domain: 'outlit.ai', slug: 'outlit' },
  { name: 'Harper', domain: 'harperinsure.com', slug: 'harper' },
  { name: 'Calltree AI', domain: 'calltree.ai', slug: 'calltree-ai' },
  { name: 'Nitrode', domain: 'nitrode.com', slug: 'nitrode' },
  { name: 'Karsa', domain: 'gokarsa.com', slug: 'karsa' },
  { name: 'Exla', domain: 'exla.ai', slug: 'exla' },
  { name: 'Riviera', domain: 'withriviera.com', slug: 'riviera' },
  { name: 'Vovana', domain: 'vovana.com', slug: 'vovana' },
  { name: 'Agentin AI', domain: 'agentin.ai', slug: 'agentin-ai' },
  { name: 'ReJot', domain: 'rejot.dev', slug: 'rejot' },
  { name: 'General Trajectory', domain: 'generaltrajectory.com', slug: 'general-trajectory' },
  { name: 'SolidRoad', domain: 'solidroad.com', slug: 'solidroad' },
  { name: 'Trata', domain: 'trytrata.com', slug: 'trata' },
  { name: 'Sophris', domain: 'sophris.ai', slug: 'sophris' },
  { name: 'Lucidic AI', domain: 'lucidic.ai', slug: 'lucidic-ai' },
  { name: 'Mundo AI', domain: 'mundoai.world', slug: 'mundo-ai' },
  { name: 'AthenaHQ', domain: 'athenahq.ai', slug: 'athenahq' },
  { name: 'Lopus AI', domain: 'lopus.ai', slug: 'lopus-ai' },
  { name: 'Cenote', domain: 'joincenote.com', slug: 'cenote' },
  { name: 'Harbera', domain: 'harbera.com', slug: 'harbera' },
  { name: 'Augento', domain: 'augento.ai', slug: 'augento' },
  { name: 'Gale', domain: 'galevisa.com', slug: 'gale' },
  { name: 'Pave Robotics', domain: 'pave-robotics.com', slug: 'pave-robotics' },
  { name: 'Olive', domain: 'fromolive.com', slug: 'olive' },
  { name: 'HUD', domain: 'hud.so', slug: 'hud' },
  { name: 'Cuckoo Labs', domain: 'cuckoo.so', slug: 'cuckoo-labs' },
  { name: 'Mecha Health', domain: 'mecha-health.ai', slug: 'mecha-health' },
  { name: 'GradeWiz', domain: 'gradewiz.ai', slug: 'gradewiz' },
  { name: 'HealthKey', domain: 'gethealthkey.com', slug: 'healthkey' },
  { name: 'Mosaic', domain: 'mosaicco.com', slug: 'mosaic' },
  { name: 'ZeroEntropy', domain: 'zeroentropy.dev', slug: 'zeroentropy' },
  { name: 'Cardamon', domain: 'cardamon.ai', slug: 'cardamon' },
  { name: 'Amby Health', domain: 'tryamby.com', slug: 'amby-health' },
  { name: 'careCycle', domain: 'carecycle.ai', slug: 'carecycle' },
  { name: 'Sift Dev', domain: 'heysift.com', slug: 'sift-dev' },
  { name: 'Maive', domain: 'maive.ai', slug: 'maive' },
  { name: 'Caseflood', domain: 'caseflood.ai', slug: 'caseflood' },
  { name: 'Tejas AI', domain: 'trytejas.ai', slug: 'tejas-ai' },
  { name: 'Vora AI', domain: 'usevora.ai', slug: 'vora-ai' },
  { name: 'Maritime Fusion', domain: 'maritimefusion.com', slug: 'maritime-fusion' },
  { name: 'A1Base', domain: 'a1base.com', slug: 'a1base' },
  { name: 'Verbiflow', domain: 'verbiflow.com', slug: 'verbiflow' },
  { name: 'Toothy AI', domain: 'toothy.ai', slug: 'toothy-ai' },
  { name: 'Rocketable', domain: 'rocketable.com', slug: 'rocketable' },
  { name: 'Sublingual', domain: 'sublingual.ai', slug: 'sublingual' },
  { name: 'Contrario', domain: 'contrario.ai', slug: 'contrario' },
  { name: 'Ovlo', domain: 'ovlo.ai', slug: 'ovlo' },
  { name: 'Truffle AI', domain: 'trytruffle.ai', slug: 'truffle-ai' },
  { name: 'superglue', domain: 'superglue.ai', slug: 'superglue' },
  { name: 'Closure', domain: 'closure-intel.com', slug: 'closure' },
  { name: 'Promptless', domain: 'gopromptless.ai', slug: 'promptless' },
  { name: 'Scout', domain: 'scoutforschools.com', slug: 'scout' },
  { name: 'Subtrace', domain: 'subtrace.dev', slug: 'subtrace' },
  { name: 'Vocality Health', domain: 'vocalityhealth.com', slug: 'vocality-health' },
  { name: 'Astro', domain: 'astroenergy.ai', slug: 'astro' },
  { name: 'Dollyglot', domain: 'dollyglot.com', slug: 'dollyglot' },
  { name: 'Stamp', domain: 'stampmail.ai', slug: 'stamp' },
  { name: 'Guse', domain: 'guse.io', slug: 'guse' },
  { name: 'SubImage', domain: 'subimage.io', slug: 'subimage' },
  { name: 'NextByte', domain: 'nextbyte.ai', slug: 'nextbyte' },
  { name: 'Leaping AI', domain: 'leapingai.com', slug: 'leaping-ai' },
  { name: 'Bild AI', domain: 'bild.ai', slug: 'bild-ai' },
];

function decodeHtmlEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractFounders(html) {
  // Strategy 1: __NEXT_DATA__ JSON (unencoded)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]);
      const str = JSON.stringify(data);
      const founderMatch = str.match(/"founders":\s*(\[[\s\S]*?\])/);
      if (founderMatch) {
        const founders = JSON.parse(founderMatch[1]);
        if (Array.isArray(founders) && founders.length > 0) {
          return founders.map(f => f.first_name || f.name?.split(' ')[0]).filter(Boolean);
        }
      }
    } catch {}
  }

  // Strategy 2: Inertia.js / inline HTML-encoded data (full_name or first_name)
  // Match founders array in entity-encoded HTML body
  const encodedFoundersMatch = html.match(/&quot;founders&quot;:\[([\s\S]*?)(?:&quot;company&quot;|&quot;batch&quot;|<\/)/);
  if (encodedFoundersMatch) {
    try {
      const decoded = decodeHtmlEntities('{"founders":[' + encodedFoundersMatch[1]);
      // Extract full_name or first_name values
      const fullNames = [...decoded.matchAll(/"full_name"\s*:\s*"([^"]+)"/g)].map(m => m[1]);
      if (fullNames.length > 0) return [fullNames[0].split(' ')[0]];
      const firstNames = [...decoded.matchAll(/"first_name"\s*:\s*"([^"]+)"/g)].map(m => m[1]);
      if (firstNames.length > 0) return [firstNames[0]];
    } catch {}
  }

  // Strategy 3: direct full_name regex anywhere in HTML (encoded)
  const allFullNames = [...html.matchAll(/&quot;full_name&quot;:&quot;([^&]+?)&quot;/g)].map(m => m[1]);
  if (allFullNames.length > 0) return [allFullNames[0].split(' ')[0]];

  return [];
}

async function fetchFounders(company) {
  const url = `https://www.ycombinator.com/companies/${company.slug}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!res.ok) {
      console.log(`  404/error for ${company.name} (slug: ${company.slug})`);
      return null;
    }

    const html = await res.text();
    const founders = extractFounders(html);

    if (founders.length > 0) {
      return founders[0].toLowerCase();
    }

    console.log(`  No founders parsed for ${company.name}`);
    return null;
  } catch (err) {
    console.log(`  Fetch failed for ${company.name}: ${err.message}`);
    return null;
  }
}

async function run() {
  const results = [];

  for (const company of companies) {
    process.stdout.write(`${company.name}... `);
    const firstName = await fetchFounders(company);

    const email = firstName
      ? `${firstName}@${company.domain}`
      : `founders@${company.domain}`;

    const status = firstName ? `✓ ${email}` : `? founders@${company.domain}`;
    console.log(status);

    results.push({
      name: company.name,
      domain: company.domain,
      slug: company.slug,
      founderFirstName: firstName,
      email,
    });

    // Polite delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }

  const outPath = path.join(__dirname, '..', 'memory', 'founder-emails.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved to memory/founder-emails.json`);

  const found = results.filter(r => r.founderFirstName).length;
  console.log(`Found real founder names: ${found}/${results.length}`);
}

run();
