export async function listClients(supabase: any, workspaceId: string) {
  const { data, error } = await supabase
    .from("event_fin_clients")
    .select("*, event_fin_events(id, sale_amount, event_date)")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}
