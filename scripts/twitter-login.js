import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

puppeteer.use(StealthPlugin());
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36');

console.log('Navigating to Twitter login...');
await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));

// Wait a bit longer for the page to render
await new Promise(r => setTimeout(r, 3000));
await page.screenshot({ path: 'twitter-debug.png' });
console.log('URL:', page.url());

// Try multiple selectors for the username field
const usernameSelectors = [
  'input[autocomplete="username"]',
  'input[name="text"]',
  'input[type="text"]',
  'input[data-testid="LoginForm_LoginWithSsoButton"]',
];
let usernameField = null;
for (const sel of usernameSelectors) {
  usernameField = await page.$(sel);
  if (usernameField) { console.log('Found input with selector:', sel); break; }
}
if (!usernameField) {
  const allInputs = await page.evaluate(() => [...document.querySelectorAll('input')].map(i => ({ type: i.type, name: i.name, autocomplete: i.autocomplete, placeholder: i.placeholder })));
  console.log('All inputs:', JSON.stringify(allInputs));
  await browser.close(); process.exit(1);
}
await usernameField.type('jayrx16@gmail.com', { delay: 60 });
await page.keyboard.press('Enter');
await new Promise(r => setTimeout(r, 2500));

// Sometimes Twitter asks for username confirmation
const confirmInput = await page.$('input[data-testid="ocfEnterTextTextInput"]');
if (confirmInput) {
  console.log('Username confirmation prompt — entering username...');
  await confirmInput.type('jayrx16', { delay: 60 });
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 2000));
}

await page.waitForSelector('input[name="password"]', { timeout: 10000 });
await page.type('input[name="password"]', 'Sanjay0911', { delay: 60 });
await page.keyboard.press('Enter');
await new Promise(r => setTimeout(r, 5000));

console.log('After login URL:', page.url());

const cookies = await page.cookies();
const auth = cookies.find(c => c.name === 'auth_token');
const ct0 = cookies.find(c => c.name === 'ct0');

if (auth && ct0) {
  const cookieFile = path.join(__dirname, '..', 'twitter-cookies.json');
  fs.writeFileSync(cookieFile, JSON.stringify({ auth_token: auth.value, ct0: ct0.value }));
  console.log('Twitter cookies saved!');
  console.log('auth_token:', auth.value.slice(0, 20) + '...');
} else {
  console.log('Login may have failed. Cookies found:', cookies.map(c => c.name).join(', '));
  await page.screenshot({ path: path.join(__dirname, '..', 'twitter-login-fail.png') });
}

await browser.close();
