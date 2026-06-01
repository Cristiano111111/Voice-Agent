import express from 'express';
import { scrapeAdLibrary } from './ad-library-scraper.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3333;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'ad-library-ui')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ad-library-ui', 'index.html'));
});

app.post('/api/search', async (req, res) => {
  const { query, country = 'ALL', limit = 20 } = req.body;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  console.log(`[server] Search: "${query}" | country=${country} | limit=${limit}`);

  try {
    const ads = await scrapeAdLibrary(query.trim(), country, limit);
    res.json({ query, ads, count: ads.length, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[server] Scrape error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  Ad Library Dashboard running at http://localhost:${PORT}\n`);
});
