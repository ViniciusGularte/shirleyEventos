import { createClient } from "@/features/clients/actions";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { listClients } from "@/features/clients/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SubmitButton } from "@/components/ui/simple-form";
import { formatCurrency } from "@/lib/finance/currency";

export default async function ClientsPage() {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const clients = await listClients(supabase, workspaceId);

  return (
    <div className="grid gap-6">
      <PageHeader title="Clientes" subtitle="Histórico simples de vendas por cliente." />
      <Card>
        <form action={createClient} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <Field label="Nome" name="name" required />
          <Field label="Telefone" name="phone" />
          <Field label="E-mail" name="email" type="email" />
          <SubmitButton>Novo cliente</SubmitButton>
        </form>
      </Card>
      {clients.length === 0 ? (
        <EmptyState title="Você ainda não cadastrou clientes.">Crie clientes para relacionar eventos, recebimentos e histórico vendido.</EmptyState>
      ) : (
        <div className="grid gap-3">
          {clients.map((client: any) => {
            const total = (client.event_fin_events ?? []).reduce((sum: number, event: any) => sum + Number(event.sale_amount), 0);
            const last = (client.event_fin_events ?? []).sort((a: any, b: any) => String(b.event_date).localeCompare(String(a.event_date)))[0];
            return (
              <Card key={client.id} className="grid gap-3 md:grid-cols-[1fr_140px_160px_160px] md:items-center">
                <div><h2 className="font-extrabold">{client.name}</h2><p className="text-sm text-event-ink/55">{client.phone || client.email || "Sem contato"}</p></div>
                <Small label="Eventos" value={String(client.event_fin_events?.length ?? 0)} />
                <Small label="Total vendido" value={formatCurrency(total)} />
                <Small label="Último evento" value={last?.event_date ? new Date(`${last.event_date}T00:00:00`).toLocaleDateString("pt-BR") : "-"} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Small({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-event-ink/50">{label}</p><strong className="text-sm">{value}</strong></div>;
}
