import { createEvent } from "@/features/events/actions";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { listClients } from "@/features/clients/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Field, SelectField, SubmitButton } from "@/components/ui/simple-form";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { DatePickerField } from "@/components/ui/date-picker-field";

export default async function NewEventPage() {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const [{ data: services }, { data: wallets }, clients] = await Promise.all([
    supabase.from("event_fin_services").select("*").eq("workspace_id", workspaceId).eq("is_active", true).order("name"),
    supabase.from("event_fin_wallets").select("*").eq("workspace_id", workspaceId).eq("is_active", true).order("name"),
    listClients(supabase, workspaceId)
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Novo evento"
        subtitle="Lance venda, recebimento inicial e custo em uma única tela. Campos com * são obrigatórios."
        action={<Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-event-ink/10 px-4 text-sm font-bold hover:border-event-rose/40" href="/app/eventos"><ArrowLeft size={18} /> Voltar aos eventos</Link>}
      />
      {clients.length === 0 ? (
        <Card className="flex flex-col items-start gap-3 border-event-rose/20 bg-event-rose/5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-extrabold">Cadastre um cliente primeiro</h2><p className="mt-1 text-sm text-event-ink/65">Todo evento precisa estar relacionado a um cliente.</p></div>
          <Link className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-event-ink px-5 text-sm font-bold text-event-paper sm:w-auto" href="/app/clientes"><Users size={18} /> Ir para clientes</Link>
        </Card>
      ) : null}
      <Card>
        <ActionForm action={createEvent} className="grid gap-4 md:grid-cols-2">
          <SelectField label="Cliente" name="client_id" required disabled={clients.length === 0}>
              <option value="">Selecione</option>
              {clients.map((client: any) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </SelectField>
          <SelectField label="Serviço" name="service_id" required>
              <option value="">Selecione</option>
              {services?.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </SelectField>
          <Field label="Título" name="title" />
          <DatePickerField label="Data da venda" name="sale_date" required />
          <DatePickerField label="Data e horário do evento" name="event_date" timeName="event_time" />
          <Field label="Valor vendido" name="sale_amount" inputMode="decimal" placeholder="0,00" required />
          <Field label="Recebido agora" name="received_now" inputMode="decimal" placeholder="0,00" />
          <Field label="Custo de equipe inicial" name="initial_cost" inputMode="decimal" placeholder="0,00" />
          <SelectField label="Conta" name="wallet_id">
              <option value="">Sem conta</option>
              {wallets?.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
          </SelectField>
          <label className="grid gap-2 text-sm font-bold text-event-ink/72 md:col-span-2">Observações<textarea className="focus-ring min-h-28 w-full rounded-[16px] border border-event-ink/15 bg-event-paper p-4 text-base sm:text-sm" name="notes" /></label>
          <div className="md:col-span-2"><SubmitButton>Salvar evento</SubmitButton></div>
        </ActionForm>
      </Card>
    </div>
  );
}
