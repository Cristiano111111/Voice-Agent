import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const businessBrain = (() => {
  try {
    return readFileSync(join(__dirname, 'business-brain.txt'), 'utf-8');
  } catch {
    return 'BUSINESS NAME: Your Business\nTYPE: Service business';
  }
})();

export const businessName = (() => {
  const match = businessBrain.match(/^BUSINESS NAME:\s*(.+)$/m);
  return match ? match[1].trim() : 'Our Business';
})();

export const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';
