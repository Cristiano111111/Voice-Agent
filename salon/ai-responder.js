import { businessBrain, businessName, OLLAMA_URL, OLLAMA_MODEL } from './config.js';

const SYSTEM_PROMPT = `You are the AI customer service assistant for ${businessName}.

Your job is to help customers get answers, book appointments, and feel taken care of — in the tone described in the business context below.

--- BUSINESS CONTEXT ---
${businessBrain}
--- END CONTEXT ---

RULES:
1. Only use information from the business context above — never make up prices, hours, or policies
2. If you don't know the answer with certainty, say "Let me get ${businessName} to help you with that" and set shouldEscalate=true
3. If the customer seems frustrated or angry (2+ complaints in the conversation), set shouldEscalate=true
4. Keep replies concise — 2-3 sentences max unless they asked a detailed question
5. If the customer wants to book, set shouldBook=true
6. Classify every message with one intent tag
7. Extract any booking info (name, service, date/time, email) into extractedInfo

Respond ONLY with valid JSON — no extra text, no markdown fences:
{
  "message": "your reply to the customer",
  "intent": "FAQ | BOOKING | COMPLAINT | ESCALATE | OTHER",
  "shouldEscalate": false,
  "shouldBook": false,
  "extractedInfo": {
    "name": "",
    "service": "",
    "date": "",
    "time": "",
    "email": "",
    "summary": ""
  }
}`;

const FALLBACK = {
  message: "Thanks for reaching out! We'll get back to you within 1 hour.",
  intent: 'OTHER',
  shouldEscalate: false,
  shouldBook: false,
  extractedInfo: {}
};

export async function processMessage(conversationHistory) {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:    OLLAMA_MODEL,
        stream:   false,
        format:   'json',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory.map(m => ({ role: m.role, content: m.content }))
        ]
      })
    });

    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);

    const data = await response.json();
    const raw  = data.message?.content?.trim();
    if (!raw) throw new Error('Empty response from Ollama');

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const result = JSON.parse(jsonMatch[0]);
    if (!result.message || !result.intent) throw new Error('Response missing required fields');

    return {
      message:        result.message,
      intent:         result.intent,
      shouldEscalate: Boolean(result.shouldEscalate),
      shouldBook:     Boolean(result.shouldBook),
      extractedInfo:  result.extractedInfo || {}
    };

  } catch (err) {
    console.error('[ai-responder] Error:', err.message);
    return FALLBACK;
  }
}
