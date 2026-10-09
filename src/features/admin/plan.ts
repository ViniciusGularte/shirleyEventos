type PlanWorkspace = {
  status?: string | null;
  plan_paused_at?: string | null;
  next_payment_due_on?: string | null;
};

export type PlanSituation = {
  kind: "archived" | "paused" | "overdue" | "due_soon" | "current" | "unconfigured";
  label: string;
  detail: string;
};

export function getPlanSituation(workspace: PlanWorkspace | null | undefined, today = dateInBrazil()) : PlanSituation {
  if (workspace?.status === "archived") return { kind: "archived", label: "Plano encerrado", detail: "Histórico preservado" };
  if (workspace?.plan_paused_at) return { kind: "paused", label: "Plano pausado", detail: "Acesso bloqueado até a retomada" };
  if (!workspace?.next_payment_due_on) return { kind: "unconfigured", label: "Sem vencimento", detail: "Defina a próxima cobrança" };
  const days = differenceInCalendarDays(workspace.next_payment_due_on, today);
  if (days < 0) return { kind: "overdue", label: `${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"} em atraso`, detail: `Venceu em ${formatDate(workspace.next_payment_due_on)}` };
  if (days === 0) return { kind: "due_soon", label: "Vence hoje", detail: formatDate(workspace.next_payment_due_on) };
  if (days <= 7) return { kind: "due_soon", label: `Vence em ${days} dia${days === 1 ? "" : "s"}`, detail: formatDate(workspace.next_payment_due_on) };
  return { kind: "current", label: "Em dia", detail: `Próximo: ${formatDate(workspace.next_payment_due_on)}` };
}

export function dateInBrazil(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Não registrado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

export function formatMoney(value: number | string | null | undefined) {
  if (value == null || value === "") return "Não informado";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function differenceInCalendarDays(first: string, second: string) {
  const firstDate = Date.parse(`${first}T12:00:00Z`);
  const secondDate = Date.parse(`${second}T12:00:00Z`);
  return Math.round((firstDate - secondDate) / 86_400_000);
}
