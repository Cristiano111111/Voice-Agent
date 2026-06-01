import { NextResponse } from "next/server";
import { verify } from "retell-sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LeadStatus } from "@/lib/types";

type RetellPayload = Record<string, any>;

function pick<T>(...values: T[]) {
  return values.find((value) => value !== undefined && value !== null && value !== "") ?? null;
}

function normalizeLeadStatus(value: unknown): LeadStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.toLowerCase();
  if (normalized === "hot" || normalized === "warm" || normalized === "cold") return normalized;
  return null;
}

function secondsFromMs(value: unknown) {
  if (typeof value !== "number") return null;
  return Math.round(value / 1000);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-retell-signature");
  const apiKey = process.env.RETELL_API_KEY;
  const secret = process.env.RETELL_WEBHOOK_SECRET;
  const providedSecret = request.headers.get("x-retell-webhook-secret");

  if (apiKey && signature) {
    const validSignature = await verify(rawBody, apiKey, signature);
    if (!validSignature) {
      return NextResponse.json({ error: "Invalid Retell signature" }, { status: 401 });
    }
  } else if (secret && providedSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as RetellPayload;
  const event = payload.event;

  if (event && !["call_ended", "call_analyzed"].includes(event)) {
    return NextResponse.json({ ok: true, ignored: event });
  }

  const call = payload.call || payload.data || payload;
  const analysis = call.call_analysis || call.analysis || payload.call_analysis || {};
  const metadata = call.metadata || payload.metadata || {};
  const supabase = createAdminClient();

  const clientId = pick(metadata.client_id, call.client_id);
  let resolvedClientId = clientId;

  if (!resolvedClientId) {
    const agentId = pick(call.agent_id, call.retell_agent_id, payload.agent_id);
    const phone = pick(call.from_number, call.to_number, payload.phone_number);

    let clientQuery = supabase.from("clients").select("id").limit(1);
    if (agentId) clientQuery = clientQuery.eq("retell_agent_id", agentId);
    else if (phone) clientQuery = clientQuery.eq("retell_phone_number", phone);

    const { data: client } = await clientQuery.maybeSingle<{ id: string }>();
    resolvedClientId = client?.id ?? null;
  }

  if (!resolvedClientId) {
    return NextResponse.json({ error: "Could not resolve client for webhook." }, { status: 422 });
  }

  const startedAt = pick(call.start_timestamp, call.started_at, payload.started_at);
  const appointmentTime = pick(
    metadata.appointment_time,
    analysis.appointment_time,
    analysis.appointment_datetime,
    call.appointment_time
  );
  const booked = Boolean(pick(metadata.booked, analysis.booked, analysis.appointment_booked, call.booked));
  const durationSeconds = pick(
    call.duration_seconds,
    secondsFromMs(call.duration_ms),
    secondsFromMs(call.call_duration_ms),
    typeof call.start_timestamp === "number" && typeof call.end_timestamp === "number"
      ? secondsFromMs(call.end_timestamp - call.start_timestamp)
      : null
  );

  const callRecord = {
    client_id: resolvedClientId,
    retell_call_id: pick(call.call_id, call.id, payload.call_id),
    caller_name: pick(metadata.caller_name, analysis.caller_name, call.caller_name),
    caller_phone: pick(call.from_number, call.caller_phone, metadata.caller_phone),
    started_at: typeof startedAt === "number" ? new Date(startedAt).toISOString() : startedAt || new Date().toISOString(),
    duration_seconds: durationSeconds,
    service_requested: pick(metadata.service_requested, analysis.service_requested, analysis.service_type, call.service_requested),
    booked,
    needs_follow_up: Boolean(pick(metadata.needs_follow_up, analysis.needs_follow_up, !booked)),
    lead_status: normalizeLeadStatus(pick(metadata.lead_status, analysis.lead_status, analysis.lead_quality)),
    summary: pick(call.summary, analysis.call_summary, analysis.summary, payload.summary),
    transcript: pick(call.transcript, payload.transcript),
    call_analysis: analysis,
    recording_url: pick(call.recording_url, call.recording, payload.recording_url),
    appointment_time: appointmentTime
  };

  const { data: savedCall, error } = await supabase
    .from("calls")
    .upsert(callRecord, { onConflict: "retell_call_id" })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (booked && appointmentTime) {
    await supabase.from("appointments").upsert(
      {
        client_id: resolvedClientId,
        call_id: savedCall.id,
        appointment_time: appointmentTime,
        service_requested: callRecord.service_requested,
        customer_name: callRecord.caller_name,
        customer_phone: callRecord.caller_phone,
        status: "booked"
      },
      { onConflict: "call_id" }
    );
  }

  return NextResponse.json({ ok: true, call_id: savedCall.id });
}
