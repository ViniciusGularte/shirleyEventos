"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { errorState, validationState, type ActionState } from "@/lib/actions/state";

const inviteSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo da aluna."),
  email: z.string().email("Informe um e-mail válido.").transform((email) => email.trim().toLowerCase())
});

export async function inviteStudent(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const parsed = inviteSchema.safeParse({ fullName: formData.get("fullName"), email: formData.get("email") });
  if (!parsed.success) return validationState(parsed.error);
  const input = parsed.data;
  let workspaceId: string | null = null;
  let inviteId: string | null = null;

  const { data: workspace, error: workspaceError } = await admin
    .from("event_fin_workspaces")
    .insert({ name: input.fullName })
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
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()
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
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/definir-senha`
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

  revalidatePath("/admin/alunas");
  redirect("/admin/alunas?convite=1");
}

export async function updateStudentStatus(userId: string, status: "active" | "grace" | "suspended" | "archived", _state: ActionState, _formData: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const { data: member, error: memberError } = await admin.from("event_fin_workspace_members").select("workspace_id").eq("user_id", userId).single();
  if (memberError) return errorState("Aluna não encontrada. Volte à lista e tente novamente.");
  const { error } = await admin
    .from("event_fin_workspaces")
    .update({ status, archived_at: status === "archived" ? new Date().toISOString() : null })
    .eq("id", member.workspace_id);
  if (error) return errorState("Não foi possível atualizar o acesso. Tente novamente.");
  await admin.from("event_fin_admin_audit_logs").insert({
    admin_user_id: user.id,
    target_user_id: userId,
    workspace_id: member.workspace_id,
    action: `student_${status}`,
    metadata: {}
  });
  revalidatePath("/admin/alunas");
  revalidatePath(`/admin/alunas/${userId}`);
  redirect(`/admin/alunas/${userId}?status=${status}`);
}
