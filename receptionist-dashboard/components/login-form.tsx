"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith("PASTE_")
    ) {
      const response = await fetch("/api/local-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push(searchParams.get("next") || "/dashboard");
      router.refresh();
      return;
    }

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(searchParams.get("next") || "/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not sign in. Check your Supabase environment variables.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <span className="mt-2 flex h-12 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 focus-within:border-ocean">
          <Mail className="h-4 w-4 text-slate-400" />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            className="w-full bg-transparent text-sm outline-none"
            placeholder="client@business.com"
          />
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <span className="mt-2 flex h-12 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 focus-within:border-ocean">
          <Lock className="h-4 w-4 text-slate-400" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Password"
          />
        </span>
      </label>
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <button
        disabled={loading}
        className="h-12 w-full rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
