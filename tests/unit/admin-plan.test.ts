import { describe, expect, it } from "vitest";
import { formatDate, getPlanSituation } from "@/features/admin/plan";

describe("controle de planos da administração", () => {
  it("não trata plano arquivado como cobrança atrasada", () => {
    expect(getPlanSituation({ status: "archived", next_payment_due_on: "2026-09-01" }, "2026-10-08").kind).toBe("archived");
  });

  it("prioriza a pausa sobre o vencimento", () => {
    expect(getPlanSituation({ plan_paused_at: "2026-10-01T12:00:00Z", next_payment_due_on: "2026-09-01" }, "2026-10-08").kind).toBe("paused");
  });

  it("distingue atraso, vencimento próximo e plano em dia", () => {
    expect(getPlanSituation({ next_payment_due_on: "2026-10-07" }, "2026-10-08")).toMatchObject({ kind: "overdue", label: "1 dia em atraso" });
    expect(getPlanSituation({ next_payment_due_on: "2026-10-08" }, "2026-10-08")).toMatchObject({ kind: "due_soon", label: "Vence hoje" });
    expect(getPlanSituation({ next_payment_due_on: "2026-10-15" }, "2026-10-08")).toMatchObject({ kind: "due_soon", label: "Vence em 7 dias" });
    expect(getPlanSituation({ next_payment_due_on: "2026-10-16" }, "2026-10-08").kind).toBe("current");
  });

  it("formata a data sem recuar um dia por causa do fuso", () => {
    expect(formatDate("2026-10-08")).toBe("08/10/2026");
  });
});
