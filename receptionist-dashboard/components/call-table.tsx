import { ExternalLink } from "lucide-react";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { Call } from "@/lib/types";
import { clsx } from "clsx";

const statusClass = {
  hot: "bg-coral/10 text-coral",
  warm: "bg-amber-100 text-amber-700",
  cold: "bg-slate-100 text-slate-600"
};

export function CallTable({ calls }: { calls: Call[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Caller</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Booked</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Summary</th>
              <th className="px-4 py-3">Recording</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {calls.map((call) => (
              <tr key={call.id} className="align-top">
                <td className="px-4 py-4 font-medium text-ink">{call.caller_name || "Unknown"}</td>
                <td className="px-4 py-4 text-slate-600">{call.caller_phone || "No phone"}</td>
                <td className="px-4 py-4 text-slate-600">{formatDateTime(call.started_at)}</td>
                <td className="px-4 py-4 text-slate-600">{formatDuration(call.duration_seconds)}</td>
                <td className="px-4 py-4 text-slate-600">{call.service_requested || "General"}</td>
                <td className="px-4 py-4">
                  <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold", call.booked ? "bg-mint/10 text-mint" : "bg-slate-100 text-slate-600")}>
                    {call.booked ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {call.lead_status ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[call.lead_status]}`}>
                      {call.lead_status}
                    </span>
                  ) : (
                    <span className="text-slate-400">Unset</span>
                  )}
                </td>
                <td className="max-w-sm px-4 py-4 text-slate-600">{call.summary || "No summary yet."}</td>
                <td className="px-4 py-4">
                  {call.recording_url ? (
                    <a href={call.recording_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-ocean hover:underline">
                      Open
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </td>
              </tr>
            ))}
            {!calls.length ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  No calls match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
