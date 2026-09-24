import { describe, expect, it } from "vitest";
import {
  calculateAllocation,
  calculateAverageTicket,
  calculateCashResult,
  calculateEventExpenses,
  calculateEventExpectedResult,
  calculateEventOutstanding,
  calculateEventReceived,
  calculateWalletBalance
} from "@/lib/finance/calculations";

const transactions = [
  { type: "income" as const, amount: 1000, event_id: "event-1", wallet_id: "wallet-1" },
  { type: "income" as const, amount: 500, event_id: "event-1", wallet_id: "wallet-1" },
  { type: "expense" as const, amount: 250, event_id: "event-1", wallet_id: "wallet-1" },
  { type: "expense" as const, amount: 100, event_id: "event-2", wallet_id: "wallet-1" }
];

describe("finance calculations", () => {
  it("calcula recebido, custos, a receber e resultado previsto do evento", () => {
    expect(calculateEventReceived("event-1", transactions)).toBe(1500);
    expect(calculateEventExpenses("event-1", transactions)).toBe(250);
    expect(calculateEventOutstanding(2000, 1500)).toBe(500);
    expect(calculateEventOutstanding(2000, 2500)).toBe(0);
    expect(calculateEventExpectedResult(2000, 250)).toBe(1750);
  });

  it("calcula resultado de caixa e ticket médio ignorando cancelados", () => {
    expect(calculateCashResult(1500, 350)).toBe(1150);
    expect(calculateAverageTicket([
      { id: "1", sale_amount: 1000, status: "scheduled" },
      { id: "2", sale_amount: 3000, status: "completed" },
      { id: "3", sale_amount: 9999, status: "cancelled" }
    ])).toBe(2000);
  });

  it("calcula saldo de wallet", () => {
    expect(calculateWalletBalance({ id: "wallet-1", opening_balance: 200 }, transactions)).toBe(1350);
  });

  it("calcula distribuição e bloqueia soma acima de 100%", () => {
    const result = calculateAllocation(1000, [
      { name: "Pró-labore", percentage: 50 },
      { name: "Reserva", percentage: 20 }
    ]);
    expect(result.base).toBe(1000);
    expect(result.remainingPercentage).toBe(30);
    expect(result.items[0].amount).toBe(500);
    expect(() => calculateAllocation(1000, [{ name: "Tudo", percentage: 101 }])).toThrow();
  });
});
