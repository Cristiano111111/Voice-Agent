// Test Thunderbit with Google site:x.com search
const TB_KEY = 'tb_8e5285b3de6a09b71acbcc78aec6c33f';

async function distill(url) {
  const res = await fetch('https://openapi.thunderbit.com/openapi/v1/distill', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TB_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(30000),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'failed');
  return json.data?.markdown || '';
}

// Test Google site:x.com search
const q = encodeURIComponent('site:x.com "need video editor" -"for hire" -"available"');
const url = `https://www.google.com/search?q=${q}&tbs=qdr:w&num=20`;
console.log('Testing:', url);
const md = await distill(url);
console.log('Length:', md.length);
console.log('\n--- First 3000 chars ---\n');
console.log(md.slice(0, 3000));
