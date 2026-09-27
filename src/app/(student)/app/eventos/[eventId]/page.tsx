import { requireStudentWorkspace } from "@/lib/auth/guards";
import { getEvent } from "@/features/events/queries";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/currency";
import { calculateEventExpenses, calculateEventOutstanding, calculateEventReceived, calculateEventExpectedResult } from "@/lib/finance/calculations";
import { cancelEvent, markEventCompleted } from "@/features/events/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FlashMessage } from "@/components/ui/flash-message";
import { StatusPill } from "@/components/ui/status-pill";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/simple-form";

export default async function EventDetailPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ criado?: string; status?: string; aviso?: string }> }) {
  const { eventId } = await params;
  const query = await searchParams;
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const event: any = await getEvent(supabase, workspaceId, eventId);
  const transactions = event.event_fin_transactions ?? [];
  const received = calculateEventReceived(event.id, transactions);
  const expenses = calculateEventExpenses(event.id, transactions);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={event.title || event.event_fin_clients?.name}
        subtitle={`${event.service_name_snapshot} • ${event.event_date ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString("pt-BR", { dateStyle: "long" }) : "Sem data"}`}
        action={<Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-event-ink/10 px-4 text-sm font-bold hover:border-event-rose/40" href="/app/eventos"><ArrowLeft size={18} /> Voltar aos eventos</Link>}
      />
      {query.criado === "1" ? <FlashMessage>Evento criado com sucesso.</FlashMessage> : null}
      {query.status === "concluido" ? <FlashMessage>Evento marcado como realizado.</FlashMessage> : null}
      {query.status === "cancelado" ? <FlashMessage>Evento cancelado.</FlashMessage> : null}
      {query.aviso === "recebimento" ? <FlashMessage variant="warning">O evento foi criado, mas o recebimento inicial não foi registrado. Adicione-o na tela Financeiro.</FlashMessage> : null}
      {query.aviso === "custo" ? <FlashMessage variant="warning">O evento foi criado, mas o custo inicial não foi registrado. Adicione-o na tela Financeiro.</FlashMessage> : null}
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-event-ink/50">Status do evento</p><StatusPill status={event.status} /></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {event.status !== "completed" && event.status !== "cancelled" ? (
            <ActionForm action={markEventCompleted.bind(null, eventId)}><SubmitButton className="w-full sm:w-auto" pendingLabel="Concluindo..." variant="secondary"><CheckCircle2 size={18} /> Marcar como realizado</SubmitButton></ActionForm>
          ) : null}
          {event.status !== "cancelled" ? (
            <ActionForm action={cancelEvent.bind(null, eventId)}><ConfirmSubmitButton className="w-full border-red-200 text-red-700 hover:border-red-400 sm:w-auto" variant="secondary" message="Cancelar este evento? O status será alterado para cancelado.">Cancelar evento</ConfirmSubmitButton></ActionForm>
          ) : null}
        </div>
      </Card>
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
  return <div className="mt-3 grid gap-2">{rows.map((row) => <div className="flex flex-col gap-1 rounded-xl bg-event-paper/70 p-3 text-sm sm:flex-row sm:items-center sm:justify-between" key={row.id}><span className="break-words">{new Date(`${row.occurred_at}T00:00:00`).toLocaleDateString("pt-BR")} • {row.description ?? "Lançamento"}</span><strong className="shrink-0 tabular-nums">{formatCurrency(row.amount)}</strong></div>)}</div>;
}
