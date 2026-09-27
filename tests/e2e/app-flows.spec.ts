import { expect, test, type Page } from "@playwright/test";

const student = {
  email: process.env.E2E_STUDENT_EMAIL,
  password: process.env.E2E_STUDENT_PASSWORD
};

const admin = {
  email: process.env.E2E_ADMIN_EMAIL,
  password: process.env.E2E_ADMIN_PASSWORD
};

async function login(page: Page, email: string, password: string, expectedPath: "/app" | "/admin") {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
}

test("login inválido explica como corrigir", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("usuario-inexistente@teste.local");
  await page.locator('input[name="password"]').fill("senha-incorreta");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/login\?erro=1$/);
  await expect(page.getByText("E-mail ou senha incorretos. Confira os dados e tente novamente.")).toBeVisible();
});

test("fluxo da aluna: onboarding, validação e responsividade", async ({ page }) => {
  test.skip(!student.email || !student.password, "Defina as credenciais E2E da aluna.");
  await login(page, student.email!, student.password!, "/app");

  await expect(page.getByRole("heading", { name: /Olá,/ })).toBeVisible();
  await page.goto("/app/boas-vindas");
  await expect(page.getByRole("heading", { name: /Vamos organizar tudo/ })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Progresso do guia inicial" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pular por agora" })).toBeVisible();

  await page.goto("/app/clientes");
  await page.getByLabel("Nome").fill("X");
  await page.getByLabel("E-mail").fill("email-invalido");
  await page.getByRole("button", { name: "Novo cliente" }).click();
  await expect(page.getByText("Revise os campos destacados e tente novamente.")).toBeVisible();
  await expect(page.getByText("Informe um nome com pelo menos 2 caracteres.")).toBeVisible();
  await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
  await expect(page.getByLabel("Nome")).toHaveValue("X");
  await expect(page.getByLabel("E-mail")).toHaveValue("email-invalido");

  await page.goto("/app/eventos/novo");
  await page.getByRole("button", { name: "Salvar evento" }).click();
  await expect(page.getByText("Selecione um cliente.")).toBeVisible();
  await expect(page.getByText("Selecione um serviço.")).toBeVisible();
  await expect(page.getByText("Informe a data da venda.")).toBeVisible();
  await expect(page.getByText("O valor vendido deve ser maior que zero.")).toBeVisible();

  await page.goto("/app/financeiro");
  await page.getByRole("button", { name: "Adicionar recebimento" }).click();
  await expect(page.getByText("O valor deve ser maior que zero.")).toBeVisible();
  await expect(page.getByText("Informe a data da movimentação.")).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ["/app", "/app/boas-vindas", "/app/eventos", "/app/clientes", "/app/financeiro", "/app/configuracoes"]) {
    await page.goto(route);
    const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    expect(widths.document, `${route} ultrapassou a viewport`).toBeLessThanOrEqual(widths.viewport);
    expect(widths.body, `${route} ultrapassou a viewport`).toBeLessThanOrEqual(widths.viewport);
  }
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toContainText("Clientes");
});

test("fluxo administrativo: validação e confirmação segura", async ({ page }) => {
  test.skip(!admin.email || !admin.password, "Defina as credenciais E2E administrativas.");
  await login(page, admin.email!, admin.password!, "/admin");

  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  await page.goto("/admin/alunas/nova");
  await page.getByRole("button", { name: "Enviar convite" }).click();
  await expect(page.getByText("Informe o nome completo da aluna.")).toBeVisible();
  await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();

  await page.goto("/admin/alunas");
  const studentLink = page.locator('a[href^="/admin/alunas/"]:not([href="/admin/alunas/nova"])').first();
  await expect(studentLink).toBeVisible();
  await studentLink.click();

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Suspender o acesso desta aluna?");
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "Suspender" }).click();
  await expect(page.getByText("Ativa", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Navegação administrativa" })).toContainText("Alunas");
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
});
