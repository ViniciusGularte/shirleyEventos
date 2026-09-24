import { requireStudentWorkspace } from "@/lib/auth/guards";
import { getEvent } from "@/features/events/queries";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/currency";
import { calculateEventExpenses, calculateEventOutstanding, calculateEventReceived, calculateEventExpectedResult } from "@/lib/finance/calculations";

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const event: any = await getEvent(supabase, workspaceId, eventId);
  const transactions = event.event_fin_transactions ?? [];
  const received = calculateEventReceived(event.id, transactions);
  const expenses = calculateEventExpenses(event.id, transactions);

  return (
    <div className="grid gap-6">
      <PageHeader title={event.title || event.event_fin_clients?.name} subtitle={`${event.service_name_snapshot} • ${event.event_date ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString("pt-BR", { dateStyle: "long" }) : "Sem data"}`} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard label="Valor vendido" value={formatCurrency(event.sale_amount)} />
        <MetricCard label="Recebido" value={formatCurrency(received)} />
        <MetricCard label="A receber" value={formatCurrency(calculateEventOutstanding(event.sale_amount, received))} />
        <MetricCard label="Custos" value={formatCurrency(expenses)} />
        <MetricCard label="Resultado previsto" value={formatCurrency(calculateEventExpectedResult(event.sale_amount, expenses))} />
      </section>
      <Card><h2 className="font-extrabold">Recebimentos</h2><Rows rows={transactions.filter((item: any) => item.type === "income")} /></Card>
      <Card><h2 className="font-extrabold">Custos do evento</h2><Rows rows={transactions.filter((item: any) => item.type === "expense")} /></Card>
      <Card><h2 className="font-extrabold">Cliente</h2><p className="mt-2 text-sm text-event-ink/65">{event.event_fin_clients?.name}</p></Card>
    </div>
  );
}

function Rows({ rows }: { rows: any[] }) {
  if (rows.length === 0) return <p className="mt-3 text-sm text-event-ink/55">Nenhuma movimentação neste período.</p>;
  return <div className="mt-3 grid gap-2">{rows.map((row) => <div className="flex justify-between text-sm" key={row.id}><span>{new Date(`${row.occurred_at}T00:00:00`).toLocaleDateString("pt-BR")} • {row.description ?? "Lançamento"}</span><strong>{formatCurrency(row.amount)}</strong></div>)}</div>;
}
