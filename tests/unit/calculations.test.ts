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
import { appendCurrencyDigit, currencyInputToCents, formatCurrencyFromCents, parseMoney, removeCurrencyDigit } from "@/lib/finance/currency";

const transactions = [
  { type: "income" as const, amount: 1000, event_id: "event-1", wallet_id: "wallet-1" },
  { type: "income" as const, amount: 500, event_id: "event-1", wallet_id: "wallet-1" },
  { type: "expense" as const, amount: 250, event_id: "event-1", wallet_id: "wallet-1" },
  { type: "expense" as const, amount: 100, event_id: "event-2", wallet_id: "wallet-1" }
];

describe("finance calculations", () => {
  it("formata e interpreta valores BRL sem alterar os centavos", () => {
    expect(formatCurrencyFromCents(0)).toMatch(/R\$\s?0,00/);
    expect(formatCurrencyFromCents(1)).toMatch(/R\$\s?0,01/);
    expect(formatCurrencyFromCents(10)).toMatch(/R\$\s?0,10/);
    expect(formatCurrencyFromCents(100)).toMatch(/R\$\s?1,00/);
    expect(formatCurrencyFromCents(1101)).toMatch(/R\$\s?11,01/);
    expect(currencyInputToCents("R$ 0,001")).toBe(1);
    expect(currencyInputToCents("R$ 0,010")).toBe(10);
    expect(currencyInputToCents("R$ 1,100")).toBe(1100);
    expect(currencyInputToCents("-R$ 12,34", true)).toBe(-1234);
    expect([1, 1, 0, 1].reduce(appendCurrencyDigit, 0)).toBe(1101);
    expect(removeCurrencyDigit(1101)).toBe(110);
    expect(parseMoney("R$ 1.234,56")).toBe(1234.56);
    expect(parseMoney("-R$ 12,34")).toBe(-12.34);
  });

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
