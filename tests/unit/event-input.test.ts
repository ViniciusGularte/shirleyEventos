import { describe, expect, it } from "vitest";
import { splitEventInput } from "@/features/events/input";

describe("dados de criação do evento", () => {
  it("não envia campos financeiros para a tabela de eventos", () => {
    const result = splitEventInput({
      client_id: "client-id",
      service_id: "service-id",
      sale_date: "2026-09-28",
      sale_amount: 3500,
      received_now: 1000,
      initial_cost: 400,
      wallet_id: "wallet-id"
    });

    expect(result.event).toEqual({
      client_id: "client-id",
      service_id: "service-id",
      sale_date: "2026-09-28",
      sale_amount: 3500
    });
    expect(result.event).not.toHaveProperty("received_now");
    expect(result.event).not.toHaveProperty("initial_cost");
    expect(result.event).not.toHaveProperty("wallet_id");
    expect(result.finance).toEqual({ received_now: 1000, initial_cost: 400, wallet_id: "wallet-id" });
  });
});
