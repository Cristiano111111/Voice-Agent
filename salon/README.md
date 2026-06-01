# Bella's Salon AI — Customer Service Backend

AI-powered customer service system for Bella's Salon. Receives messages from website chat, Instagram DMs, and SMS, classifies intent, responds automatically via Claude, handles bookings, and escalates to you when needed.

---

## Setup

### 1. Install dependencies

```bash
cd salon
npm install
```

> Requires **Node.js 22.5 or higher** (uses the built-in `node:sqlite` module — no native compilation needed).

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your keys (see **Environment Variables** section below).

### 3. Fill in business-brain.txt

Open `business-brain.txt` and replace every `[fill in]` placeholder with your real business info — hours, services, prices, FAQs. The more complete this file is, the better the AI handles real customer questions without needing escalation.

### 4. Start the server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server starts at `http://localhost:3000` (or the `PORT` you set in `.env`).

---

## How to connect each channel

### Website Chat
Point your chat widget's outbound webhook to `POST /webhook`. Most platforms (Tidio, Crisp, custom) let you configure a webhook URL in settings.

Payload:
```json
{
  "channel": "website",
  "customer_contact": "visitor-id-or-email",
  "customer_name": "Jane",
  "message": "Do you have availability Saturday?"
}
```

### Instagram DMs
Use the [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram) or a platform like ManyChat/MobileMonkey. Configure their webhook to forward messages to `POST /webhook` with `"channel": "instagram"`.

### SMS (Twilio Webhook)
In your [Twilio Console](https://console.twilio.com), set the incoming message webhook for your number to `POST https://your-domain.com/webhook`. Twilio will POST fields including `From` (phone) and `Body` (message text) — you'll need a small adapter route or middleware to reshape those into the standard payload format.

---

## API Endpoints

### `POST /webhook`
Receives an incoming customer message.

**Request body:**
```json
{
  "channel": "website | instagram | sms",
  "customer_contact": "email, phone, or unique ID",
  "customer_name": "optional display name",
  "message": "the customer's message text",
  "conversation_id": "optional — omit to start a new conversation"
}
```

**Response:**
```json
{
  "conversation_id": "website-jane@email.com-1716643200000",
  "reply": "Hi Jane! We'd love to get you in...",
  "intent": "BOOKING",
  "shouldEscalate": false,
  "shouldBook": true,
  "bookingLink": "https://calendly.com/bellas-salon/appointment?name=Jane"
}
```

### `GET /conversations`
Returns conversations from the last 7 days.

```bash
GET /conversations
GET /conversations?outcome=ESCALATE
GET /conversations?outcome=BOOKING
```

### `GET /health`
```bash
GET /health
# → { "status": "ok", "service": "Bella's Salon AI", "timestamp": "..." }
```

---

## Testing locally with curl

**Send a FAQ message:**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"channel":"website","customer_contact":"test@example.com","customer_name":"Jane","message":"What are your hours on Saturday?"}'
```

**Trigger a booking flow:**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"channel":"website","customer_contact":"test@example.com","customer_name":"Jane","message":"I want to book a haircut next Friday at 2pm"}'
```

**Trigger an escalation:**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"channel":"website","customer_contact":"test@example.com","customer_name":"Jane","message":"This is ridiculous, you messed up my color and now youre ignoring me"}'
```

**View recent conversations:**
```bash
curl http://localhost:3000/conversations
curl "http://localhost:3000/conversations?outcome=ESCALATE"
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `PORT` | No | Server port (default: 3000) |
| `WEBHOOK_SECRET` | No | Secret to validate incoming webhook signatures |
| `CALENDLY_EVENT_URL` | Yes | Full Calendly event URL for booking links |
| `CALENDLY_API_KEY` | No | Only needed for advanced Calendly API features |
| `TWILIO_ACCOUNT_SID` | For SMS alerts | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | For SMS alerts | Your Twilio Auth Token |
| `TWILIO_FROM_NUMBER` | For SMS alerts | E.164 number that sends alerts (e.g. +12025551234) |
| `OWNER_PHONE_NUMBER` | For SMS alerts | Your phone number that receives escalation alerts |

---

## Intent Classification

Every message is classified by the AI as one of:

| Intent | Meaning |
|---|---|
| `FAQ` | General question about hours, prices, services |
| `BOOKING` | Customer wants to book or reschedule |
| `COMPLAINT` | Customer is unhappy |
| `ESCALATE` | Needs a human immediately |
| `OTHER` | Doesn't fit the above |

Escalations are triggered automatically when `intent === ESCALATE` or when the AI detects 2+ complaints in a conversation.

---

## File Structure

```
salon/
├── server.js              ← Express server, endpoint wiring
├── ai-responder.js        ← Claude API integration + intent classification
├── booking-handler.js     ← Calendly link builder
├── escalation.js          ← Twilio SMS alerts + escalation log
├── conversation-logger.js ← SQLite storage
├── business-brain.txt     ← Fill this in with your business info
├── .env.example           ← Copy to .env and fill in keys
├── package.json
├── README.md
└── logs/
    ├── conversations.db   ← Auto-created on first run
    └── escalations.log    ← Escalation audit trail
```
