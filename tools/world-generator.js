import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://api.worldlabs.ai/marble/v1';
const API_KEY = process.env.WORLDLABS_API_KEY;

const ROOM_LABELS = {
  'kitchen': 'Main Kitchen',
  'dining': 'Dining Room',
  'formal-dining': 'Formal Dining Room',
  'hallway': 'Hallway to Sitting Room',
};

const headers = {
  'WLT-Api-Key': API_KEY,
  'Content-Type': 'application/json',
};

async function prepareUpload(fileName, ext) {
  const res = await axios.post(`${BASE_URL}/media-assets:prepare_upload`, {
    file_name: fileName,
    kind: 'image',
    extension: ext.replace('.', ''),
  }, { headers });
  return res.data;
}

async function uploadFile(uploadUrl, filePath, requiredHeaders = {}) {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  await axios.put(uploadUrl, fileBuffer, {
    headers: { 'Content-Type': mimeMap[ext] || 'image/jpeg', ...requiredHeaders },
    maxBodyLength: Infinity,
  });
}

async function generateWorld(mediaAssetId, displayName, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.post(`${BASE_URL}/worlds:generate`, {
        display_name: displayName.slice(0, 64),
        model: 'marble-1.1',
        world_prompt: {
          type: 'image',
          image_prompt: {
            source: 'media_asset',
            media_asset_id: mediaAssetId,
          },
        },
      }, { headers });
      return res.data;
    } catch (err) {
      if (err.response?.status === 429) {
        const wait = attempt * 30_000;
        console.log(`\n  Rate limited. Waiting ${wait / 1000}s before retry ${attempt}/${retries}...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        const detail = JSON.stringify(err.response?.data || err.message);
        throw new Error(`${err.response?.status || 'Error'}: ${detail}`);
      }
    }
  }
  throw new Error('Rate limit: exceeded retries. Check your credits at platform.worldlabs.ai');
}

async function pollOperation(operationId) {
  const maxWait = 20 * 60 * 1000; // 20 min
  const interval = 10_000;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const res = await axios.get(`${BASE_URL}/operations/${operationId}`, { headers });
    const op = res.data;
    if (op.done) return op;
    const status = op.metadata?.progress?.status || 'processing';
    process.stdout.write(`\r  Status: ${status}...`);
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error('Timed out waiting for world generation');
}

async function getWorld(worldId) {
  const res = await axios.get(`${BASE_URL}/worlds/${worldId}`, { headers });
  return res.data;
}

async function processImage(imagePath, label) {
  const fileName = path.basename(imagePath);
  const ext = path.extname(imagePath).toLowerCase();

  console.log(`\n[${label}] Preparing upload...`);
  const { media_asset, upload_info } = await prepareUpload(fileName, ext);

  console.log(`[${label}] Uploading image...`);
  await uploadFile(upload_info.upload_url, imagePath, upload_info.required_headers || {});

  const assetId = media_asset.id || media_asset.media_asset_id;
  console.log(`[${label}] Asset ID: ${assetId}`);
  console.log(`[${label}] Generating 3D world...`);
  const { operation_id } = await generateWorld(assetId, label);

  console.log(`[${label}] Processing (this takes ~5-10 min)`);
  const completed = await pollOperation(operation_id);

  const worldId = completed.response?.id;
  if (!worldId) throw new Error('No world ID in operation response');

  const world = await getWorld(worldId);
  return { label, worldId, url: `https://marble.worldlabs.ai/world/${worldId}`, world };
}

async function main() {
  if (!API_KEY) {
    console.error('Missing WORLDLABS_API_KEY in .env');
    process.exit(1);
  }

  const imagesDir = path.join(__dirname, '..', 'images', 'kitchen');
  const supported = ['.jpg', '.jpeg', '.png', '.webp'];

  const files = fs.readdirSync(imagesDir)
    .filter(f => supported.includes(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.log('No images found in images/kitchen/');
    console.log('Add your kitchen photos there and run again.');
    process.exit(0);
  }

  console.log(`Found ${files.length} image(s) to process:\n`);
  files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(imagesDir, files[i]);
    const baseName = path.basename(files[i], path.extname(files[i]));
    const label = ROOM_LABELS[baseName] || `Room ${i + 1} - ${baseName}`;

    try {
      const result = await processImage(filePath, label);
      results.push(result);
      console.log(`\n[${label}] Done!`);
      console.log(`  URL: ${result.url}`);
    } catch (err) {
      console.error(`\n[${label}] Failed: ${err.message}`);
    }

    // Brief pause between generations to avoid rate limiting
    if (i < files.length - 1) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('\n\n=== ALL WORLDS GENERATED ===\n');
  results.forEach(r => {
    console.log(`${r.label}`);
    console.log(`  ${r.url}\n`);
  });

  // Save results
  const outputPath = path.join(__dirname, '..', 'images', 'kitchen', 'worlds.json');
  fs.writeFileSync(outputPath, JSON.stringify(results.map(r => ({
    label: r.label,
    worldId: r.worldId,
    url: r.url,
    generatedAt: new Date().toISOString(),
  })), null, 2));
  console.log(`Results saved to images/kitchen/worlds.json`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
