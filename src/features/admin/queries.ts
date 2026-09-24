export async function listStudents(supabase: any) {
  const { data, error } = await supabase
    .from("event_fin_profiles")
    .select("*, event_fin_workspace_members(workspace_id, event_fin_workspaces(*))")
    .eq("system_role", "student")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listAdminLogs(supabase: any) {
  const { data, error } = await supabase.from("event_fin_admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}
