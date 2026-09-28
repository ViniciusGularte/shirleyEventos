import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

test("todos os formulários operacionais inserem dados", async ({ page }) => {
  test.skip(!supabaseUrl || !serviceRole, "Supabase não configurado para o teste completo.");
  const admin = createClient(supabaseUrl!, serviceRole!, { auth: { persistSession: false, autoRefreshToken: false } });
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `e2e-${suffix}@example.com`;
  const password = `E2e!${suffix}Aa`;
  const clientName = `Cliente E2E ${suffix}`;
  let userId: string | undefined;
  let workspaceId: string | undefined;

  try {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    expect(authError, authError?.message).toBeNull();
    userId = authData.user?.id;
    expect(userId).toBeTruthy();

    const { data: workspace, error: workspaceError } = await admin
      .from("event_fin_workspaces")
      .insert({ name: `Workspace E2E ${suffix}` })
      .select("id")
      .single();
    expect(workspaceError, workspaceError?.message).toBeNull();
    workspaceId = workspace?.id;
    expect(workspaceId).toBeTruthy();

    const { error: profileError } = await admin.from("event_fin_profiles").insert({ id: userId!, full_name: "Teste E2E", system_role: "student" });
    expect(profileError, profileError?.message).toBeNull();
    const { error: memberError } = await admin.from("event_fin_workspace_members").insert({ workspace_id: workspaceId!, user_id: userId! });
    expect(memberError, memberError?.message).toBeNull();
    const { error: seedError } = await admin.rpc("event_fin_seed_workspace", { p_workspace_id: workspaceId! });
    expect(seedError, seedError?.message).toBeNull();

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/app$/);

    await page.goto("/app/clientes");
    await page.getByLabel("Nome").fill(clientName);
    await page.getByLabel("Telefone").fill("11999999999");
    await page.getByLabel("E-mail").fill(`cliente-${suffix}@example.com`);
    await page.getByRole("button", { name: "Novo cliente" }).click();
    await expect(page).toHaveURL(/\/app\/clientes\?criado=1$/);
    await expect(page.getByText("Cliente cadastrado com sucesso.")).toBeVisible();

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/app/eventos/novo");
    await page.getByLabel("Cliente").selectOption({ label: clientName });
    await page.getByLabel("Serviço").selectOption({ index: 1 });
    await page.getByLabel("Título").fill(`Evento E2E ${suffix}`);
    await page.getByLabel("Data da venda").click();
    const calendarBox = await page.locator(".date-picker-popover").boundingBox();
    expect(calendarBox).not.toBeNull();
    expect(calendarBox!.x).toBeGreaterThanOrEqual(0);
    expect(calendarBox!.x + calendarBox!.width).toBeLessThanOrEqual(375);
    await page.locator(".rdp-today button").click();
    await page.getByLabel("Data e horário do evento").click();
    await page.locator(".rdp-today button").click();
    await page.getByLabel("Horário", { exact: true }).selectOption("18:00");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await page.getByLabel("Valor vendido").fill("3500,00");
    await page.getByLabel("Recebido agora").fill("1000,00");
    await page.getByLabel("Custo de equipe inicial").fill("400,00");
    await page.getByLabel("Conta").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Salvar evento" }).click();
    await expect(page).toHaveURL(/\/app\/eventos\/[0-9a-f-]+\?criado=1$/);
    await expect(page.getByText("Evento criado com sucesso.")).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/app/financeiro");
    const incomeCard = page.getByRole("heading", { name: "Recebimento", exact: true }).locator("..");
    await incomeCard.getByLabel("Valor").fill("250,00");
    await incomeCard.getByLabel("Data").click();
    await page.locator(".rdp-today button").click();
    await incomeCard.getByRole("button", { name: "Adicionar recebimento" }).click();
    await expect(page).toHaveURL(/salvo=recebimento/);

    const expenseCard = page.getByRole("heading", { name: "Despesa", exact: true }).locator("..");
    await expenseCard.getByLabel("Valor").fill("100,00");
    await expenseCard.getByLabel("Data").click();
    await page.locator(".rdp-today button").click();
    await expenseCard.getByLabel("Categoria").selectOption({ index: 1 });
    await expenseCard.getByRole("button", { name: "Adicionar despesa" }).click();
    await expect(page).toHaveURL(/salvo=despesa/);

    const walletCard = page.getByRole("heading", { name: "Contas", exact: true }).locator("..");
    await walletCard.getByLabel("Nome").fill(`Conta E2E ${suffix}`);
    await walletCard.getByLabel("Saldo inicial").fill("50,00");
    await walletCard.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/salvo=conta/);

    const allocationCard = page.getByRole("heading", { name: "Distribuição", exact: true }).locator("..");
    await allocationCard.getByRole("button", { name: "Salvar percentuais" }).click();
    await expect(page).toHaveURL(/salvo=distribuicao/);
    await expect(page.getByText("Percentuais de distribuição atualizados.")).toBeVisible();
  } finally {
    if (workspaceId) await admin.from("event_fin_workspaces").delete().eq("id", workspaceId);
    if (userId) await admin.auth.admin.deleteUser(userId);
  }
});
