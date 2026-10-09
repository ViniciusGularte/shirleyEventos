import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const baseURL = process.env.VIDEO_BASE_URL ?? "http://127.0.0.1:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRole) {
  throw new Error("Supabase não configurado. Confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
}

const admin = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const captureDir = fs.mkdtempSync(path.join(os.tmpdir(), "shirley-tour-"));
const outputVideo = path.join(root, "docs", "manual", "screenshots", "shirley-platform-tour.webm");
const outputCaptions = path.join(root, "video", "captions-shirley.json");
const outputSyncReport = path.join(root, "docs", "video", "sync-quality-report.json");
const outputVideoMetadata = path.join(root, "video", "video-metadata.json");
const scriptPath = path.join(root, "video", "shirley-script.json");
const narrationDurationsPath = path.join(root, "video", "narration-durations.json");
fs.mkdirSync(captureDir, { recursive: true });

const narrationDurations = fs.existsSync(narrationDurationsPath)
  ? new Map(JSON.parse(fs.readFileSync(narrationDurationsPath, "utf8")).chunks.map((chunk) => [chunk.text, chunk.duration_seconds]))
  : new Map();
const scriptLines = new Map(JSON.parse(fs.readFileSync(scriptPath, "utf8")).map((item) => [item.id, item.text]));
const line = (id) => {
  const text = scriptLines.get(id);
  if (!text) throw new Error(`Trecho ausente no roteiro: ${id}`);
  return text;
};

const suffix = `${Date.now()}`;
const email = "acesso@eventossobcontrole.com.br";
const password = `Video!${suffix}Aa`;
const clientName = "Mariana Oliveira";
const clientEmail = "mariana@exemplo.com";
const eventTitle = "Casamento Mariana e Lucas";
let userId;
let workspaceId;
let browser;
let context;
let page;
let recording;
const markers = [];
let startedAt = 0;
let cursorPosition = { x: 800, y: 384 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const narrate = async (id, action, { readingTime = 1800, leadMs = 650, tailMs = 450 } = {}) => {
  const text = line(id);
  const started = Date.now();
  const marker = { id, text, startMs: started - startedAt, actionStartMs: null, actionEndMs: null };
  markers.push(marker);
  await sleep(leadMs);
  if (action) {
    marker.actionStartMs = Date.now() - startedAt;
    await action();
    marker.actionEndMs = Date.now() - startedAt;
  }
  const minimumDuration = Math.max(readingTime, ((narrationDurations.get(text) ?? 0) * 1000) + tailMs);
  const remaining = minimumDuration - (Date.now() - started);
  if (remaining > 0) await sleep(remaining);
};

const moveMouseSmoothly = async (targetX, targetY) => {
  const start = cursorPosition;
  const deltaX = targetX - start.x;
  const deltaY = targetY - start.y;
  const distance = Math.hypot(deltaX, deltaY);
  const duration = Math.min(900, Math.max(480, 400 + distance * 0.32));
  const steps = Math.ceil(duration / 16);
  const curve = Math.min(62, distance * 0.08);

  for (let step = 1; step <= steps; step += 1) {
    const progress = step / steps;
    const eased = progress < 0.5
      ? 4 * progress ** 3
      : 1 - ((-2 * progress + 2) ** 3) / 2;
    const arc = Math.sin(Math.PI * eased) * curve;
    const normalX = distance > 0 ? -deltaY / distance : 0;
    const normalY = distance > 0 ? deltaX / distance : 0;
    await page.mouse.move(
      start.x + deltaX * eased + normalX * arc,
      start.y + deltaY * eased + normalY * arc
    );
    await sleep(duration / steps);
  }

  cursorPosition = { x: targetX, y: targetY };
};

const moveTo = async (locator) => {
  const insideViewport = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= innerHeight && rect.right <= innerWidth;
  });
  if (!insideViewport) {
    await locator.evaluate((element) => element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }));
    await sleep(750);
  }
  const box = await locator.boundingBox();
  if (!box) throw new Error("Elemento sem posição visível durante a gravação.");
  await moveMouseSmoothly(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(220);
  return box;
};

const click = async (locator, waitAfter = 700) => {
  const box = await moveTo(locator);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(waitAfter);
};

const type = async (locator, value, delay = 70) => {
  await click(locator, 250);
  await page.keyboard.press("Control+A");
  await page.keyboard.type(value, { delay });
  await sleep(650);
};

const choose = async (locator, option) => {
  await moveTo(locator);
  await locator.selectOption(option);
  await sleep(850);
};

const nav = (href) => page.locator(`a[href="${href}"]:visible`).first();

try {
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (authError) throw authError;
  userId = authData.user?.id;
  if (!userId) throw new Error("Usuária temporária não foi criada.");

  const { data: workspace, error: workspaceError } = await admin
    .from("event_fin_workspaces")
    .insert({ name: "Demonstração da plataforma" })
    .select("id")
    .single();
  if (workspaceError) throw workspaceError;
  workspaceId = workspace.id;

  const { error: profileError } = await admin
    .from("event_fin_profiles")
    .insert({ id: userId, full_name: "Usuária", system_role: "student" });
  if (profileError) throw profileError;

  const { error: memberError } = await admin
    .from("event_fin_workspace_members")
    .insert({ workspace_id: workspaceId, user_id: userId });
  if (memberError) throw memberError;

  const { error: seedError } = await admin.rpc("event_fin_seed_workspace", { p_workspace_id: workspaceId });
  if (seedError) throw seedError;

  browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--headless=new", "--no-sandbox"]
  });
  context = await browser.newContext({
    viewport: { width: 1600, height: 768 },
    recordVideo: { dir: captureDir, size: { width: 1600, height: 768 } },
    colorScheme: "light",
    locale: "pt-BR"
  });

  await context.addInitScript(() => {
    const mountCursor = () => {
      if (document.getElementById("tutorial-pointer")) return;
      const style = document.createElement("style");
      style.textContent = `
        #tutorial-pointer{position:fixed;left:0;top:0;width:24px;height:31px;z-index:2147483647;pointer-events:none;opacity:0;filter:drop-shadow(0 2px 3px rgba(18,12,18,.4));transform:translate(-3px,-3px);transition:opacity .12s ease}
        #tutorial-pointer svg{display:block}
        .tutorial-click{position:fixed;width:42px;height:42px;border:4px solid #be185d;border-radius:999px;z-index:2147483646;pointer-events:none;transform:translate(-50%,-50%) scale(.35);animation:tutorial-ripple .55s ease-out forwards}
        @keyframes tutorial-ripple{to{opacity:0;transform:translate(-50%,-50%) scale(1.7)}}
      `;
      document.head.appendChild(style);
      const pointer = document.createElement("div");
      pointer.id = "tutorial-pointer";
      pointer.innerHTML = '<svg width="24" height="31" viewBox="0 0 34 42"><path d="M3 2L30 23L18 25L24 38L17 41L11 28L3 36Z" fill="#fff" stroke="#120c12" stroke-width="2.5"/></svg>';
      document.documentElement.appendChild(pointer);
      window.addEventListener("mousemove", (event) => {
        pointer.style.opacity = "1";
        pointer.style.left = `${event.clientX}px`;
        pointer.style.top = `${event.clientY}px`;
      }, true);
      window.addEventListener("click", (event) => {
        const ripple = document.createElement("div");
        ripple.className = "tutorial-click";
        ripple.style.left = `${event.clientX}px`;
        ripple.style.top = `${event.clientY}px`;
        document.documentElement.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
      }, true);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountCursor);
    else mountCursor();
  });

  page = await context.newPage();
  recording = page.video();
  startedAt = Date.now();

  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState("networkidle");
  await narrate("intro", null, { readingTime: 4800 });
  await narrate("login_email", () => type(page.getByLabel("E-mail"), email, 45), { leadMs: 850 });
  await narrate("login_password", () => type(page.locator('input[name="password"]'), password, 40), { leadMs: 800 });
  await narrate("login_submit", async () => {
    await click(page.getByRole("button", { name: "Entrar" }), 400);
    await page.waitForURL(/\/app$/);
    await page.waitForLoadState("networkidle");
  }, { leadMs: 700 });

  await narrate("dashboard_intro", null, { readingTime: 5000 });
  await narrate("workflow", async () => {
    await click(nav("/app/clientes"), 500);
    await page.waitForURL(/\/app\/clientes/);
  }, { leadMs: 2400 });

  await narrate("client_intro", null, { readingTime: 3600 });
  await narrate("client_name", () => type(page.getByLabel("Nome"), clientName), { leadMs: 900 });
  await narrate("client_phone", () => type(page.getByLabel("Telefone"), "11987654321"), { leadMs: 900 });
  await narrate("client_email", () => type(page.getByLabel("E-mail"), clientEmail), { leadMs: 900 });
  await narrate("client_save", async () => {
    await click(page.getByRole("button", { name: "Novo cliente" }), 500);
    await page.waitForURL(/criado=1/);
  }, { leadMs: 1500 });
  await narrate("client_success", null, { readingTime: 4000 });

  await narrate("event_open", async () => {
    await click(nav("/app/eventos"), 500);
    await page.waitForURL(/\/app\/eventos$/);
    await click(page.getByRole("link", { name: "Novo evento" }).first(), 500);
    await page.waitForURL(/\/app\/eventos\/novo/);
  }, { leadMs: 1100 });

  await narrate("event_client", () => choose(page.getByLabel("Cliente"), { label: clientName }), { leadMs: 900 });
  await narrate("event_service", () => choose(page.getByLabel("Serviço"), { index: 1 }), { leadMs: 900 });
  await narrate("event_title", () => type(page.getByLabel("Título"), eventTitle, 55), { leadMs: 1000 });

  await narrate("event_sale_date", async () => {
    await click(page.getByLabel("Data da venda"), 500);
    await click(page.locator(".rdp-today button"), 650);
  }, { leadMs: 950 });
  await narrate("event_date", async () => {
    await click(page.getByLabel("Data e horário do evento"), 500);
    await click(page.locator(".rdp-today button"), 400);
    await choose(page.getByLabel("Horário", { exact: true }), "18:00");
    await click(page.getByRole("button", { name: "Aplicar" }), 650);
  }, { leadMs: 850 });

  await narrate("event_value", () => type(page.getByLabel("Valor vendido"), "3500,00", 65), { leadMs: 1000 });
  await narrate("event_received", () => type(page.getByLabel("Recebido agora"), "1000,00", 65), { leadMs: 1100 });
  await narrate("event_team_cost", () => type(page.getByLabel("Custo de equipe inicial"), "400,00", 65), { leadMs: 1000 });
  await narrate("event_wallet", () => choose(page.getByLabel("Conta"), { index: 1 }), { leadMs: 1000 });
  await narrate("event_notes", () => type(page.getByLabel("Observações"), "Sinal recebido. Cerimônia às 18h.", 48), { leadMs: 1050 });
  await narrate("event_save", async () => {
    await click(page.getByRole("button", { name: "Salvar evento" }), 500);
    await page.waitForURL(/\/app\/eventos\/[0-9a-f-]+\?criado=1/);
  }, { leadMs: 1800 });
  await narrate("event_success", null, { readingTime: 4700 });

  await narrate("finance_open", async () => {
    await click(nav("/app/financeiro"), 500);
    await page.waitForURL(/\/app\/financeiro/);
    await page.waitForLoadState("networkidle");
  }, { leadMs: 900 });
  const incomeCard = page.getByRole("heading", { name: "Recebimento", exact: true }).locator("..");
  await narrate("income_value_date", async () => {
    await type(incomeCard.getByLabel("Valor"), "500,00", 65);
    await click(incomeCard.getByLabel("Data"), 450);
    await click(page.locator(".rdp-today button"), 600);
  }, { leadMs: 900 });
  await narrate("income_links", async () => {
    await choose(incomeCard.locator('select[name="event_id"]'), { index: 1 });
    await choose(incomeCard.locator('select[name="wallet_id"]'), { index: 1 });
  }, { leadMs: 900 });
  await narrate("income_description", async () => {
    await type(incomeCard.getByLabel("Descrição"), "Segunda parcela", 55);
    await click(incomeCard.getByRole("button", { name: "Adicionar recebimento" }), 500);
    await page.waitForURL(/salvo=recebimento/);
  }, { leadMs: 950 });
  await narrate("income_success", null, { readingTime: 4500 });

  const expenseCard = page.getByRole("heading", { name: "Despesa", exact: true }).locator("..");
  await narrate("expense_value_date", async () => {
    await type(expenseCard.getByLabel("Valor"), "180,00", 65);
    await click(expenseCard.getByLabel("Data"), 450);
    await click(page.locator(".rdp-today button"), 500);
  }, { leadMs: 900 });
  await narrate("expense_links", async () => {
    await choose(expenseCard.locator('select[name="category_id"]'), { index: 1 });
    await choose(expenseCard.locator('select[name="event_id"]'), { index: 1 });
    await choose(expenseCard.locator('select[name="wallet_id"]'), { index: 1 });
  }, { leadMs: 850 });
  await narrate("expense_description", async () => {
    await type(expenseCard.getByLabel("Descrição"), "Material de apoio", 55);
    await click(expenseCard.getByRole("button", { name: "Adicionar despesa" }), 500);
    await page.waitForURL(/salvo=despesa/);
  }, { leadMs: 950 });
  await narrate("expense_success", null, { readingTime: 4700 });

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
  await sleep(1500);
  await narrate("accounts", null, { readingTime: 4800 });
  await narrate("allocation", null, { readingTime: 4800 });
  const allocationCard = page.getByRole("heading", { name: "Distribuição", exact: true }).locator("..");
  await moveTo(allocationCard.getByRole("button", { name: "Salvar percentuais" }));
  await sleep(900);

  await narrate("dashboard_return", async () => {
    await click(nav("/app"), 500);
    await page.waitForURL(/\/app$/);
    await page.waitForLoadState("networkidle");
  }, { leadMs: 900 });
  await narrate("dashboard_values", null, { readingTime: 5200 });
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
  await sleep(1400);
  await narrate("dashboard_result", null, { readingTime: 5200 });
  await narrate("dashboard_habit", null, { readingTime: 5000 });
  await narrate("closing", null, { readingTime: 5800 });

  const finishedAt = Date.now() - startedAt;
  await context.close();
  context = undefined;
  const recordedPath = await recording.path();
  fs.copyFileSync(recordedPath, outputVideo);
  const recordedDurationMs = Math.round(Number(execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", outputVideo],
    { encoding: "utf8" }
  ).trim()) * 1000);
  const timeScale = recordedDurationMs / finishedAt;

  const captions = markers.map((item, index) => ({
    text: item.text,
    startMs: Math.max(0, Math.round(item.startMs * timeScale)),
    endMs: index + 1 < markers.length
      ? Math.max(Math.round(item.startMs * timeScale) + 800, Math.round(markers[index + 1].startMs * timeScale) - 100)
      : recordedDurationMs,
    timestampMs: null,
    confidence: null
  }));
  fs.writeFileSync(outputCaptions, `${JSON.stringify(captions, null, 2)}\n`);
  const syncChecks = markers.map((item, index) => {
    const caption = captions[index];
    const voiceDurationMs = Math.round((narrationDurations.get(item.text) ?? 0) * 1000);
    const voiceEndMs = caption.startMs + voiceDurationMs;
    const actionStartMs = item.actionStartMs === null ? null : Math.round(item.actionStartMs * timeScale);
    const actionEndMs = item.actionEndMs === null ? null : Math.round(item.actionEndMs * timeScale);
    const voiceFits = voiceEndMs <= caption.endMs;
    const actionFits = actionStartMs === null
      || (actionStartMs >= caption.startMs && actionEndMs <= caption.endMs + 100);
    const actionStartsDuringVoice = actionStartMs === null || actionStartMs <= voiceEndMs;
    return {
      id: item.id,
      captionStartMs: caption.startMs,
      captionEndMs: caption.endMs,
      voiceEndMs,
      actionStartMs,
      actionEndMs,
      voiceFits,
      actionFits,
      actionStartsDuringVoice,
      passed: voiceFits && actionFits && actionStartsDuringVoice
    };
  });
  const syncReport = {
    passed: syncChecks.every((item) => item.passed),
    sourceClockDurationMs: finishedAt,
    recordedDurationMs,
    timeScale,
    checks: syncChecks
  };
  fs.writeFileSync(outputSyncReport, `${JSON.stringify(syncReport, null, 2)}\n`);
  fs.writeFileSync(outputVideoMetadata, `${JSON.stringify({ durationSeconds: Math.ceil(recordedDurationMs / 1000) }, null, 2)}\n`);
  if (!syncReport.passed) throw new Error(`Controle de sincronismo reprovado. Confira ${outputSyncReport}`);
  process.stdout.write(`${JSON.stringify({ outputVideo, outputCaptions, outputSyncReport, outputVideoMetadata, durationMs: recordedDurationMs, timeScale })}\n`);
} finally {
  if (context) await context.close().catch(() => undefined);
  if (browser) await browser.close().catch(() => undefined);
  if (workspaceId) await admin.from("event_fin_workspaces").delete().eq("id", workspaceId);
  if (userId) await admin.auth.admin.deleteUser(userId);
  fs.rmSync(captureDir, { recursive: true, force: true });
}
