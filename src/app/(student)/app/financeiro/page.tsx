import { createExpense, createIncome, createWallet, updateAllocationRules } from "@/features/finance/actions";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { listTransactions, listWallets, getAllocationRules } from "@/features/finance/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SubmitButton } from "@/components/ui/simple-form";
import { formatCurrency } from "@/lib/finance/currency";
import { calculateWalletBalance } from "@/lib/finance/calculations";

export default async function FinancePage() {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const [transactions, wallets, allocationSet, { data: categories }] = await Promise.all([
    listTransactions(supabase, workspaceId),
    listWallets(supabase, workspaceId),
    getAllocationRules(supabase, workspaceId).catch(() => null),
    supabase.from("event_fin_categories").select("*").eq("workspace_id", workspaceId).eq("is_active", true).order("sort_order")
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader title="Financeiro" subtitle="Movimentações, contas e distribuição do resultado." />
      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-extrabold">Recebimento</h2>
          <form action={createIncome} className="mt-4 grid gap-3">
            <Field label="Valor" name="amount" required />
            <Field label="Data" name="occurred_at" type="date" required />
            <Field label="Descrição" name="description" />
            <SubmitButton>Adicionar recebimento</SubmitButton>
          </form>
        </Card>
        <Card>
          <h2 className="text-lg font-extrabold">Despesa</h2>
          <form action={createExpense} className="mt-4 grid gap-3">
            <Field label="Valor" name="amount" required />
            <Field label="Data" name="occurred_at" type="date" required />
            <Field label="Categoria" name="category_id" required>
              <select className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4" name="category_id" required>
                <option value="">Selecione</option>
                {categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </Field>
            <Field label="Descrição" name="description" />
            <SubmitButton>Adicionar despesa</SubmitButton>
          </form>
        </Card>
      </section>
      <Card>
        <h2 className="text-lg font-extrabold">Movimentações</h2>
        {transactions.length === 0 ? <EmptyState title="Nenhuma movimentação neste período.">Entradas e despesas aparecem aqui.</EmptyState> : (
          <div className="mt-4 grid gap-2">
            {transactions.map((item: any) => <div key={item.id} className="flex items-center justify-between rounded-[16px] border border-event-ink/8 bg-event-paper/60 p-3 text-sm"><span>{item.description || (item.type === "income" ? "Recebimento" : "Despesa")}</span><strong>{item.type === "expense" ? "-" : ""}{formatCurrency(item.amount)}</strong></div>)}
          </div>
        )}
      </Card>
      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-extrabold">Contas</h2>
          <form action={createWallet} className="mt-4 grid gap-3 md:grid-cols-[1fr_130px_150px_auto] md:items-end">
            <Field label="Nome" name="name" required />
            <Field label="Tipo" name="type"><select className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4" name="type"><option value="cash">Caixa</option><option value="bank">Banco</option><option value="digital">Digital</option><option value="other">Outro</option></select></Field>
            <Field label="Saldo inicial" name="opening_balance" />
            <SubmitButton>Criar</SubmitButton>
          </form>
          <div className="mt-4 grid gap-2">
            {wallets.map((wallet: any) => <div key={wallet.id} className="flex justify-between rounded-[16px] bg-event-paper/70 p-3 text-sm"><span>{wallet.name}</span><strong>{formatCurrency(calculateWalletBalance(wallet, wallet.event_fin_transactions ?? []))}</strong></div>)}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-extrabold">Distribuição</h2>
          <form action={updateAllocationRules} className="mt-4 grid gap-3">
            {((allocationSet as any)?.event_fin_allocation_items ?? []).map((item: any) => (
              <div key={item.id} className="grid grid-cols-[1fr_90px] gap-3">
                <input className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4" name="name" defaultValue={item.name} />
                <input className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4" name="percentage" type="number" step="0.01" defaultValue={item.percentage} />
              </div>
            ))}
            <SubmitButton>Salvar percentuais</SubmitButton>
          </form>
        </Card>
      </section>
    </div>
  );
}
