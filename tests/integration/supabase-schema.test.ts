import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const runIfConfigured = url && serviceRole ? describe : describe.skip;

runIfConfigured("Supabase remoto", () => {
  const supabase = createClient(url!, serviceRole!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  it("tem as tabelas event_fin e bloqueia inserts inválidos por constraints", async () => {
    const { error } = await supabase.from("event_fin_workspaces").select("id").limit(1);
    expect(error, error?.message).toBeNull();

    const { error: constraintError } = await supabase.from("event_fin_transactions").insert({
      workspace_id: "00000000-0000-0000-0000-000000000000",
      type: "expense",
      amount: 10,
      occurred_at: "2026-09-01"
    });
    expect(constraintError?.message).toMatch(/category|violates|foreign key/i);
  });

  it("expõe RPCs financeiras", async () => {
    const { data: workspace } = await supabase.from("event_fin_workspaces").insert({ name: "Teste integração Codex" }).select("id").single();
    expect(workspace?.id).toBeTruthy();
    if (!workspace?.id) return;
    try {
      const { error: seedError } = await supabase.rpc("event_fin_seed_workspace", { p_workspace_id: workspace.id });
      expect(seedError, seedError?.message).toBeNull();

      const { data, error } = await supabase.rpc("event_fin_get_dashboard_metrics", {
        p_workspace_id: workspace.id,
        p_start_date: "2026-09-01",
        p_end_date: "2026-09-30"
      });
      expect(error, error?.message).toBeNull();
      expect(data).toMatchObject({
        sold: 0,
        received: 0,
        expenses: 0,
        cash_result: 0,
        outstanding: 0
      });
    } finally {
      await supabase.from("event_fin_workspaces").delete().eq("id", workspace.id);
    }
  });

  it("persiste todos os cadastros operacionais sem enviar campos para tabelas erradas", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const { data: workspace, error: workspaceError } = await supabase
      .from("event_fin_workspaces")
      .insert({ name: `Teste forms ${suffix}` })
      .select("id")
      .single();
    expect(workspaceError, workspaceError?.message).toBeNull();
    expect(workspace?.id).toBeTruthy();
    if (!workspace?.id) return;

    try {
      const { error: seedError } = await supabase.rpc("event_fin_seed_workspace", { p_workspace_id: workspace.id });
      expect(seedError, seedError?.message).toBeNull();

      const [{ data: service }, { data: category }] = await Promise.all([
        supabase.from("event_fin_services").select("id,name").eq("workspace_id", workspace.id).limit(1).single(),
        supabase.from("event_fin_categories").select("id").eq("workspace_id", workspace.id).eq("name", "Equipe").single()
      ]);
      expect(service?.id).toBeTruthy();
      expect(category?.id).toBeTruthy();

      const { data: client, error: clientError } = await supabase
        .from("event_fin_clients")
        .insert({ workspace_id: workspace.id, name: "Cliente teste", email: "cliente@teste.local" })
        .select("id")
        .single();
      expect(clientError, clientError?.message).toBeNull();

      const { data: wallet, error: walletError } = await supabase
        .from("event_fin_wallets")
        .insert({ workspace_id: workspace.id, name: `Conta ${suffix}`, type: "bank", opening_balance: 100 })
        .select("id")
        .single();
      expect(walletError, walletError?.message).toBeNull();

      const { data: event, error: eventError } = await supabase
        .from("event_fin_events")
        .insert({
          workspace_id: workspace.id,
          client_id: client!.id,
          service_id: service!.id,
          service_name_snapshot: service!.name,
          title: "Evento teste",
          sale_date: "2026-09-28",
          event_date: "2026-10-10",
          sale_amount: 3500
        })
        .select("id")
        .single();
      expect(eventError, eventError?.message).toBeNull();

      const { error: incomeError } = await supabase.from("event_fin_transactions").insert({
        workspace_id: workspace.id,
        type: "income",
        event_id: event!.id,
        wallet_id: wallet!.id,
        amount: 1000,
        occurred_at: "2026-09-28",
        payment_method: "pix",
        description: "Recebimento teste"
      });
      expect(incomeError, incomeError?.message).toBeNull();

      const { error: expenseError } = await supabase.from("event_fin_transactions").insert({
        workspace_id: workspace.id,
        type: "expense",
        event_id: event!.id,
        wallet_id: wallet!.id,
        category_id: category!.id,
        amount: 400,
        occurred_at: "2026-09-28",
        description: "Despesa teste"
      });
      expect(expenseError, expenseError?.message).toBeNull();

      const effectiveFrom = new Date();
      effectiveFrom.setDate(1);
      const { data: allocationSet, error: allocationError } = await supabase
        .from("event_fin_allocation_sets")
        .upsert(
          { workspace_id: workspace.id, effective_from: effectiveFrom.toISOString().slice(0, 10) },
          { onConflict: "workspace_id,effective_from" }
        )
        .select("id")
        .single();
      expect(allocationError, allocationError?.message).toBeNull();
      await supabase.from("event_fin_allocation_items").delete().eq("allocation_set_id", allocationSet!.id);
      const { error: itemsError } = await supabase.from("event_fin_allocation_items").insert([
        { allocation_set_id: allocationSet!.id, name: "Pró-labore", percentage: 60, sort_order: 0 },
        { allocation_set_id: allocationSet!.id, name: "Reserva", percentage: 40, sort_order: 1 }
      ]);
      expect(itemsError, itemsError?.message).toBeNull();

      const { count, error: countError } = await supabase
        .from("event_fin_transactions")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id);
      expect(countError, countError?.message).toBeNull();
      expect(count).toBe(2);
    } finally {
      const { error: cleanupError } = await supabase.from("event_fin_workspaces").delete().eq("id", workspace.id);
      expect(cleanupError, cleanupError?.message).toBeNull();
    }
  });
});
