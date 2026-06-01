import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export async function scrapeAdLibrary(searchQuery, country = 'ALL', limit = 20) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );

  const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&q=${encodeURIComponent(searchQuery)}&search_type=keyword_unordered`;

  console.log(`[scraper] Loading: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await delay(3000);

  // Handle cookie consent if it shows up
  try {
    const cookieBtn = await page.$('[data-testid="cookie-policy-manage-dialog-accept-button"]');
    if (cookieBtn) {
      await cookieBtn.click();
      await delay(1000);
    }
  } catch (_) {}

  // Scroll to load more ads
  let lastHeight = 0;
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 1200));
    await delay(1500);
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === lastHeight) break;
    lastHeight = newHeight;
  }

  const ads = await page.evaluate((maxAds) => {
    const results = [];

    // Facebook Ad Library renders cards — we look for the ad card containers
    const cards = document.querySelectorAll('[class*="x1dr75xp"]');

    for (const card of cards) {
      if (results.length >= maxAds) break;

      try {
        // Page name / advertiser
        const pageNameEl = card.querySelector('a[href*="facebook.com"]') ||
                           card.querySelector('strong') ||
                           card.querySelector('h3');
        const pageName = pageNameEl?.innerText?.trim() || 'Unknown';

        // Ad body text
        const bodyEls = card.querySelectorAll('div[dir="auto"]');
        const bodyText = Array.from(bodyEls)
          .map(el => el.innerText?.trim())
          .filter(t => t && t.length > 10)
          .slice(0, 3)
          .join(' | ');

        // Started running date
        const allText = card.innerText || '';
        const dateMatch = allText.match(/Started running on (.+?)[\n\r]/i) ||
                          allText.match(/Active since (.+?)[\n\r]/i) ||
                          allText.match(/(\w+ \d+, \d{4})/);
        const startDate = dateMatch ? dateMatch[1].trim() : null;

        // Platforms
        const platforms = [];
        if (allText.toLowerCase().includes('facebook')) platforms.push('Facebook');
        if (allText.toLowerCase().includes('instagram')) platforms.push('Instagram');
        if (allText.toLowerCase().includes('audience network')) platforms.push('Audience Network');
        if (allText.toLowerCase().includes('messenger')) platforms.push('Messenger');

        // Image
        const img = card.querySelector('img[src*="scontent"]') ||
                    card.querySelector('img[src*="fbcdn"]');
        const imgSrc = img?.src || null;

        // Ad ID / link
        const adLink = card.querySelector('a[href*="/ads/library/?id="]');
        const adId = adLink?.href?.match(/id=(\d+)/)?.[1] || null;

        if (pageName !== 'Unknown' || bodyText) {
          results.push({ pageName, bodyText, startDate, platforms, imgSrc, adId });
        }
      } catch (_) {}
    }

    // Fallback: try alternate selectors if no results
    if (results.length === 0) {
      const altCards = document.querySelectorAll('[data-testid*="ad"], [class*="adCard"], [class*="ad-card"]');
      for (const card of altCards) {
        if (results.length >= maxAds) break;
        results.push({
          pageName: 'Ad',
          bodyText: card.innerText?.slice(0, 200).trim(),
          startDate: null,
          platforms: [],
          imgSrc: null,
          adId: null,
        });
      }
    }

    return results;
  }, limit);

  // Calculate run duration for each ad
  const now = new Date();
  const enriched = ads.map(ad => {
    let runDays = null;
    let runLabel = 'Unknown';
    let signal = 'gray';

    if (ad.startDate) {
      const parsed = new Date(ad.startDate);
      if (!isNaN(parsed)) {
        runDays = Math.floor((now - parsed) / (1000 * 60 * 60 * 24));
        runLabel = runDays === 0 ? 'Today' : runDays === 1 ? '1 day' : `${runDays} days`;
        if (runDays >= 60) signal = 'green';
        else if (runDays >= 14) signal = 'yellow';
        else signal = 'red';
      }
    }

    return { ...ad, runDays, runLabel, signal };
  });

  await browser.close();
  return enriched;
}
