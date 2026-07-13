import 'dotenv/config';
import express from 'express';
import twilio from 'twilio';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getReceptionistResponse } from './receptionist.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const business = JSON.parse(readFileSync(join(__dirname, 'business.json'), 'utf8'));
const VoiceResponse = twilio.twiml.VoiceResponse;
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

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

// Contact form → Resend email
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, service, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

  try {
    await resend.emails.send({
      from: 'Rabbit Pressure Washing <outreach@jayrx.net>',
      to:   'jayrx16@gmail.com',
      replyTo: email,
      subject: `Quote Request from ${name}${service ? ` — ${service}` : ''}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;color:#111">
          <h2 style="margin:0 0 1.5rem;font-size:1.4rem">New Quote Request</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:0.5rem 0;color:#666;width:90px">Name</td><td style="padding:0.5rem 0;font-weight:600">${name}</td></tr>
            <tr><td style="padding:0.5rem 0;color:#666">Email</td><td style="padding:0.5rem 0"><a href="mailto:${email}">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding:0.5rem 0;color:#666">Phone</td><td style="padding:0.5rem 0"><a href="tel:${phone}">${phone}</a></td></tr>` : ''}
            ${service ? `<tr><td style="padding:0.5rem 0;color:#666">Service</td><td style="padding:0.5rem 0">${service}</td></tr>` : ''}
          </table>
          ${message ? `<div style="margin-top:1.5rem;padding:1rem;background:#f5f5f5;border-radius:4px;white-space:pre-wrap;font-size:0.9rem">${message}</div>` : ''}
          <p style="margin-top:2rem;font-size:0.8rem;color:#999">Sent from jayrx.net contact form</p>
        </div>
      `,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Resend error:', err.message);
    res.status(500).json({ error: 'Failed to send message.' });
  }
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
