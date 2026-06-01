import type { Call } from "@/lib/types";

export type Filters = {
  start?: string;
  end?: string;
  booked?: string;
  lead_status?: string;
  service?: string;
};

export function summarizeCalls(calls: Call[]) {
  const totalCalls = calls.length;
  const booked = calls.filter((call) => call.booked).length;
  const leads = calls.filter((call) => call.lead_status === "hot" || call.lead_status === "warm").length;
  const followUps = calls.filter((call) => call.needs_follow_up).length;

  return {
    totalCalls,
    booked,
    leads,
    followUps,
    conversionRate: totalCalls ? Math.round((booked / totalCalls) * 100) : 0
  };
}

export function uniqueServices(calls: Call[]) {
  return Array.from(new Set(calls.map((call) => call.service_requested).filter(Boolean) as string[])).sort();
}
