import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3030;

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`\n  MetaSim running at http://localhost:${PORT}\n`);
});
