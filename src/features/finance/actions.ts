"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { parseMoney } from "@/lib/finance/currency";

const transactionSchema = z.object({
  amount: z.number().positive(),
  occurred_at: z.string().min(10),
  event_id: z.string().uuid().optional().nullable(),
  wallet_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  payment_method: z.enum(["pix", "cash", "credit_card", "debit_card", "bank_transfer", "other"]).optional().nullable(),
  description: z.string().optional()
});

export async function createIncome(formData: FormData) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const input = transactionSchema.parse({
    amount: parseMoney(formData.get("amount")),
    occurred_at: formData.get("occurred_at"),
    event_id: formData.get("event_id") || null,
    wallet_id: formData.get("wallet_id") || null,
    payment_method: formData.get("payment_method") || "pix",
    description: formData.get("description") || undefined
  });
  const { error } = await supabase.from("event_fin_transactions").insert({ ...input, workspace_id: workspaceId, type: "income" });
  if (error) throw new Error("Não foi possível salvar recebimento.");
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
}

export async function createExpense(formData: FormData) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const input = transactionSchema.extend({ category_id: z.string().uuid() }).parse({
    amount: parseMoney(formData.get("amount")),
    occurred_at: formData.get("occurred_at"),
    event_id: formData.get("event_id") || null,
    wallet_id: formData.get("wallet_id") || null,
    category_id: formData.get("category_id"),
    description: formData.get("description") || undefined
  });
  const { error } = await supabase.from("event_fin_transactions").insert({ ...input, workspace_id: workspaceId, type: "expense" });
  if (error) throw new Error("Não foi possível salvar despesa.");
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
}

export async function deleteTransaction(transactionId: string) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const { error } = await supabase.from("event_fin_transactions").delete().eq("workspace_id", workspaceId).eq("id", transactionId);
  if (error) throw new Error("Não foi possível excluir movimentação.");
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
}

export async function createWallet(formData: FormData) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const input = z.object({
    name: z.string().min(2),
    type: z.enum(["cash", "bank", "digital", "other"]),
    opening_balance: z.number()
  }).parse({
    name: formData.get("name"),
    type: formData.get("type") || "cash",
    opening_balance: parseMoney(formData.get("opening_balance"))
  });
  const { error } = await supabase.from("event_fin_wallets").insert({ ...input, workspace_id: workspaceId });
  if (error) throw new Error("Não foi possível criar conta.");
  revalidatePath("/app/financeiro");
}

export async function updateAllocationRules(formData: FormData) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const names = formData.getAll("name").map(String);
  const percentages = formData.getAll("percentage").map((value) => Number(value));
  const total = percentages.reduce((sum, value) => sum + value, 0);
  if (total > 100) throw new Error("A soma não pode passar de 100%.");

  const effectiveFrom = new Date();
  effectiveFrom.setDate(1);
  const { data: set, error } = await supabase
    .from("event_fin_allocation_sets")
    .insert({ workspace_id: workspaceId, effective_from: effectiveFrom.toISOString().slice(0, 10) })
    .select("id")
    .single();
  if (error) throw new Error("Não foi possível salvar distribuição.");

  const { error: itemsError } = await supabase.from("event_fin_allocation_items").insert(
    names.map((name, index) => ({
      allocation_set_id: set.id,
      name,
      percentage: percentages[index],
      sort_order: index
    }))
  );
  if (itemsError) throw new Error("Não foi possível salvar itens da distribuição.");
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
}
