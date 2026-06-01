const TB_KEY = 'tb_8e5285b3de6a09b71acbcc78aec6c33f';

async function probe(label, url, method = 'GET', body = null) {
  console.log(`\n--- ${label} ---`);
  console.log(`${method} ${url}`);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TB_KEY}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text.slice(0, 400)}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

const targetUrl = 'https://example.com';
const encoded = encodeURIComponent(targetUrl);

// App subdomain with GET
await probe('app GET /api/scrape', `https://app.thunderbit.com/api/scrape?url=${encoded}`, 'GET');
await probe('app GET /api/extract', `https://app.thunderbit.com/api/extract?url=${encoded}`, 'GET');
await probe('app POST /api/extract', 'https://app.thunderbit.com/api/extract', 'POST', { url: targetUrl });
await probe('app GET /api/v1/scrape', `https://app.thunderbit.com/api/v1/scrape?url=${encoded}`, 'GET');
await probe('app POST /api/v1/scrape', 'https://app.thunderbit.com/api/v1/scrape', 'POST', { url: targetUrl });

// Try without auth to see what error format looks like
await probe('no auth test', 'https://api.thunderbit.com/v1/scrape', 'POST', { url: targetUrl });
