import { createExpense, createIncome, createWallet, updateAllocationRules } from "@/features/finance/actions";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { listTransactions, listWallets, getAllocationRules } from "@/features/finance/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SubmitButton } from "@/components/ui/simple-form";
import { formatCurrency } from "@/lib/finance/currency";
import { calculateWalletBalance } from "@/lib/finance/calculations";
import { listEvents } from "@/features/events/queries";
import { FlashMessage } from "@/components/ui/flash-message";
import { ActionForm, FieldError } from "@/components/ui/action-form";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ salvo?: string }> }) {
  const params = await searchParams;
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const [transactions, wallets, events, allocationSet, { data: categories }] = await Promise.all([
    listTransactions(supabase, workspaceId),
    listWallets(supabase, workspaceId),
    listEvents(supabase, workspaceId),
    getAllocationRules(supabase, workspaceId).catch(() => null),
    supabase.from("event_fin_categories").select("*").eq("workspace_id", workspaceId).eq("is_active", true).order("sort_order")
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader title="Financeiro" subtitle="Movimentações, contas e distribuição do resultado." />
      {params.salvo ? <FlashMessage>{successMessage(params.salvo)}</FlashMessage> : null}
      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-extrabold">Recebimento</h2>
          <p className="mt-1 text-sm text-event-ink/60">Registre uma entrada e, se quiser, relacione-a a um evento e uma conta.</p>
          <ActionForm action={createIncome} className="mt-4 grid gap-3">
            <Field label="Valor" name="amount" inputMode="decimal" placeholder="0,00" required />
            <Field label="Data" name="occurred_at" type="date" required />
            <Field label="Evento" name="event_id">
              <select className={selectClass} name="event_id"><option value="">Sem evento</option>{events.map((event: any) => <option key={event.id} value={event.id}>{event.title || event.event_fin_clients?.name || event.service_name_snapshot}</option>)}</select>
            </Field>
            <Field label="Conta" name="wallet_id">
              <select className={selectClass} name="wallet_id"><option value="">Sem conta</option>{wallets.map((wallet: any) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select>
            </Field>
            <Field label="Forma de pagamento" name="payment_method">
              <select className={selectClass} name="payment_method" defaultValue="pix"><option value="pix">Pix</option><option value="cash">Dinheiro</option><option value="credit_card">Cartão de crédito</option><option value="debit_card">Cartão de débito</option><option value="bank_transfer">Transferência</option><option value="other">Outro</option></select>
            </Field>
            <Field label="Descrição" name="description" />
            <SubmitButton>Adicionar recebimento</SubmitButton>
          </ActionForm>
        </Card>
        <Card>
          <h2 className="text-lg font-extrabold">Despesa</h2>
          <p className="mt-1 text-sm text-event-ink/60">Classifique o custo para manter o resultado e o histórico organizados.</p>
          <ActionForm action={createExpense} className="mt-4 grid gap-3">
            <Field label="Valor" name="amount" inputMode="decimal" placeholder="0,00" required />
            <Field label="Data" name="occurred_at" type="date" required />
            <Field label="Categoria" name="category_id" required>
              <select className={selectClass} name="category_id" required>
                <option value="">Selecione</option>
                {categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </Field>
            <Field label="Evento" name="event_id">
              <select className={selectClass} name="event_id"><option value="">Sem evento</option>{events.map((event: any) => <option key={event.id} value={event.id}>{event.title || event.event_fin_clients?.name || event.service_name_snapshot}</option>)}</select>
            </Field>
            <Field label="Conta" name="wallet_id">
              <select className={selectClass} name="wallet_id"><option value="">Sem conta</option>{wallets.map((wallet: any) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select>
            </Field>
            <Field label="Descrição" name="description" />
            <SubmitButton>Adicionar despesa</SubmitButton>
          </ActionForm>
        </Card>
      </section>
      <Card>
        <h2 className="text-lg font-extrabold">Movimentações</h2>
        {transactions.length === 0 ? <EmptyState title="Nenhuma movimentação neste período.">Entradas e despesas aparecem aqui.</EmptyState> : (
          <div className="mt-4 grid gap-2">
            {transactions.map((item: any) => <div key={item.id} className="flex flex-col gap-2 rounded-[16px] border border-event-ink/8 bg-event-paper/60 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words font-bold">{item.description || (item.type === "income" ? "Recebimento" : "Despesa")}</p><p className="mt-1 text-xs text-event-ink/55">{new Date(`${item.occurred_at}T00:00:00`).toLocaleDateString("pt-BR")}{item.event_fin_events ? ` • ${item.event_fin_events.title || item.event_fin_events.service_name_snapshot}` : ""}{item.event_fin_wallets?.name ? ` • ${item.event_fin_wallets.name}` : ""}</p></div><strong className={item.type === "expense" ? "shrink-0 tabular-nums text-red-700" : "shrink-0 tabular-nums text-emerald-700"}>{item.type === "expense" ? "-" : "+"}{formatCurrency(item.amount)}</strong></div>)}
          </div>
        )}
      </Card>
      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-extrabold">Contas</h2>
          <p className="mt-1 text-sm text-event-ink/60">Separe caixa, banco ou conta digital para acompanhar o saldo.</p>
          <ActionForm action={createWallet} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Nome" name="name" required />
            <Field label="Tipo" name="type"><select className={selectClass} name="type"><option value="cash">Caixa</option><option value="bank">Banco</option><option value="digital">Digital</option><option value="other">Outro</option></select></Field>
            <Field label="Saldo inicial" name="opening_balance" inputMode="decimal" placeholder="0,00" />
            <div className="self-end"><SubmitButton>Criar conta</SubmitButton></div>
          </ActionForm>
          <div className="mt-4 grid gap-2">
            {wallets.map((wallet: any) => <div key={wallet.id} className="flex justify-between rounded-[16px] bg-event-paper/70 p-3 text-sm"><span>{wallet.name}</span><strong>{formatCurrency(calculateWalletBalance(wallet, wallet.event_fin_transactions ?? []))}</strong></div>)}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-extrabold">Distribuição</h2>
          <p className="mt-1 text-sm text-event-ink/60">Defina como o resultado disponível será separado. A soma não pode passar de 100%.</p>
          <ActionForm action={updateAllocationRules} className="mt-4 grid gap-3">
            {((allocationSet as any)?.event_fin_allocation_items ?? []).map((item: any) => (
              <div key={item.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_88px] gap-3">
                <label className="sr-only" htmlFor={`allocation-name-${item.id}`}>Nome da distribuição</label>
                <input id={`allocation-name-${item.id}`} aria-label="Nome da distribuição" className="focus-ring min-h-12 min-w-0 rounded-[16px] border border-event-ink/15 bg-event-paper px-4 text-base sm:text-sm" name="name" defaultValue={item.name} />
                <label className="sr-only" htmlFor={`allocation-percentage-${item.id}`}>Percentual de {item.name}</label>
                <input id={`allocation-percentage-${item.id}`} aria-label={`Percentual de ${item.name}`} className="focus-ring min-h-12 min-w-0 rounded-[16px] border border-event-ink/15 bg-event-paper px-3 text-base sm:text-sm" name="percentage" type="number" inputMode="decimal" min="0" max="100" step="0.01" defaultValue={item.percentage} />
              </div>
            ))}
            <FieldError name="name" />
            <FieldError name="percentage" />
            <SubmitButton>Salvar percentuais</SubmitButton>
          </ActionForm>
        </Card>
      </section>
    </div>
  );
}

const selectClass = "focus-ring min-h-12 w-full rounded-[16px] border border-event-ink/15 bg-event-paper px-4 text-base text-event-ink aria-[invalid=true]:border-red-400 aria-[invalid=true]:bg-red-50 sm:text-sm";

function successMessage(type: string) {
  const messages: Record<string, string> = {
    recebimento: "Recebimento adicionado com sucesso.",
    despesa: "Despesa adicionada com sucesso.",
    conta: "Conta criada com sucesso.",
    distribuicao: "Percentuais de distribuição atualizados."
  };
  return messages[type] ?? "Alteração salva com sucesso.";
}
