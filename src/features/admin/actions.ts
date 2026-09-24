"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

const inviteSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().transform((email) => email.trim().toLowerCase())
});

export async function inviteStudent(formData: FormData) {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const input = inviteSchema.parse({ fullName: formData.get("fullName"), email: formData.get("email") });
  let workspaceId: string | null = null;
  let inviteId: string | null = null;

  const { data: workspace, error: workspaceError } = await admin
    .from("event_fin_workspaces")
    .insert({ name: input.fullName })
    .select("id")
    .single();
  if (workspaceError) throw new Error("Não foi possível criar workspace.");
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
  if (inviteError) throw new Error("Não foi possível criar convite.");
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
    throw new Error("Não foi possível enviar convite.");
  }

  await admin.from("event_fin_profiles").insert({ id: authUser.user.id, full_name: input.fullName, system_role: "student" });
  await admin.from("event_fin_workspace_members").insert({ workspace_id: workspace.id, user_id: authUser.user.id });
  await admin.from("event_fin_invites").update({ auth_user_id: authUser.user.id }).eq("id", invite.id);
  await admin.rpc("event_fin_seed_workspace", { p_workspace_id: workspace.id });
  await admin.from("event_fin_admin_audit_logs").insert({
    admin_user_id: user.id,
    target_user_id: authUser.user.id,
    workspace_id: workspace.id,
    action: "student_invited",
    metadata: { email: input.email }
  });

  revalidatePath("/admin/alunas");
}

export async function updateStudentStatus(userId: string, status: "active" | "grace" | "suspended" | "archived") {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const { data: member, error: memberError } = await admin.from("event_fin_workspace_members").select("workspace_id").eq("user_id", userId).single();
  if (memberError) throw new Error("Aluna não encontrada.");
  const { error } = await admin
    .from("event_fin_workspaces")
    .update({ status, archived_at: status === "archived" ? new Date().toISOString() : null })
    .eq("id", member.workspace_id);
  if (error) throw new Error("Não foi possível atualizar acesso.");
  await admin.from("event_fin_admin_audit_logs").insert({
    admin_user_id: user.id,
    target_user_id: userId,
    workspace_id: member.workspace_id,
    action: `student_${status}`,
    metadata: {}
  });
  revalidatePath("/admin/alunas");
}
