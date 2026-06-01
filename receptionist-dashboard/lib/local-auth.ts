import crypto from "crypto";
import { cookies } from "next/headers";
import type { Call, Client } from "@/lib/types";

const LOCAL_EMAIL = "sanjayr7475@gmail.com";
const LOCAL_PASSWORD_HASH = "68676e43c02f8829d5ceea18785823e44d96d8a8cf95f2846e63dc252f4320e3";
const LOCAL_COOKIE = "jay_local_session";
const LOCAL_COOKIE_VALUE = "sanjay-local-dashboard";
const HASH_SALT = "jay-local-login:";

export const localClient: Client = {
  id: "local-client",
  name: "Sanjay AI Receptionist",
  industry: "Local service businesses",
  auth_user_id: "local-user",
  role: "admin",
  retell_agent_id: null,
  retell_phone_number: null
};

export const localCalls: Call[] = [];

export function canUseSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && anonKey && !anonKey.startsWith("PASTE_"));
}

export function isValidLocalLogin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = crypto.createHash("sha256").update(`${HASH_SALT}${password}`).digest("hex");
  return normalizedEmail === LOCAL_EMAIL && passwordHash === LOCAL_PASSWORD_HASH;
}

export async function createLocalSession() {
  const cookieStore = await cookies();
  cookieStore.set(LOCAL_COOKIE, LOCAL_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearLocalSession() {
  const cookieStore = await cookies();
  cookieStore.delete(LOCAL_COOKIE);
}

export async function hasLocalSession() {
  const cookieStore = await cookies();
  return cookieStore.get(LOCAL_COOKIE)?.value === LOCAL_COOKIE_VALUE;
}

export function filterLocalCalls(filters: {
  start?: string;
  end?: string;
  booked?: string;
  lead_status?: string;
  service?: string;
}) {
  return localCalls.filter((call) => {
    const started = new Date(call.started_at).getTime();
    if (filters.start && started < new Date(`${filters.start}T00:00:00`).getTime()) return false;
    if (filters.end && started > new Date(`${filters.end}T23:59:59`).getTime()) return false;
    if (filters.booked && call.booked !== (filters.booked === "true")) return false;
    if (filters.lead_status && call.lead_status !== filters.lead_status) return false;
    if (filters.service && call.service_requested !== filters.service) return false;
    return true;
  });
}
