// Try different Thunderbit auth formats and endpoints
const TB_KEY = 'tb_8e5285b3de6a09b71acbcc78aec6c33f';

async function probe(label, url, headers, body, method = 'POST') {
  console.log(`\n--- ${label} ---`);
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text.slice(0, 300)}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

const url = 'https://nitter.privacydev.net/search?q=need+video+editor&f=tweets';

// Try app subdomain
await probe('app.thunderbit.com /api/scrape', 'https://app.thunderbit.com/api/scrape',
  { 'Authorization': `Bearer ${TB_KEY}` }, { url }, 'POST');

// Try with key in body
await probe('key in body', 'https://api.thunderbit.com/v1/scrape',
  {}, { url, api_key: TB_KEY, apiKey: TB_KEY }, 'POST');

// Try different auth header formats
await probe('X-Api-Key header', 'https://api.thunderbit.com/v1/scrape',
  { 'X-Api-Key': TB_KEY }, { url }, 'POST');

await probe('api-key header', 'https://api.thunderbit.com/v1/scrape',
  { 'api-key': TB_KEY }, { url }, 'POST');

// Try the scrape with just the raw key (no Bearer)
await probe('raw key auth', 'https://api.thunderbit.com/v1/scrape',
  { 'Authorization': TB_KEY }, { url }, 'POST');

// Check if there's a v2
await probe('v2 endpoint', 'https://api.thunderbit.com/v2/scrape',
  { 'Authorization': `Bearer ${TB_KEY}` }, { url }, 'POST');
