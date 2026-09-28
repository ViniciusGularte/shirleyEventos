"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { parseMoney } from "@/lib/finance/currency";
import { errorState, validationState, type ActionState } from "@/lib/actions/state";
import { splitEventInput } from "@/features/events/input";

const eventSchema = z.object({
  client_id: z.string().uuid("Selecione um cliente."),
  service_id: z.string().uuid("Selecione um serviço."),
  title: z.string().optional(),
  sale_date: z.string().min(10, "Informe a data da venda."),
  event_date: z.string().optional().nullable(),
  event_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido.").optional().nullable(),
  sale_amount: z.number({ invalid_type_error: "Informe um valor de venda válido." }).positive("O valor vendido deve ser maior que zero."),
  received_now: z.number({ invalid_type_error: "Informe um valor recebido válido." }).min(0, "O valor não pode ser negativo.").default(0),
  initial_cost: z.number({ invalid_type_error: "Informe um custo válido." }).min(0, "O custo não pode ser negativo.").default(0),
  wallet_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional()
});

export async function createEvent(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const parsed = eventSchema.safeParse({
    client_id: formData.get("client_id") ?? "",
    service_id: formData.get("service_id") ?? "",
    title: formData.get("title") || undefined,
    sale_date: formData.get("sale_date"),
    event_date: formData.get("event_date") || null,
    event_time: formData.get("event_time") || null,
    sale_amount: parseMoney(formData.get("sale_amount")),
    received_now: parseMoney(formData.get("received_now")),
    initial_cost: parseMoney(formData.get("initial_cost")),
    wallet_id: formData.get("wallet_id") || null,
    notes: formData.get("notes") || undefined
  });
  if (!parsed.success) return validationState(parsed.error);
  const input = parsed.data;

  const { data: service, error: serviceError } = await supabase
    .from("event_fin_services")
    .select("name")
    .eq("workspace_id", workspaceId)
    .eq("id", input.service_id)
    .eq("is_active", true)
    .maybeSingle();
  if (serviceError || !service) {
    return {
      status: "error",
      message: "Revise os campos destacados e tente novamente.",
      fieldErrors: { service_id: ["Selecione um serviço disponível."] }
    };
  }

  const { event: eventInput, finance } = splitEventInput(input);
  const { event_time: eventTime, ...eventWithoutTime } = eventInput;
  const eventRecord = {
    ...eventWithoutTime,
    ...(eventTime ? { event_time: eventTime } : {}),
    service_name_snapshot: service.name,
    workspace_id: workspaceId
  };

  let { data: event, error } = await supabase
    .from("event_fin_events")
    .insert(eventRecord)
    .select("id")
    .single();
  // Mantém o cadastro funcional durante a implantação da migration de horário.
  // O horário fica preservado nas observações e passa a usar a coluna dedicada
  // assim que a migration 013 estiver aplicada.
  if (error && eventTime && (error.code === "42703" || error.code === "PGRST204")) {
    const timeNote = `Horário do evento: ${eventTime}`;
    const fallbackRecord = {
      ...eventWithoutTime,
      notes: eventWithoutTime.notes ? `${eventWithoutTime.notes}\n${timeNote}` : timeNote,
      service_name_snapshot: service.name,
      workspace_id: workspaceId
    };
    ({ data: event, error } = await supabase.from("event_fin_events").insert(fallbackRecord).select("id").single());
  }
  if (error || !event) return errorState("Não foi possível criar o evento. Confira os dados e tente novamente.");

  if (finance.received_now > 0) {
    const { error: incomeError } = await supabase.from("event_fin_transactions").insert({
      workspace_id: workspaceId,
      type: "income",
      event_id: event.id,
      wallet_id: finance.wallet_id,
      amount: finance.received_now,
      occurred_at: input.sale_date,
      payment_method: "pix",
      description: "Recebimento inicial"
    });
    if (incomeError) redirect(`/app/eventos/${event.id}?aviso=recebimento`);
  }

  if (finance.initial_cost > 0) {
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
      wallet_id: finance.wallet_id,
      category_id: category?.id,
      amount: finance.initial_cost,
      occurred_at: input.sale_date,
      description: "Custo de equipe inicial"
    });
    if (expenseError) redirect(`/app/eventos/${event.id}?aviso=custo`);
  }

  revalidatePath("/app/eventos");
  revalidatePath("/app");
  redirect(`/app/eventos/${event.id}?criado=1`);
}

export async function markEventCompleted(eventId: string, _state: ActionState, _formData: FormData): Promise<ActionState> {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const { error } = await supabase.from("event_fin_events").update({ status: "completed" }).eq("workspace_id", workspaceId).eq("id", eventId);
  if (error) return errorState("Não foi possível concluir o evento. Tente novamente.");
  revalidatePath("/app/eventos");
  revalidatePath(`/app/eventos/${eventId}`);
  redirect(`/app/eventos/${eventId}?status=concluido`);
}

export async function cancelEvent(eventId: string, _state: ActionState, _formData: FormData): Promise<ActionState> {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const { error } = await supabase
    .from("event_fin_events")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", eventId);
  if (error) return errorState("Não foi possível cancelar o evento. Tente novamente.");
  revalidatePath("/app/eventos");
  revalidatePath(`/app/eventos/${eventId}`);
  redirect(`/app/eventos/${eventId}?status=cancelado`);
}
