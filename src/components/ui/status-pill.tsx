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
        "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold",
        (status === "active" || status === "completed") && "border-emerald-200 bg-emerald-50 text-emerald-800",
        (status === "scheduled" || status === "grace") && "border-amber-200 bg-amber-50 text-amber-800",
        (status === "cancelled" || status === "suspended" || status === "archived") && "border-red-200 bg-red-50 text-red-800"
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}
