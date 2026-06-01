// Quick test to see what ScrapingBee returns for Twitter/nitter
const SB_KEY = 'tb_8e5285b3de6a09b71acbcc78aec6c33f';

async function test(label, url) {
  console.log(`\nTesting: ${label}`);
  console.log(`URL: ${url}`);
  const apiUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SB_KEY}&url=${encodeURIComponent(url)}&render_js=true&wait=4000&premium_proxy=true&country_code=us`;
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(35000) });
    console.log(`Status: ${res.status}`);
    const html = await res.text();
    console.log(`Length: ${html.length} chars`);
    // Fingerprint what we got
    const hasLogin = /login|sign in|sign up|log in/i.test(html);
    const hasNitter = html.includes('timeline-item') || html.includes('tweet-content');
    const hasXTweet = html.includes('tweetText') || html.includes('data-testid="tweet"');
    const hasError = /error|instance|blocked/i.test(html.slice(0, 500));
    console.log(`Has login wall: ${hasLogin}`);
    console.log(`Has nitter tweets: ${hasNitter}`);
    console.log(`Has X tweets: ${hasXTweet}`);
    console.log(`Has error: ${hasError}`);
    // Show a snippet
    const snippet = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400);
    console.log(`Snippet: ${snippet}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

// Test nitter and X directly
await test('nitter.privacydev.net', 'https://nitter.privacydev.net/search?q=need+video+editor&f=tweets');
await test('xcancel.com', 'https://xcancel.com/search?q=need+video+editor&f=tweets');
await test('X.com direct', 'https://x.com/search?q=need+video+editor&f=live');
