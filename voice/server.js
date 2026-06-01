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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\nVoice agent running on port ${PORT}`);
  console.log(`Business: ${business.name}`);
  console.log(`\nSet your Twilio webhook to: https://YOUR-NGROK-URL/voice\n`);
});
