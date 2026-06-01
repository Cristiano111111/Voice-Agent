export type LeadStatus = "hot" | "warm" | "cold";

export type Client = {
  id: string;
  name: string;
  industry: string | null;
  auth_user_id: string | null;
  role: "client" | "admin";
  retell_agent_id: string | null;
  retell_phone_number: string | null;
};

export type Call = {
  id: string;
  client_id: string;
  retell_call_id: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  started_at: string;
  duration_seconds: number | null;
  service_requested: string | null;
  booked: boolean;
  needs_follow_up: boolean;
  lead_status: LeadStatus | null;
  summary: string | null;
  transcript: string | null;
  call_analysis: Record<string, unknown> | null;
  recording_url: string | null;
  appointment_time: string | null;
};
