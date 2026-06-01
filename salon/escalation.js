import twilio from 'twilio';
import { appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { businessName } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = join(__dirname, 'logs', 'escalations.log');

mkdirSync(join(__dirname, 'logs'), { recursive: true });

function buildTranscript(history) {
  return history.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n');
}

function buildAlertBody({ channel, customer_contact, customer_name, history, summary }) {
  return [
    `ESCALATION — ${businessName}`,
    `Customer: ${customer_name} (${customer_contact})`,
    `Channel:  ${channel}`,
    `Issue:    ${summary || 'No summary available'}`,
    ``,
    `--- Transcript ---`,
    buildTranscript(history)
  ].join('\n');
}

function appendToLog(convId, body, reason = '') {
  try {
    const entry = `\n[${new Date().toISOString()}] conv=${convId} ${reason ? `reason=${reason}` : ''}\n${body}\n${'='.repeat(60)}`;
    appendFileSync(LOG_PATH, entry, 'utf-8');
  } catch (err) {
    console.error('[escalation] Failed to write log:', err.message);
  }
}

async function trySendSms(body) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, OWNER_PHONE_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !OWNER_PHONE_NUMBER) {
    console.warn('[escalation] Twilio not fully configured — skipping SMS');
    return false;
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  // Twilio SMS body limit is 1600 chars
  await client.messages.create({ body: body.slice(0, 1600), from: TWILIO_FROM_NUMBER, to: OWNER_PHONE_NUMBER });
  return true;
}

export async function handleEscalation(params) {
  const { convId } = params;
  const alertBody = buildAlertBody(params);

  try {
    const sent = await trySendSms(alertBody);
    if (!sent) appendToLog(convId, alertBody, 'sms-skipped');
  } catch (err) {
    console.error('[escalation] SMS failed, retrying in 30s:', err.message);
    appendToLog(convId, alertBody, `sms-failed: ${err.message}`);

    setTimeout(async () => {
      try {
        await trySendSms(alertBody);
      } catch (retryErr) {
        console.error('[escalation] Retry also failed:', retryErr.message);
        appendToLog(convId, alertBody, `retry-failed: ${retryErr.message}`);
      }
    }, 30_000);
  }
}
