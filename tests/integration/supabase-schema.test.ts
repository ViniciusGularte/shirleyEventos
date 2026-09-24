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
  });
});
