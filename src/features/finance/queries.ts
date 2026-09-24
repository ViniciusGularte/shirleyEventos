export async function listTransactions(supabase: any, workspaceId: string) {
  const { data, error } = await supabase
    .from("event_fin_transactions")
    .select("*, event_fin_events(title, service_name_snapshot), event_fin_wallets(name), event_fin_categories(name)")
    .eq("workspace_id", workspaceId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listWallets(supabase: any, workspaceId: string) {
  const { data, error } = await supabase
    .from("event_fin_wallets")
    .select("*, event_fin_transactions(type, amount)")
    .eq("workspace_id", workspaceId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getAllocationRules(supabase: any, workspaceId: string) {
  const { data: set, error } = await supabase
    .from("event_fin_allocation_sets")
    .select("id, effective_from, event_fin_allocation_items(*)")
    .eq("workspace_id", workspaceId)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return set;
}
