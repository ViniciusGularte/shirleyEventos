import Link from "next/link";
import { Plus } from "lucide-react";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { listEvents, getEventFinancials } from "@/features/events/queries";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCurrency } from "@/lib/finance/currency";

export default async function EventsPage() {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const [events, financials] = await Promise.all([listEvents(supabase, workspaceId), getEventFinancials(supabase, workspaceId)]);
  const byId = new Map(financials.map((item) => [item.event_id, item]));

  return (
    <div className="grid gap-6">
      <PageHeader title="Eventos" subtitle="Acompanhe vendas, clientes, recebimentos e resultado." action={<Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-event-ink px-5 text-sm font-bold text-event-paper transition hover:bg-event-rose" href="/app/eventos/novo"><Plus size={18} /> Novo evento</Link>} />
      {events.length === 0 ? (
        <EmptyState title="Nenhum evento cadastrado." action={<Link className="focus-ring rounded-[18px] bg-event-ink px-5 py-3 text-sm font-bold text-event-paper" href="/app/eventos/novo">Novo evento</Link>}>
          Cadastre sua primeira venda para acompanhar recebimentos, custos e resultado.
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {events.map((event: any) => {
            const fin = byId.get(event.id);
            return (
              <Link className="focus-ring block rounded-[22px]" href={`/app/eventos/${event.id}`} key={event.id}>
                <Card className="grid gap-4 transition hover:-translate-y-0.5 hover:border-event-rose/30 hover:shadow-event xl:grid-cols-[minmax(180px,1fr)_repeat(4,minmax(100px,130px))_110px] xl:items-center">
                  <div>
                    <h2 className="font-extrabold">{event.title || event.event_fin_clients?.name}</h2>
                    <p className="text-sm text-event-ink/58">{event.service_name_snapshot}</p>
                    <p className="mt-2 text-sm text-event-ink/58">{formatEventSchedule(event.event_date, event.event_time, event.notes)}</p>
                  </div>
                  <Amount label="Vendido" value={event.sale_amount} />
                  <Amount label="Recebido" value={fin?.received_amount ?? 0} />
                  <Amount label="A receber" value={fin?.outstanding_amount ?? 0} />
                  <Amount label="Resultado" value={fin?.expected_result ?? event.sale_amount} />
                  <StatusPill status={event.status} />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatEventSchedule(date?: string | null, time?: string | null, notes?: string | null) {
  if (!date) return "Sem data";
  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
  const storedTime = time?.slice(0, 5) ?? notes?.match(/(?:^|\n)Horário do evento: ([0-2]\d:[0-5]\d)/)?.[1];
  return storedTime ? `${formattedDate} às ${storedTime}` : formattedDate;
}

function Amount({ label, value }: { label: string; value: number }) {
  return <div><p className="text-xs text-event-ink/50">{label}</p><strong className="text-sm">{formatCurrency(value)}</strong></div>;
}
