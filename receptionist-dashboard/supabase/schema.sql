create extension if not exists "pgcrypto";

create type public.client_role as enum ('client', 'admin');
create type public.lead_status as enum ('hot', 'warm', 'cold');
create type public.appointment_status as enum ('booked', 'cancelled', 'completed', 'no_show');

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  industry text,
  role public.client_role not null default 'client',
  retell_agent_id text unique,
  retell_phone_number text,
  created_at timestamptz not null default now()
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  retell_call_id text unique,
  caller_name text,
  caller_phone text,
  started_at timestamptz not null default now(),
  duration_seconds integer,
  service_requested text,
  booked boolean not null default false,
  needs_follow_up boolean not null default false,
  lead_status public.lead_status,
  summary text,
  transcript text,
  call_analysis jsonb not null default '{}'::jsonb,
  recording_url text,
  appointment_time timestamptz,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  call_id uuid unique references public.calls(id) on delete set null,
  appointment_time timestamptz not null,
  service_requested text,
  customer_name text,
  customer_phone text,
  status public.appointment_status not null default 'booked',
  created_at timestamptz not null default now()
);

create index calls_client_started_idx on public.calls (client_id, started_at desc);
create index calls_lead_status_idx on public.calls (lead_status);
create index appointments_client_time_idx on public.appointments (client_id, appointment_time);

alter publication supabase_realtime add table public.calls;

alter table public.clients enable row level security;
alter table public.calls enable row level security;
alter table public.appointments enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients
    where auth_user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.clients
  where auth_user_id = auth.uid()
  limit 1;
$$;

create policy "Clients can read own client row"
on public.clients for select
to authenticated
using (auth_user_id = auth.uid() or public.is_admin());

create policy "Admins can manage clients"
on public.clients for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Clients can read own calls"
on public.calls for select
to authenticated
using (client_id = public.current_client_id() or public.is_admin());

create policy "Admins can manage calls"
on public.calls for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Clients can read own appointments"
on public.appointments for select
to authenticated
using (client_id = public.current_client_id() or public.is_admin());

create policy "Admins can manage appointments"
on public.appointments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Example setup after creating users in Supabase Auth:
-- insert into public.clients (auth_user_id, name, industry, role, retell_agent_id)
-- values ('AUTH_USER_UUID', 'Acme HVAC', 'HVAC', 'client', 'agent_xxxxx');
--
-- insert into public.clients (auth_user_id, name, industry, role)
-- values ('ADMIN_AUTH_USER_UUID', 'Your Agency', 'Agency', 'admin');
