import { createEvent } from "@/features/events/actions";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { listClients } from "@/features/clients/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Field, SubmitButton } from "@/components/ui/simple-form";

export default async function NewEventPage() {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const [{ data: services }, { data: wallets }, clients] = await Promise.all([
    supabase.from("event_fin_services").select("*").eq("workspace_id", workspaceId).eq("is_active", true).order("name"),
    supabase.from("event_fin_wallets").select("*").eq("workspace_id", workspaceId).eq("is_active", true).order("name"),
    listClients(supabase, workspaceId)
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader title="Novo evento" subtitle="Lance venda, recebimento inicial e custo em uma única tela." />
      <Card>
        <form action={createEvent} className="grid gap-4 md:grid-cols-2">
          <Field label="Cliente" name="client_id" required>
            <select className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4" name="client_id" required>
              <option value="">Selecione</option>
              {clients.map((client: any) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </Field>
          <Field label="Serviço" name="service_name_snapshot" required>
            <select className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4" name="service_name_snapshot" required>
              <option value="">Selecione</option>
              {services?.map((service) => <option key={service.id} value={service.name}>{service.name}</option>)}
            </select>
          </Field>
          <Field label="Título" name="title" />
          <Field label="Data da venda" name="sale_date" type="date" required />
          <Field label="Data do evento" name="event_date" type="date" />
          <Field label="Valor vendido" name="sale_amount" required />
          <Field label="Recebido agora" name="received_now" />
          <Field label="Custo de equipe inicial" name="initial_cost" />
          <Field label="Conta" name="wallet_id">
            <select className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4" name="wallet_id">
              <option value="">Sem conta</option>
              {wallets?.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
            </select>
          </Field>
          <label className="grid gap-2 text-sm font-bold text-event-ink/72 md:col-span-2">Observações<textarea className="focus-ring min-h-28 rounded-[16px] border border-event-ink/10 bg-event-paper p-4" name="notes" /></label>
          <div className="md:col-span-2"><SubmitButton>Salvar evento</SubmitButton></div>
        </form>
      </Card>
    </div>
  );
}
