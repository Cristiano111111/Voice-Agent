const TB_KEY = 'tb_8e5285b3de6a09b71acbcc78aec6c33f';
const res = await fetch('https://openapi.thunderbit.com/openapi/v1/distill', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TB_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' }),
  signal: AbortSignal.timeout(20000),
});
const json = await res.json();
console.log('Status:', res.status);
console.log('Response:', JSON.stringify(json).slice(0, 300));
