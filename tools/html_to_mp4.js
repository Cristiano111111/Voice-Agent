import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function htmlToMp4(htmlPath, outputPath, fps = 60, durationSec = 10) {
  const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jayrx-frames-'));
  const totalFrames = fps * durationSec;
  const frameMs = 1000 / fps;

  console.log(`Rendering ${totalFrames} frames at ${fps}fps`);
  console.log(`Frames temp dir: ${framesDir}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
  console.log(`Loading: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Pause all CSS animations so we can step through time manually
  await page.evaluate(() => {
    document.getAnimations().forEach(a => {
      a.pause();
      a.currentTime = 0;
    });
  });

  for (let i = 0; i < totalFrames; i++) {
    const timeMs = i * frameMs;

    await page.evaluate((t) => {
      document.getAnimations().forEach(a => {
        a.currentTime = t;
      });
    }, timeMs);

    const framePath = path.join(framesDir, `frame${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: framePath });

    if (i % 60 === 0) {
      process.stdout.write(`  Frame ${i}/${totalFrames} (${(timeMs / 1000).toFixed(2)}s)\n`);
    }
  }

  await browser.close();
  console.log('All frames captured. Running ffmpeg...');

  const ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${path.join(framesDir, 'frame%04d.png')}" -c:v libx264 -pix_fmt yuv420p -crf 18 "${outputPath}"`;
  console.log(ffmpegCmd);
  execSync(ffmpegCmd, { stdio: 'inherit' });

  fs.rmSync(framesDir, { recursive: true, force: true });
  console.log(`\nDone! MP4 saved to: ${outputPath}`);
}

const htmlPath = process.argv[2] || 'C:\\Users\\sanja\\Downloads\\jayrx-ad-standalone.html';
const outputPath = process.argv[3] || 'C:\\Users\\sanja\\Downloads\\jayrx-ad.mp4';

htmlToMp4(htmlPath, outputPath).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
