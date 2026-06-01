import { redirect } from "next/navigation";
import { CalendarCheck, Headphones, Percent, PhoneForwarded, Users } from "lucide-react";
import { CallTable } from "@/components/call-table";
import { FilterBar } from "@/components/filter-bar";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { SignOutButton } from "@/components/sign-out-button";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/server";
import { summarizeCalls, uniqueServices, type Filters } from "@/lib/dashboard";
import { canUseSupabase, filterLocalCalls, hasLocalSession, localClient } from "@/lib/local-auth";
import type { Call, Client } from "@/lib/types";

type PageProps = {
  searchParams: Promise<Filters>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const filters = await searchParams;

  if (!canUseSupabase()) {
    if (!(await hasLocalSession())) redirect("/login?next=/dashboard");

    const calls = filterLocalCalls(filters);
    const summary = summarizeCalls(calls);
    const services = uniqueServices(calls);

    return (
      <main className="min-h-screen bg-slate-50">
        <RealtimeRefresh clientId={localClient.id} />
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase text-ocean">{localClient.industry}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-ink">{localClient.name} dashboard</h1>
            </div>
            <SignOutButton />
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total calls answered" value={summary.totalCalls} icon={Headphones} tone="ocean" />
            <StatCard label="Total leads generated" value={summary.leads} icon={Users} tone="mint" />
            <StatCard label="Appointments booked" value={summary.booked} icon={CalendarCheck} tone="ink" />
            <StatCard label="Booking conversion" value={`${summary.conversionRate}%`} icon={Percent} tone="mint" />
            <StatCard label="Needs follow-up" value={summary.followUps} icon={PhoneForwarded} tone="coral" />
          </section>

          <FilterBar services={services} defaults={filters} />

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Call log</h2>
              <p className="text-sm text-slate-500">{calls.length} calls</p>
            </div>
            <CallTable calls={calls} />
          </section>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login?next=/dashboard");

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle<Client>();

  if (!client) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-ink">Client profile missing</h1>
          <p className="mt-3 text-slate-600">Create a row in `clients` with this user&apos;s auth ID to unlock the dashboard.</p>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </div>
      </main>
    );
  }

  let query = supabase.from("calls").select("*").order("started_at", { ascending: false });

  if (filters.start) query = query.gte("started_at", `${filters.start}T00:00:00`);
  if (filters.end) query = query.lte("started_at", `${filters.end}T23:59:59`);
  if (filters.booked) query = query.eq("booked", filters.booked === "true");
  if (filters.lead_status) query = query.eq("lead_status", filters.lead_status);
  if (filters.service) query = query.eq("service_requested", filters.service);

  const { data: callRows, error } = await query.returns<Call[]>();
  const calls = callRows ?? [];
  const summary = summarizeCalls(calls);
  const services = uniqueServices(calls);

  return (
    <main className="min-h-screen bg-slate-50">
      <RealtimeRefresh clientId={client.id} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-ocean">{client.industry || "Local business"}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-ink">{client.name} dashboard</h1>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total calls answered" value={summary.totalCalls} icon={Headphones} tone="ocean" />
          <StatCard label="Total leads generated" value={summary.leads} icon={Users} tone="mint" />
          <StatCard label="Appointments booked" value={summary.booked} icon={CalendarCheck} tone="ink" />
          <StatCard label="Booking conversion" value={`${summary.conversionRate}%`} icon={Percent} tone="mint" />
          <StatCard label="Needs follow-up" value={summary.followUps} icon={PhoneForwarded} tone="coral" />
        </section>

        <FilterBar services={services} defaults={filters} />

        {error ? <p className="rounded-md border border-coral/30 bg-coral/10 p-4 text-sm text-coral">{error.message}</p> : null}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Call log</h2>
            <p className="text-sm text-slate-500">{calls.length} calls</p>
          </div>
          <CallTable calls={calls} />
        </section>
      </div>
    </main>
  );
}
