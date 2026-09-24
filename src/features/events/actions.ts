"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { parseMoney } from "@/lib/finance/currency";

const eventSchema = z.object({
  client_id: z.string().uuid(),
  service_id: z.string().uuid().optional().nullable(),
  service_name_snapshot: z.string().min(2),
  title: z.string().optional(),
  sale_date: z.string().min(10),
  event_date: z.string().optional().nullable(),
  sale_amount: z.number().min(0),
  received_now: z.number().min(0).default(0),
  initial_cost: z.number().min(0).default(0),
  wallet_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional()
});

export async function createEvent(formData: FormData) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const input = eventSchema.parse({
    client_id: formData.get("client_id"),
    service_id: formData.get("service_id") || null,
    service_name_snapshot: formData.get("service_name_snapshot"),
    title: formData.get("title") || undefined,
    sale_date: formData.get("sale_date"),
    event_date: formData.get("event_date") || null,
    sale_amount: parseMoney(formData.get("sale_amount")),
    received_now: parseMoney(formData.get("received_now")),
    initial_cost: parseMoney(formData.get("initial_cost")),
    wallet_id: formData.get("wallet_id") || null,
    notes: formData.get("notes") || undefined
  });

  const { data: event, error } = await supabase
    .from("event_fin_events")
    .insert({ ...input, workspace_id: workspaceId })
    .select("id")
    .single();
  if (error) throw new Error("Não foi possível criar o evento.");

  if (input.received_now > 0) {
    const { error: incomeError } = await supabase.from("event_fin_transactions").insert({
      workspace_id: workspaceId,
      type: "income",
      event_id: event.id,
      wallet_id: input.wallet_id,
      amount: input.received_now,
      occurred_at: input.sale_date,
      payment_method: "pix",
      description: "Recebimento inicial"
    });
    if (incomeError) throw new Error("Evento criado, mas falhou ao criar recebimento inicial.");
  }

  if (input.initial_cost > 0) {
    const { data: category } = await supabase
      .from("event_fin_categories")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("name", "Equipe")
      .maybeSingle();
    const { error: expenseError } = await supabase.from("event_fin_transactions").insert({
      workspace_id: workspaceId,
      type: "expense",
      event_id: event.id,
      wallet_id: input.wallet_id,
      category_id: category?.id,
      amount: input.initial_cost,
      occurred_at: input.sale_date,
      description: "Custo de equipe inicial"
    });
    if (expenseError) throw new Error("Evento criado, mas falhou ao criar custo inicial.");
  }

  revalidatePath("/app/eventos");
  revalidatePath("/app");
}

export async function markEventCompleted(eventId: string) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const { error } = await supabase.from("event_fin_events").update({ status: "completed" }).eq("workspace_id", workspaceId).eq("id", eventId);
  if (error) throw new Error("Não foi possível completar o evento.");
  revalidatePath("/app/eventos");
}

export async function cancelEvent(eventId: string) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const { error } = await supabase
    .from("event_fin_events")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", eventId);
  if (error) throw new Error("Não foi possível cancelar o evento.");
  revalidatePath("/app/eventos");
}
