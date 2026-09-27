"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { parseMoney } from "@/lib/finance/currency";
import { errorState, validationState, type ActionState } from "@/lib/actions/state";

const transactionSchema = z.object({
  amount: z.number({ invalid_type_error: "Informe um valor válido." }).positive("O valor deve ser maior que zero."),
  occurred_at: z.string().min(10, "Informe a data da movimentação."),
  event_id: z.string().uuid().optional().nullable(),
  wallet_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  payment_method: z.enum(["pix", "cash", "credit_card", "debit_card", "bank_transfer", "other"]).optional().nullable(),
  description: z.string().optional()
});

export async function createIncome(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const parsed = transactionSchema.safeParse({
    amount: parseMoney(formData.get("amount")),
    occurred_at: formData.get("occurred_at"),
    event_id: formData.get("event_id") || null,
    wallet_id: formData.get("wallet_id") || null,
    payment_method: formData.get("payment_method") || "pix",
    description: formData.get("description") || undefined
  });
  if (!parsed.success) return validationState(parsed.error);
  const { error } = await supabase.from("event_fin_transactions").insert({ ...parsed.data, workspace_id: workspaceId, type: "income" });
  if (error) return errorState("Não foi possível salvar o recebimento. Confira os dados e tente novamente.");
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
  redirect("/app/financeiro?salvo=recebimento");
}

export async function createExpense(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const parsed = transactionSchema.extend({ category_id: z.string().uuid("Selecione uma categoria.") }).safeParse({
    amount: parseMoney(formData.get("amount")),
    occurred_at: formData.get("occurred_at"),
    event_id: formData.get("event_id") || null,
    wallet_id: formData.get("wallet_id") || null,
    category_id: formData.get("category_id"),
    description: formData.get("description") || undefined
  });
  if (!parsed.success) return validationState(parsed.error);
  const { error } = await supabase.from("event_fin_transactions").insert({ ...parsed.data, workspace_id: workspaceId, type: "expense" });
  if (error) return errorState("Não foi possível salvar a despesa. Confira os dados e tente novamente.");
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
  redirect("/app/financeiro?salvo=despesa");
}

export async function deleteTransaction(transactionId: string) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const { error } = await supabase.from("event_fin_transactions").delete().eq("workspace_id", workspaceId).eq("id", transactionId);
  if (error) throw new Error("Não foi possível excluir movimentação.");
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
}

export async function createWallet(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const parsed = z.object({
    name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres."),
    type: z.enum(["cash", "bank", "digital", "other"]),
    opening_balance: z.number({ invalid_type_error: "Informe um saldo inicial válido." })
  }).safeParse({
    name: formData.get("name"),
    type: formData.get("type") || "cash",
    opening_balance: parseMoney(formData.get("opening_balance"))
  });
  if (!parsed.success) return validationState(parsed.error);
  const { error } = await supabase.from("event_fin_wallets").insert({ ...parsed.data, workspace_id: workspaceId });
  if (error) return errorState("Não foi possível criar a conta. Use outro nome ou tente novamente.");
  revalidatePath("/app/financeiro");
  redirect("/app/financeiro?salvo=conta");
}

export async function updateAllocationRules(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const names = formData.getAll("name").map((value) => String(value).trim());
  const percentages = formData.getAll("percentage").map((value) => Number(value));
  if (names.some((name) => name.length < 2)) return { status: "error", message: "Dê um nome para cada destino da distribuição.", fieldErrors: { name: ["Use pelo menos 2 caracteres."] } };
  if (percentages.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) return { status: "error", message: "Revise os percentuais destacados.", fieldErrors: { percentage: ["Use um valor entre 0 e 100."] } };
  const total = percentages.reduce((sum, value) => sum + value, 0);
  if (total > 100) return { status: "error", message: `A soma atual é ${total.toLocaleString("pt-BR")}% e não pode passar de 100%.`, fieldErrors: { percentage: ["Reduza os percentuais para somar no máximo 100%."] } };

  const effectiveFrom = new Date();
  effectiveFrom.setDate(1);
  const { data: set, error } = await supabase
    .from("event_fin_allocation_sets")
    .insert({ workspace_id: workspaceId, effective_from: effectiveFrom.toISOString().slice(0, 10) })
    .select("id")
    .single();
  if (error) return errorState("Não foi possível salvar a distribuição. Tente novamente.");

  const { error: itemsError } = await supabase.from("event_fin_allocation_items").insert(
    names.map((name, index) => ({
      allocation_set_id: set.id,
      name,
      percentage: percentages[index],
      sort_order: index
    }))
  );
  if (itemsError) return errorState("A distribuição foi iniciada, mas os percentuais não foram salvos. Tente novamente.");
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
  redirect("/app/financeiro?salvo=distribuicao");
}
