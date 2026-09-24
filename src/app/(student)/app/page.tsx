import { format } from "date-fns";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { defaultPeriod, getDashboardMetrics, getMonthlySeries } from "@/features/dashboard/queries";
import { formatCurrency } from "@/lib/finance/currency";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { MovementChart, EventsChart } from "@/components/charts/dashboard-charts";
import { EmptyState } from "@/components/ui/empty-state";
import { getAllocationRules } from "@/features/finance/queries";
import { calculateAllocation } from "@/lib/finance/calculations";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const { supabase, profile, workspaceId } = await requireStudentWorkspace();
  const period = defaultPeriod();
  const metrics = await getDashboardMetrics(supabase, workspaceId, period.startDate, period.endDate);
  const series = await getMonthlySeries(supabase, workspaceId, 6);
  const allocationSet = await getAllocationRules(supabase, workspaceId).catch(() => null);
  const allocation = calculateAllocation(metrics.cash_result, (allocationSet?.event_fin_allocation_items ?? []) as any);
  const firstName = profile.full_name.split(" ")[0];

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`Olá, ${firstName}`}
        subtitle="Visão geral do seu financeiro"
        action={<Link className="inline-flex min-h-12 items-center gap-2 rounded-[18px] bg-event-ink px-5 text-sm font-extrabold text-event-paper transition hover:bg-event-rose" href="/app/eventos/novo"><Plus size={18} /> Novo lançamento</Link>}
      />
      {metrics.event_count === 0 ? (
        <EmptyState title="Seu financeiro começa pelo primeiro evento." action={<Link className="rounded-[18px] bg-event-ink px-5 py-3 text-sm font-bold text-event-paper" href="/app/eventos/novo">+ Cadastrar primeiro evento</Link>}>
          Cadastre uma venda para acompanhar recebimentos, custos e resultado.
        </EmptyState>
      ) : null}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Vendido" value={formatCurrency(metrics.sold)} hint={period.label} />
        <MetricCard label="Recebido" value={formatCurrency(metrics.received)} hint={period.label} />
        <MetricCard label="A receber" value={formatCurrency(metrics.outstanding)} hint={period.label} />
        <MetricCard label="Resultado" value={formatCurrency(metrics.cash_result)} hint="Recebido - despesas" />
        <MetricCard label="Eventos" value={String(metrics.event_count)} hint={`${metrics.completed_event_count} realizados`} />
        <MetricCard label="Ticket médio" value={formatCurrency(metrics.average_ticket)} hint={format(new Date(), "MM/yyyy")} />
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
        <MovementChart data={series} />
        <EventsChart data={series} />
      </section>
      <Card>
        <h2 className="text-lg font-extrabold">Como distribuir seu resultado</h2>
        <p className="mt-2 text-sm text-event-ink/60">Resultado disponível: {formatCurrency(allocation.base)}</p>
        <div className="mt-5 grid gap-3">
          {allocation.items.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex justify-between text-sm"><span>{item.name}</span><strong>{formatCurrency(item.amount)}</strong></div>
              <div className="h-2 rounded-full bg-event-ink/8"><div className="h-2 rounded-full bg-event-rose" style={{ width: `${item.percentage}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
