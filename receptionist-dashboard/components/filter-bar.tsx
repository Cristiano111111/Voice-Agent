import { Filter } from "lucide-react";

type FilterBarProps = {
  services: string[];
  defaults: Record<string, string | undefined>;
};

export function FilterBar({ services, defaults }: FilterBarProps) {
  return (
    <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
      <label className="md:col-span-1">
        <span className="text-xs font-semibold uppercase text-slate-500">From</span>
        <input name="start" type="date" defaultValue={defaults.start} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
      </label>
      <label className="md:col-span-1">
        <span className="text-xs font-semibold uppercase text-slate-500">To</span>
        <input name="end" type="date" defaultValue={defaults.end} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
      </label>
      <label>
        <span className="text-xs font-semibold uppercase text-slate-500">Booked</span>
        <select name="booked" defaultValue={defaults.booked || ""} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
          <option value="">All</option>
          <option value="true">Booked</option>
          <option value="false">Not booked</option>
        </select>
      </label>
      <label>
        <span className="text-xs font-semibold uppercase text-slate-500">Lead</span>
        <select name="lead_status" defaultValue={defaults.lead_status || ""} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
          <option value="">All</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
      </label>
      <label>
        <span className="text-xs font-semibold uppercase text-slate-500">Service</span>
        <select name="service" defaultValue={defaults.service || ""} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
          <option value="">All</option>
          {services.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </label>
      <button className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-slate-800">
        <Filter className="h-4 w-4" />
        Apply
      </button>
    </form>
  );
}
