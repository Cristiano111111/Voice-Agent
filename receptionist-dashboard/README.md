# AI Receptionist Client Dashboard

A production-ready Next.js dashboard for an AI receptionist business. Clients can log in, see only their own call data, filter call logs, and review leads, bookings, transcripts, summaries, analysis, and recordings. Admins can see all clients and all call data.

## Stack

- Next.js App Router
- Supabase Auth and Postgres
- Supabase Row Level Security
- Tailwind CSS
- Retell AI post-call webhook ingestion

## Run Locally

```bash
cd receptionist-dashboard
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RETELL_WEBHOOK_SECRET=choose-a-long-random-secret
RETELL_API_KEY=key_xxxxxxxxx
```

`SUPABASE_SERVICE_ROLE_KEY` is only used by the Retell webhook route so it can insert rows server-side. Never expose it in browser code.

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. In Authentication, create users for your clients and for your admin account.
5. Insert one `clients` row per account. Set:
   - `auth_user_id` to the Supabase Auth user ID.
   - `role` to `client` for customers or `admin` for you.
   - `retell_agent_id` or `retell_phone_number` so webhook events can be assigned to the correct client.

Example:

```sql
insert into public.clients (auth_user_id, name, industry, role, retell_agent_id)
values ('AUTH_USER_UUID', 'Bright Air HVAC', 'HVAC', 'client', 'agent_abc123');

insert into public.clients (auth_user_id, name, industry, role)
values ('ADMIN_AUTH_USER_UUID', 'Your Agency', 'Agency', 'admin');
```

## Database Schema

The schema creates:

- `clients`: client profile, auth mapping, industry, role, Retell identifiers.
- `calls`: call details, transcript, summary, recording URL, lead status, booking status, appointment time, Retell analysis JSON.
- `appointments`: booked appointment records linked back to calls.

RLS is enabled on all tables. Client users can only read rows tied to their own `clients.id`. Admin users can read and manage every row. Webhook inserts use the service role key and bypass RLS from the server route.

## Retell Webhook

Set the Retell post-call webhook URL to:

```text
https://your-domain.com/api/retell-webhook
```

The webhook verifies Retell's `x-retell-signature` header when `RETELL_API_KEY` is set. If you cannot use signature verification while testing, add this custom header in Retell if your plan supports custom headers:

```text
x-retell-webhook-secret: your RETELL_WEBHOOK_SECRET value
```

The webhook accepts common Retell payload shapes and stores:

- call ID
- caller name and phone
- start time and duration
- transcript
- summary
- call analysis JSON
- service requested
- booking status
- lead status
- appointment time
- recording link

For reliable client separation, include either `metadata.client_id` in the Retell call metadata or configure each `clients.retell_agent_id` to match Retell's `agent_id`.

The dashboard listens to Supabase Realtime for inserts and updates on `calls`. If you added the schema manually, make sure `public.calls` is enabled under Database > Replication, or run:

```sql
alter publication supabase_realtime add table public.calls;
```

## Customizing For Industries

Use `clients.industry` and `calls.service_requested` for vertical-specific reporting. Examples:

- HVAC: repair, install, tune-up, emergency call
- Auto shops: oil change, brake repair, inspection, diagnostic
- Salons: haircut, color, consultation, bridal booking

The dashboard cards and table are generic enough for local service businesses, while the `service_requested` filter lets each client see the services that matter to them.

## Production Notes

- Deploy on Vercel or another Next.js host.
- Set all environment variables in your hosting provider.
- Keep `RETELL_WEBHOOK_SECRET` long and random.
- Do not use the service role key outside server-only code.
- Review Supabase Auth email settings before inviting clients.
- Add your production URL to Supabase Auth redirect URLs.
