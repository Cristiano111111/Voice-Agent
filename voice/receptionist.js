import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(business) {
  return `You are a friendly AI receptionist for ${business.name}, a ${business.type}.

Business info:
- Hours: ${business.hours}
- Address: ${business.address}
- Services: ${business.services.join(', ')}
- Booking: ${business.booking_info}

Rules:
- Keep every response to 1-3 sentences MAX. This is a phone call — be brief.
- Sound warm and natural, not robotic.
- If caller wants to book, ask for their name and preferred time.
- If caller has a question you can't answer, offer to take their name and number and have someone call back.
- Never say "as an AI" or mention being a language model. You are the receptionist.
- When the conversation is clearly over, end with a natural closing like "Have a great day, goodbye!"`;
}

export async function getReceptionistResponse(history, userMessage, business) {
  const messages = [...history, { role: 'user', content: userMessage }];

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: buildSystemPrompt(business),
    messages
  });

  return response.content[0].text;
}
