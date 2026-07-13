import 'dotenv/config';
import express from 'express';
import twilio from 'twilio';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getReceptionistResponse } from './receptionist.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const business = JSON.parse(readFileSync(join(__dirname, 'business.json'), 'utf8'));
const VoiceResponse = twilio.twiml.VoiceResponse;

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// In-memory conversation store: callSid → messages[]
const conversations = new Map();

// Incoming call
app.post('/voice', (req, res) => {
  const callSid = req.body.CallSid;
  conversations.set(callSid, []);

  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: '/voice/respond',
    method: 'POST',
    speechTimeout: 'auto',
    timeout: 6,
    language: 'en-US'
  });

  gather.say({ voice: 'Polly.Joanna' }, `Thank you for calling ${business.name}. How can I help you today?`);

  // Fallback if caller says nothing
  twiml.say({ voice: 'Polly.Joanna' }, "I didn't hear anything. Please call back and we'll be happy to help. Goodbye!");
  twiml.hangup();

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle caller's response
app.post('/voice/respond', async (req, res) => {
  const callSid = req.body.CallSid;
  const speechResult = (req.body.SpeechResult || '').trim();
  const twiml = new VoiceResponse();

  if (!speechResult) {
    const gather = twiml.gather({
      input: 'speech',
      action: '/voice/respond',
      method: 'POST',
      speechTimeout: 'auto',
      timeout: 5
    });
    gather.say({ voice: 'Polly.Joanna' }, "Sorry, I didn't catch that. Could you repeat yourself?");
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  console.log(`[${callSid}] Caller: ${speechResult}`);

  const history = conversations.get(callSid) || [];

  try {
    const reply = await getReceptionistResponse(history, speechResult, business);
    console.log(`[${callSid}] Jay: ${reply}`);

    history.push({ role: 'user', content: speechResult });
    history.push({ role: 'assistant', content: reply });
    conversations.set(callSid, history);

    const isEnding = /goodbye|bye|have a great day|talk to you|thank you, goodbye/i.test(reply);

    if (isEnding) {
      twiml.say({ voice: 'Polly.Joanna' }, reply);
      twiml.hangup();
    } else {
      const gather = twiml.gather({
        input: 'speech',
        action: '/voice/respond',
        method: 'POST',
        speechTimeout: 'auto',
        timeout: 8,
        language: 'en-US'
      });
      gather.say({ voice: 'Polly.Joanna' }, reply);

      // Fallback if caller goes silent mid-conversation
      twiml.say({ voice: 'Polly.Joanna' }, "Is there anything else I can help you with?");
      twiml.redirect({ method: 'POST' }, '/voice/respond');
    }
  } catch (err) {
    console.error('Claude error:', err.message);
    const gather = twiml.gather({
      input: 'speech',
      action: '/voice/respond',
      method: 'POST',
      speechTimeout: 'auto'
    });
    gather.say({ voice: 'Polly.Joanna' }, "Sorry about that, I had a little trouble. Could you say that again?");
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Twilio status callback — clean up conversation on call end
app.post('/voice/status', (req, res) => {
  const { CallSid, CallStatus } = req.body;
  if (['completed', 'failed', 'busy', 'no-answer'].includes(CallStatus)) {
    conversations.delete(CallSid);
    console.log(`[${CallSid}] Call ended: ${CallStatus}`);
  }
  res.sendStatus(200);
});

// Root route — health check / landing page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${business.name} — AI Receptionist</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
               background: #0a0a0a; color: #f0f0f0; display: flex;
               align-items: center; justify-content: center; min-height: 100vh; }
        .card { text-align: center; padding: 3rem 2rem; max-width: 480px; }
        .dot { width: 12px; height: 12px; background: #22c55e; border-radius: 50%;
               display: inline-block; margin-right: 8px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        h1 { font-size: 2rem; font-weight: 700; margin: 1rem 0 .5rem; }
        p  { color: #888; font-size: 1rem; line-height: 1.6; }
        .badge { display: inline-block; margin-top: 2rem; padding: .4rem 1rem;
                 background: #1a1a1a; border: 1px solid #333; border-radius: 999px;
                 font-size: .8rem; color: #666; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="dot"></span><span style="color:#22c55e;font-size:.9rem">Active</span>
        <h1>${business.name}</h1>
        <p>AI-powered receptionist — ready to answer calls 24/7.</p>
        <div class="badge">jayrx.net</div>
      </div>
    </body>
    </html>
  `);
});

// Only start HTTP server in local dev — Vercel handles this in production
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`\nVoice agent running on port ${PORT}`);
    console.log(`Business: ${business.name}`);
    console.log(`\nSet your Twilio webhook to: https://YOUR-DOMAIN/voice\n`);
  });
}

export default app;
