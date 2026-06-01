import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { processMessage } from './ai-responder.js';
import { logConversation, getLast7Days, getByOutcome } from './conversation-logger.js';
import { handleBooking } from './booking-handler.js';
import { handleEscalation } from './escalation.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Per-process conversation history cache (role/content arrays keyed by conversation_id).
// For production, replace with a Redis or DB-backed store.
const convCache = new Map();

function getHistory(convId) {
  if (!convCache.has(convId)) convCache.set(convId, []);
  return convCache.get(convId);
}

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: "Bella's Salon AI", timestamp: new Date().toISOString() });
});

// ── Webhook — receives messages from all channels ───────────────────────────
app.post('/webhook', async (req, res) => {
  const { channel, customer_contact, customer_name, message, conversation_id } = req.body;

  if (!channel || !customer_contact || !message) {
    return res.status(400).json({
      error: 'Missing required fields: channel, customer_contact, message'
    });
  }

  const convId = conversation_id || `${channel}-${customer_contact}-${Date.now()}`;
  const history = getHistory(convId);

  history.push({ role: 'user', content: message });

  let aiResult;
  try {
    aiResult = await processMessage(history);
  } catch (err) {
    console.error('[webhook] processMessage threw unexpectedly:', err.message);
    aiResult = {
      message: "Thanks for reaching out! We'll get back to you within 1 hour.",
      intent: 'OTHER',
      shouldEscalate: false,
      shouldBook: false,
      extractedInfo: {}
    };
  }

  history.push({ role: 'assistant', content: aiResult.message });

  let outcome = aiResult.intent;
  let bookingLink = null;

  // ── Booking ──────────────────────────────────────────────────────────────
  if (aiResult.shouldBook) {
    try {
      bookingLink = await handleBooking(aiResult.extractedInfo, customer_name || '');
      if (bookingLink) aiResult.message += `\n\nBook here: ${bookingLink}`;
    } catch (err) {
      console.error('[webhook] Booking handler error:', err.message);
      bookingLink = process.env.CALENDLY_EVENT_URL || process.env.BOOKING_URL || null;
      if (bookingLink) aiResult.message += `\n\nBook here: ${bookingLink}`;
    }
  }

  // ── Escalation ───────────────────────────────────────────────────────────
  if (aiResult.shouldEscalate) {
    outcome = 'ESCALATE';
    handleEscalation({
      convId,
      channel,
      customer_contact,
      customer_name: customer_name || customer_contact,
      history,
      summary: aiResult.extractedInfo?.summary || aiResult.message
    }).catch(err => console.error('[webhook] Escalation error:', err.message));
  }

  // ── Log ──────────────────────────────────────────────────────────────────
  try {
    logConversation({ conversation_id: convId, channel, customer_contact, messages: history, intent: aiResult.intent, outcome });
  } catch (err) {
    console.error('[webhook] Logger error:', err.message);
  }

  res.json({
    conversation_id: convId,
    reply:          aiResult.message,
    intent:         aiResult.intent,
    shouldEscalate: aiResult.shouldEscalate,
    shouldBook:     aiResult.shouldBook,
    bookingLink
  });
});

// ── Conversations ────────────────────────────────────────────────────────────
app.get('/conversations', (req, res) => {
  const { outcome } = req.query;
  try {
    const conversations = outcome ? getByOutcome(outcome) : getLast7Days();
    res.json({ conversations, count: conversations.length });
  } catch (err) {
    console.error('[conversations] Query error:', err.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Bella's Salon AI running on http://localhost:${PORT}`);
});

export default app;
