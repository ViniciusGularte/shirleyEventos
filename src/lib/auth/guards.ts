import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
}

export async function requireStudentWorkspace() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("event_fin_profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.system_role !== "student") redirect("/login");

  const { data: member } = await supabase
    .from("event_fin_workspace_members")
    .select("workspace_id, event_fin_workspaces(*)")
    .eq("user_id", user.id)
    .single();

  const workspace = Array.isArray(member?.event_fin_workspaces) ? member?.event_fin_workspaces[0] : member?.event_fin_workspaces;
  if (!member || !workspace) redirect("/login");
  if (workspace.status === "suspended" || workspace.status === "archived") redirect("/app/acesso-suspenso");

  return { supabase, user, profile, workspaceId: member.workspace_id, workspace };
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("event_fin_profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.system_role !== "platform_admin") redirect("/login");
  return { supabase, user, profile };
}
