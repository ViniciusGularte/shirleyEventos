"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorState, validationState, type ActionState } from "@/lib/actions/state";

const inviteSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo da aluna."),
  email: z.string().email("Informe um e-mail válido.").transform((email) => email.trim().toLowerCase()),
  phone: optionalText(30),
  planStartedOn: optionalDate(),
  planAmount: optionalMoney(),
  paymentDueDay: optionalInteger(1, 31, "O dia de vencimento deve ficar entre 1 e 31."),
  nextPaymentDueOn: optionalDate()
});

const planSchema = z.object({
  planStartedOn: optionalDate(),
  planAmount: optionalMoney(),
  billingEmail: z.preprocess((value) => value === "" || value == null ? null : value, z.string().trim().email("Informe um e-mail válido.").nullable()),
  billingPhone: optionalText(30),
  paymentDueDay: optionalInteger(1, 31, "O dia de vencimento deve ficar entre 1 e 31."),
  nextPaymentDueOn: optionalDate(),
  lastPaymentOn: optionalDate(),
  planNotes: optionalText(600)
});

const pauseSchema = z.object({
  reason: z.string().trim().min(3, "Conte em poucas palavras por que o plano será pausado.").max(300, "Use no máximo 300 caracteres.")
});

const reminderSchema = z.object({
  channel: z.enum(["whatsapp", "email", "phone", "other"], { message: "Escolha como o lembrete foi feito." }),
  note: optionalText(300)
});

export async function inviteStudent(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const parsed = inviteSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    planStartedOn: formData.get("planStartedOn"),
    planAmount: formData.get("planAmount"),
    paymentDueDay: formData.get("paymentDueDay"),
    nextPaymentDueOn: formData.get("nextPaymentDueOn")
  });
  if (!parsed.success) return validationState(parsed.error);
  const input = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appUrl) return errorState("A URL pública do sistema não está configurada. Defina NEXT_PUBLIC_APP_URL antes de enviar convites.");
  let workspaceId: string | null = null;
  let inviteId: string | null = null;

  const { data: workspace, error: workspaceError } = await admin
    .from("event_fin_workspaces")
    .insert({
      name: input.fullName,
      plan_started_on: input.planStartedOn ?? todayInBrazil(),
      plan_amount: input.planAmount,
      billing_email: input.email,
      billing_phone: input.phone,
      payment_due_day: input.paymentDueDay,
      next_payment_due_on: input.nextPaymentDueOn
    })
    .select("id")
    .single();
  if (workspaceError) return errorState("Não foi possível criar o espaço da aluna. Tente novamente.");
  workspaceId = workspace.id;

  const { data: invite, error: inviteError } = await admin
    .from("event_fin_invites")
    .insert({
      email: input.email,
      full_name: input.fullName,
      workspace_id: workspace.id,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
    })
    .select("id")
    .single();
  if (inviteError) {
    await admin.from("event_fin_workspaces").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", workspaceId);
    return errorState("Este e-mail já pode ter sido convidado. Confira a lista de alunas antes de tentar novamente.");
  }
  inviteId = invite.id;

  const { data: authUser, error: authError } = await admin.auth.admin.inviteUserByEmail(input.email, {
    data: {
      event_fin_workspace_id: workspace.id,
      event_fin_full_name: input.fullName,
      event_fin_system_role: "student"
    },
    redirectTo: `${appUrl}/definir-senha`
  });
  if (authError || !authUser.user) {
    await admin.from("event_fin_invites").update({ status: "cancelled" }).eq("id", inviteId);
    await admin.from("event_fin_workspaces").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", workspaceId);
    return errorState("Não foi possível enviar o convite. Confira o e-mail e tente novamente.");
  }

  const { error: profileError } = await admin.from("event_fin_profiles").insert({ id: authUser.user.id, full_name: input.fullName, system_role: "student" });
  const { error: memberError } = profileError ? { error: profileError } : await admin.from("event_fin_workspace_members").insert({ workspace_id: workspace.id, user_id: authUser.user.id });
  const { error: seedError } = memberError ? { error: memberError } : await admin.rpc("event_fin_seed_workspace", { p_workspace_id: workspace.id });
  if (profileError || memberError || seedError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    await admin.from("event_fin_invites").update({ status: "cancelled" }).eq("id", inviteId);
    await admin.from("event_fin_workspaces").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", workspaceId);
    return errorState("O convite não pôde ser concluído e foi desfeito. Tente novamente.");
  }
  await admin.from("event_fin_invites").update({ auth_user_id: authUser.user.id }).eq("id", invite.id);
  await admin.from("event_fin_admin_audit_logs").insert({
    admin_user_id: user.id,
    target_user_id: authUser.user.id,
    workspace_id: workspace.id,
    action: "student_invited",
    metadata: { email: input.email }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/alunas");
  redirect("/admin/alunas?convite=1");
}

export async function updateStudentStatus(userId: string, status: "active" | "grace" | "suspended" | "archived", _state: ActionState, _formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const { data: member, error: memberError } = await admin.from("event_fin_workspace_members").select("workspace_id").eq("user_id", userId).single();
  if (memberError) return errorState("Aluna não encontrada. Volte à lista e tente novamente.");
  if (status === "active" || status === "grace") {
    const { data: workspace } = await admin.from("event_fin_workspaces").select("plan_paused_at").eq("id", member.workspace_id).single();
    if (workspace?.plan_paused_at) return errorState("Retome o plano antes de liberar o acesso.");
  }
  const { error } = await admin
    .from("event_fin_workspaces")
    .update({ status, archived_at: status === "archived" ? new Date().toISOString() : null, ...(status === "archived" ? { plan_paused_at: null, plan_pause_reason: null } : {}) })
    .eq("id", member.workspace_id);
  if (error) return errorState("Não foi possível atualizar o acesso. Tente novamente.");
  await admin.from("event_fin_admin_audit_logs").insert({
    admin_user_id: user.id,
    target_user_id: userId,
    workspace_id: member.workspace_id,
    action: `student_${status}`,
    metadata: {}
  });
  revalidatePath("/admin");
  revalidatePath("/admin/alunas");
  revalidatePath(`/admin/alunas/${userId}`);
  redirect(`/admin/alunas/${userId}?status=${status}`);
}

export async function updateStudentPlan(userId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const parsed = planSchema.safeParse({
    planStartedOn: formData.get("planStartedOn"),
    planAmount: formData.get("planAmount"),
    billingEmail: formData.get("billingEmail"),
    billingPhone: formData.get("billingPhone"),
    paymentDueDay: formData.get("paymentDueDay"),
    nextPaymentDueOn: formData.get("nextPaymentDueOn"),
    lastPaymentOn: formData.get("lastPaymentOn"),
    planNotes: formData.get("planNotes")
  });
  if (!parsed.success) return validationState(parsed.error);
  const admin = createAdminClient();
  const member = await getStudentMembership(admin, userId);
  if (!member) return errorState("Aluna não encontrada. Volte à lista e tente novamente.");
  const input = parsed.data;
  const { error } = await admin.from("event_fin_workspaces").update({
    plan_started_on: input.planStartedOn,
    plan_amount: input.planAmount,
    billing_email: input.billingEmail,
    billing_phone: input.billingPhone,
    payment_due_day: input.paymentDueDay,
    next_payment_due_on: input.nextPaymentDueOn,
    last_payment_on: input.lastPaymentOn,
    plan_notes: input.planNotes
  }).eq("id", member.workspace_id);
  if (error) return errorState("Não foi possível salvar os dados do plano. Tente novamente.");
  await writeAuditLog(admin, user.id, userId, member.workspace_id, "student_plan_updated");
  refreshStudentAdmin(userId);
  redirect(`/admin/alunas/${userId}?updated=plan`);
}

export async function pauseStudentPlan(userId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const parsed = pauseSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) return validationState(parsed.error);
  const admin = createAdminClient();
  const member = await getStudentMembership(admin, userId);
  if (!member) return errorState("Aluna não encontrada. Volte à lista e tente novamente.");
  const { data: currentWorkspace } = await admin.from("event_fin_workspaces").select("status").eq("id", member.workspace_id).single();
  if (currentWorkspace?.status === "archived") return errorState("Uma aluna arquivada não pode ter o plano pausado.");
  const { error } = await admin.from("event_fin_workspaces").update({
    plan_paused_at: new Date().toISOString(),
    plan_pause_reason: parsed.data.reason,
    status: "suspended"
  }).eq("id", member.workspace_id);
  if (error) return errorState("Não foi possível pausar o plano. Tente novamente.");
  await writeAuditLog(admin, user.id, userId, member.workspace_id, "student_plan_paused", { reason: parsed.data.reason });
  refreshStudentAdmin(userId);
  redirect(`/admin/alunas/${userId}?updated=paused`);
}

export async function resumeStudentPlan(userId: string, _state: ActionState, _formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const member = await getStudentMembership(admin, userId);
  if (!member) return errorState("Aluna não encontrada. Volte à lista e tente novamente.");
  const { data: currentWorkspace } = await admin.from("event_fin_workspaces").select("status, plan_paused_at").eq("id", member.workspace_id).single();
  if (currentWorkspace?.status === "archived") return errorState("Esta aluna está arquivada. Reative o acesso antes de retomar o plano.");
  if (!currentWorkspace?.plan_paused_at) return errorState("Este plano não está pausado.");
  const { error } = await admin.from("event_fin_workspaces").update({
    plan_paused_at: null,
    plan_pause_reason: null,
    status: "active"
  }).eq("id", member.workspace_id);
  if (error) return errorState("Não foi possível retomar o plano. Tente novamente.");
  await writeAuditLog(admin, user.id, userId, member.workspace_id, "student_plan_resumed");
  refreshStudentAdmin(userId);
  redirect(`/admin/alunas/${userId}?updated=resumed`);
}

export async function registerPaymentReminder(userId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const parsed = reminderSchema.safeParse({ channel: formData.get("channel"), note: formData.get("note") });
  if (!parsed.success) return validationState(parsed.error);
  const admin = createAdminClient();
  const member = await getStudentMembership(admin, userId);
  if (!member) return errorState("Aluna não encontrada. Volte à lista e tente novamente.");
  const reminderAt = new Date().toISOString();
  const { error } = await admin.from("event_fin_workspaces").update({
    payment_reminder_at: reminderAt,
    payment_reminder_channel: parsed.data.channel,
    payment_reminder_note: parsed.data.note
  }).eq("id", member.workspace_id);
  if (error) return errorState("Não foi possível registrar o lembrete. Tente novamente.");
  await writeAuditLog(admin, user.id, userId, member.workspace_id, "student_payment_reminder", { channel: parsed.data.channel, note: parsed.data.note });
  refreshStudentAdmin(userId);
  redirect(`/admin/alunas/${userId}?updated=reminder`);
}

export async function registerPayment(userId: string, _state: ActionState, _formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const member = await getStudentMembership(admin, userId);
  if (!member) return errorState("Aluna não encontrada. Volte à lista e tente novamente.");
  const { data: workspace, error: readError } = await admin.from("event_fin_workspaces").select("next_payment_due_on, payment_due_day").eq("id", member.workspace_id).single();
  if (readError) return errorState("Não foi possível consultar o vencimento atual.");
  const { error } = await admin.from("event_fin_workspaces").update({
    last_payment_on: todayInBrazil(),
    next_payment_due_on: nextDueDate(workspace.next_payment_due_on, workspace.payment_due_day)
  }).eq("id", member.workspace_id);
  if (error) return errorState("Não foi possível registrar o pagamento. Tente novamente.");
  await writeAuditLog(admin, user.id, userId, member.workspace_id, "student_payment_registered");
  refreshStudentAdmin(userId);
  redirect(`/admin/alunas/${userId}?updated=payment`);
}

function optionalDate() {
  return z.preprocess((value) => value === "" || value == null ? null : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").nullable());
}

function optionalMoney() {
  return z.preprocess((value) => {
    if (value === "" || value == null) return null;
    return Number(String(value).replace(",", "."));
  }, z.number({ invalid_type_error: "Informe um valor válido." }).min(0, "O valor não pode ser negativo.").nullable());
}

function optionalInteger(min: number, max: number, message: string) {
  return z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().int(message).min(min, message).max(max, message).nullable());
}

function optionalText(max: number) {
  return z.preprocess((value) => typeof value === "string" && value.trim() === "" ? null : value, z.string().trim().max(max, `Use no máximo ${max} caracteres.`).nullable());
}

async function getStudentMembership(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data, error } = await admin.from("event_fin_workspace_members").select("workspace_id").eq("user_id", userId).single();
  return error ? null : data;
}

async function writeAuditLog(admin: ReturnType<typeof createAdminClient>, adminUserId: string, targetUserId: string, workspaceId: string, action: string, metadata: Record<string, unknown> = {}) {
  await admin.from("event_fin_admin_audit_logs").insert({ admin_user_id: adminUserId, target_user_id: targetUserId, workspace_id: workspaceId, action, metadata });
}

function refreshStudentAdmin(userId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/alunas");
  revalidatePath(`/admin/alunas/${userId}`);
}

function todayInBrazil() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function nextDueDate(currentDue: string | null, dueDay: number | null) {
  const base = currentDue ? new Date(`${currentDue}T12:00:00Z`) : new Date(`${todayInBrazil()}T12:00:00Z`);
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(dueDay ?? base.getUTCDate(), lastDay);
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}
