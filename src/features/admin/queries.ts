export async function listStudents(supabase: any) {
  const { data: profiles, error } = await supabase
    .from("event_fin_profiles")
    .select("*")
    .eq("system_role", "student")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachStudentWorkspaces(supabase, profiles ?? []);
}

export async function getStudent(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from("event_fin_profiles")
    .select("*")
    .eq("id", userId)
    .eq("system_role", "student")
    .single();
  if (error) throw error;
  const [student] = await attachStudentWorkspaces(supabase, profile ? [profile] : []);
  return student;
}

export async function listAdminLogs(supabase: any) {
  const { data, error } = await supabase.from("event_fin_admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}

async function attachStudentWorkspaces(supabase: any, profiles: any[]) {
  if (profiles.length === 0) return [];
  const userIds = profiles.map((profile) => profile.id);
  const { data: members, error } = await supabase
    .from("event_fin_workspace_members")
    .select("user_id, workspace_id, event_fin_workspaces(*)")
    .in("user_id", userIds);
  if (error) throw error;

  const membersByUserId = new Map<string, any[]>();
  for (const member of members ?? []) {
    membersByUserId.set(member.user_id, [...(membersByUserId.get(member.user_id) ?? []), member]);
  }

  return profiles.map((profile) => ({
    ...profile,
    event_fin_workspace_members: membersByUserId.get(profile.id) ?? []
  }));
}
