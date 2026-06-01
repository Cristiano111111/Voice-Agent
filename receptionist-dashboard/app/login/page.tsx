import { Suspense } from "react";
import { PhoneCall } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-linen lg:grid-cols-[1fr_0.9fr]">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-ink text-white">
            <PhoneCall className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-ink">Client dashboard</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Track answered calls, booked appointments, lead quality, and every conversation your AI receptionist handled.
          </p>
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </section>
      <section className="hidden bg-ink p-10 text-white lg:block">
        <div className="flex h-full flex-col justify-between rounded-lg border border-white/10 bg-white/5 p-8">
          <div>
            <p className="text-sm font-semibold uppercase text-mint">AI Receptionist Ops</p>
            <h2 className="mt-4 max-w-xl text-5xl font-semibold tracking-normal">
              Calls become booked revenue, not mystery voicemails.
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {["HVAC", "Auto", "Salons"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/10 p-4">
                <p className="text-sm text-white/70">{item}</p>
                <p className="mt-2 text-2xl font-semibold">Ready</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
