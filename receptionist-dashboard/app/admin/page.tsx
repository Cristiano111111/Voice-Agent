import { redirect } from "next/navigation";
import { Building2, CalendarCheck, Headphones, Users } from "lucide-react";
import { CallTable } from "@/components/call-table";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { SignOutButton } from "@/components/sign-out-button";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/server";
import { summarizeCalls } from "@/lib/dashboard";
import { canUseSupabase, hasLocalSession, localCalls, localClient } from "@/lib/local-auth";
import type { Call, Client } from "@/lib/types";

export default async function AdminPage() {
  if (!canUseSupabase()) {
    if (!(await hasLocalSession())) redirect("/login?next=/admin");

    const clients = [localClient];
    const calls = localCalls;
    const summary = summarizeCalls(calls);

    return (
      <main className="min-h-screen bg-slate-50">
        <RealtimeRefresh />
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase text-ocean">Admin</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-ink">All clients and calls</h1>
            </div>
            <SignOutButton />
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Clients" value={clients.length} icon={Building2} tone="ink" />
            <StatCard label="Calls answered" value={summary.totalCalls} icon={Headphones} tone="ocean" />
            <StatCard label="Leads generated" value={summary.leads} icon={Users} tone="mint" />
            <StatCard label="Appointments booked" value={summary.booked} icon={CalendarCheck} tone="coral" />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Clients</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {clients.map((client) => (
                <div key={client.id} className="rounded-md border border-slate-200 p-4">
                  <p className="font-semibold text-ink">{client.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{client.industry || "No industry"} / {client.role}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">All call data</h2>
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

  if (!auth.user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_user_id", auth.user.id)
    .maybeSingle<Client>();

  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: clientRows }, { data: callRows }] = await Promise.all([
    supabase.from("clients").select("*").order("name").returns<Client[]>(),
    supabase.from("calls").select("*").order("started_at", { ascending: false }).returns<Call[]>()
  ]);

  const clients = clientRows ?? [];
  const calls = callRows ?? [];
  const summary = summarizeCalls(calls);

  return (
    <main className="min-h-screen bg-slate-50">
      <RealtimeRefresh />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-ocean">Admin</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-ink">All clients and calls</h1>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Clients" value={clients.length} icon={Building2} tone="ink" />
          <StatCard label="Calls answered" value={summary.totalCalls} icon={Headphones} tone="ocean" />
          <StatCard label="Leads generated" value={summary.leads} icon={Users} tone="mint" />
          <StatCard label="Appointments booked" value={summary.booked} icon={CalendarCheck} tone="coral" />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Clients</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => (
              <div key={client.id} className="rounded-md border border-slate-200 p-4">
                <p className="font-semibold text-ink">{client.name}</p>
                <p className="mt-1 text-sm text-slate-500">{client.industry || "No industry"} / {client.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">All call data</h2>
            <p className="text-sm text-slate-500">{calls.length} calls</p>
          </div>
          <CallTable calls={calls} />
        </section>
      </div>
    </main>
  );
}
