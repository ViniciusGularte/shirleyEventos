import { cn } from "@/lib/utils/cn";

const labels: Record<string, string> = {
  scheduled: "Agendado",
  completed: "Realizado",
  cancelled: "Cancelado",
  active: "Ativa",
  grace: "Carência",
  suspended: "Suspensa",
  archived: "Arquivada"
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        status === "cancelled" || status === "suspended" || status === "archived"
          ? "border-event-ink/20 bg-event-ink/5 text-event-ink"
          : "border-event-rose/20 bg-event-rose/10 text-event-ink"
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}
