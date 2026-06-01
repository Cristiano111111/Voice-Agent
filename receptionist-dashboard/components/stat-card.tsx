import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: "ocean" | "mint" | "coral" | "ink";
};

const tones = {
  ocean: "bg-ocean/10 text-ocean",
  mint: "bg-mint/10 text-mint",
  coral: "bg-coral/10 text-coral",
  ink: "bg-ink/10 text-ink"
};

export function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-md ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-normal text-ink">{value}</p>
    </div>
  );
}
