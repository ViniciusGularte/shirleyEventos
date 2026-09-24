export async function listEvents(supabase: any, workspaceId: string) {
  const { data: events, error } = await supabase
    .from("event_fin_events")
    .select("*, event_fin_clients(name), event_fin_transactions(type, amount)")
    .eq("workspace_id", workspaceId)
    .order("event_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return events ?? [];
}

export async function getEvent(supabase: any, workspaceId: string, eventId: string) {
  const { data, error } = await supabase
    .from("event_fin_events")
    .select("*, event_fin_clients(*), event_fin_transactions(*)")
    .eq("workspace_id", workspaceId)
    .eq("id", eventId)
    .single();
  if (error) throw error;
  return data;
}

export async function getEventFinancials(supabase: any, workspaceId: string) {
  const { data, error } = await supabase.rpc("event_fin_get_event_financials", { p_workspace_id: workspaceId });
  if (error) throw error;
  return data as Array<{ event_id: string; sale_amount: number; received_amount: number; outstanding_amount: number; expense_amount: number; expected_result: number }>;
}
