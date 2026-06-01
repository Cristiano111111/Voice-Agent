// Uses Node.js built-in node:sqlite (stable in Node 22.5+)
import { DatabaseSync } from 'node:sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

mkdirSync(join(__dirname, 'logs'), { recursive: true });

const db = new DatabaseSync(join(__dirname, 'logs', 'conversations.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    conversation_id TEXT PRIMARY KEY,
    channel         TEXT NOT NULL,
    customer_contact TEXT NOT NULL,
    messages        TEXT NOT NULL,
    intent          TEXT,
    outcome         TEXT,
    timestamp       TEXT NOT NULL
  )
`);

const upsert = db.prepare(`
  INSERT INTO conversations
    (conversation_id, channel, customer_contact, messages, intent, outcome, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(conversation_id) DO UPDATE SET
    messages  = excluded.messages,
    intent    = excluded.intent,
    outcome   = excluded.outcome,
    timestamp = excluded.timestamp
`);

const q7days  = db.prepare(`SELECT * FROM conversations WHERE timestamp >= ? ORDER BY timestamp DESC`);
const qOutcome = db.prepare(`SELECT * FROM conversations WHERE outcome = ? ORDER BY timestamp DESC`);

export function logConversation({ conversation_id, channel, customer_contact, messages, intent, outcome }) {
  upsert.run(
    conversation_id,
    channel,
    customer_contact,
    JSON.stringify(messages),
    intent  || 'OTHER',
    outcome || intent || 'OTHER',
    new Date().toISOString()
  );
}

export function getLast7Days() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return q7days.all(cutoff).map(parseRow);
}

export function getByOutcome(outcome) {
  return qOutcome.all(outcome).map(parseRow);
}

function parseRow(row) {
  return { ...row, messages: JSON.parse(row.messages) };
}
