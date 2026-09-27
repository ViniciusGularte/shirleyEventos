import { Card } from "@/components/ui/card";

export function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="min-h-28 sm:min-h-32">
      <p className="text-sm font-bold text-event-ink/58">{label}</p>
      <strong className="mt-3 block break-words text-[clamp(1.1rem,5vw,1.75rem)] font-black leading-tight tracking-tight tabular-nums">{value}</strong>
      {hint ? <p className="mt-2 text-xs text-event-ink/55">{hint}</p> : null}
    </Card>
  );
}
