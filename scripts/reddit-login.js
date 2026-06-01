// Logs into Reddit using your existing Chrome session (no credentials needed)
// Or falls back to fresh login with username/password
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
puppeteer.use(StealthPlugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, '..', '.env');

const CHROME_PROFILES = [
  { dir: 'C:\\Users\\sanja\\AppData\\Local\\Google\\Chrome\\User Data', exe: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
  { dir: 'C:\\Users\\sanja\\AppData\\Local\\Microsoft\\Edge\\User Data', exe: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
];
const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function tryWithProfile(userDataDir, executablePath, profileDir) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath,
    userDataDir,
    args: [
      `--profile-directory=${profileDir}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
  return browser;
}

async function getTokenFromBrowser(browser) {
  const page = await browser.newPage();
  await page.goto('https://www.reddit.com', { waitUntil: 'networkidle2', timeout: 30000 });
  const cookies = await page.cookies('https://www.reddit.com');
  return cookies.find(c => c.name === 'token_v2')?.value;
}

async function verifyToken(token) {
  const res = await fetch('https://oauth.reddit.com/api/v1/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'OutreachBot/1.0 by ElectricalPirate9073',
    },
  });
  const me = await res.json();
  return me.name || null;
}

async function focusShadowInput(page, inputName) {
  const box = await page.evaluate((inputName) => {
    const hosts = [...document.querySelectorAll('faceplate-text-input')];
    const host = hosts.find(h => h.shadowRoot?.querySelector(`input[name="${inputName}"]`));
    if (!host) return null;
    const inp = host.shadowRoot.querySelector(`input[name="${inputName}"]`);
    inp.focus();
    const rect = inp.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, inputName);
  if (!box) throw new Error(`Shadow input "${inputName}" not found`);
  await page.mouse.click(box.x, box.y);
  return box;
}

async function loginFresh(page) {
  console.log('Logging in fresh...');
  await page.goto('https://www.reddit.com/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Click and type into username field (real keystrokes trigger framework validation)
  console.log('Typing username...');
  await focusShadowInput(page, 'username');
  await page.keyboard.type('ElectricalPirate9073', { delay: 60 });
  await new Promise(r => setTimeout(r, 400));

  console.log('Typing password...');
  await focusShadowInput(page, 'password');
  await page.keyboard.type('Sanjay0911', { delay: 60 });
  await new Promise(r => setTimeout(r, 600));

  // Click Log In button
  console.log('Clicking Log In...');
  const clicked = await page.evaluate(() => {
    // Find the login button (not greyed out)
    const allBtns = [...document.querySelectorAll('button, faceplate-button')];
    const loginBtn = allBtns.find(b => /^log.?in$/i.test(b.textContent.trim()));
    if (loginBtn) { loginBtn.click(); return loginBtn.textContent.trim(); }
    // Try submit
    const form = document.querySelector('form');
    if (form) { form.requestSubmit(); return 'form submit'; }
    return null;
  });
  console.log('Button clicked:', clicked);

  try {
    await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 20000 });
    console.log('Login successful, URL:', page.url());
  } catch {
    await page.screenshot({ path: 'reddit-login-fail.png' });
    console.log('Login may have failed — screenshot saved.');
  }

  await new Promise(r => setTimeout(r, 3000));
  const cookies = await page.cookies('https://www.reddit.com');
  return cookies.find(c => c.name === 'token_v2')?.value;
}

async function run() {
  for (const { dir: userDataDir, exe } of CHROME_PROFILES) {
    for (const profile of ['Default', 'Profile 1', 'Profile 5', 'Profile 6']) {
      try {
        const browserName = userDataDir.includes('Edge') ? 'Edge' : 'Chrome';
        console.log(`Trying ${browserName} profile: ${profile}...`);
        const browser = await tryWithProfile(userDataDir, exe, profile);
        try {
          const token = await getTokenFromBrowser(browser);
          if (token) {
            const name = await verifyToken(token);
            if (name === 'ElectricalPirate9073') {
              console.log(`Found valid Reddit session in ${profile}!`);
              let env = fs.readFileSync(ENV_PATH, 'utf-8');
              env = env.includes('REDDIT_TOKEN=')
                ? env.replace(/REDDIT_TOKEN=.*/, `REDDIT_TOKEN=${token}`)
                : env + `\nREDDIT_TOKEN=${token}`;
              fs.writeFileSync(ENV_PATH, env);
              console.log('.env updated with fresh token');
              return;
            }
            console.log(`${profile}: logged in as ${name || 'unknown'} — not ElectricalPirate9073`);
          } else {
            console.log(`${profile}: not logged into Reddit`);
          }
        } finally {
          await browser.close();
        }
      } catch (err) {
        if (err.message.includes('user data directory is already in use')) {
          console.log(`${profile}: Chrome is using this profile — skipping`);
        } else {
          console.log(`${profile}: ${err.message.slice(0, 80)}`);
        }
      }
    }
  }

  // Fallback: fresh login in temp profile
  console.log('\nNo existing session found — doing fresh login...');
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CHROME_EXE,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    const token = await loginFresh(page);
    if (!token) { console.log('Could not get token after login.'); return; }
    const name = await verifyToken(token);
    if (!name) { console.log('Token not authenticated.'); return; }
    console.log(`Logged in as: ${name}`);
    let env = fs.readFileSync(ENV_PATH, 'utf-8');
    env = env.includes('REDDIT_TOKEN=')
      ? env.replace(/REDDIT_TOKEN=.*/, `REDDIT_TOKEN=${token}`)
      : env + `\nREDDIT_TOKEN=${token}`;
    fs.writeFileSync(ENV_PATH, env);
    console.log('.env updated');
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
