// Probe Thunderbit API format
const TB_KEY = 'tb_8e5285b3de6a09b71acbcc78aec6c33f';

async function probe(label, url, body, method = 'POST') {
  console.log(`\n--- ${label} ---`);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${TB_KEY}`,
        'Content-Type': 'application/json',
        'X-API-Key': TB_KEY,
      },
      body: method === 'POST' ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text.slice(0, 500)}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

// Try common Thunderbit API endpoints
await probe('GET /v1', 'https://api.thunderbit.com/v1', null, 'GET');
await probe('Scrape endpoint', 'https://api.thunderbit.com/v1/scrape', {
  url: 'https://nitter.privacydev.net/search?q=need+video+editor&f=tweets',
  fields: [{ name: 'username', description: 'Twitter username' }, { name: 'tweet', description: 'Tweet text' }],
});
await probe('Extract endpoint', 'https://api.thunderbit.com/v1/extract', {
  url: 'https://example.com',
});
await probe('Thunderbit main domain', 'https://thunderbit.com/api/scrape', {
  url: 'https://example.com',
});
