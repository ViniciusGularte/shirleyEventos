export type TransactionLike = {
  type: "income" | "expense";
  amount: number;
  event_id?: string | null;
  wallet_id?: string | null;
};

export type EventLike = {
  id: string;
  sale_amount: number;
  status?: "scheduled" | "completed" | "cancelled";
};

export type WalletLike = {
  id: string;
  opening_balance: number;
};

export type AllocationRule = {
  name: string;
  percentage: number;
};

export function sumMoney(values: number[]) {
  return Math.round(values.reduce((total, value) => total + Number(value || 0), 0) * 100) / 100;
}

export function calculateEventReceived(eventId: string, transactions: TransactionLike[]) {
  return sumMoney(transactions.filter((item) => item.event_id === eventId && item.type === "income").map((item) => item.amount));
}

export function calculateEventExpenses(eventId: string, transactions: TransactionLike[]) {
  return sumMoney(transactions.filter((item) => item.event_id === eventId && item.type === "expense").map((item) => item.amount));
}

export function calculateEventOutstanding(saleAmount: number, received: number) {
  return Math.max(sumMoney([saleAmount, -received]), 0);
}

export function calculateEventExpectedResult(saleAmount: number, eventExpenses: number) {
  return sumMoney([saleAmount, -eventExpenses]);
}

export function calculateCashResult(received: number, expenses: number) {
  return sumMoney([received, -expenses]);
}

export function calculateAverageTicket(events: EventLike[]) {
  const validEvents = events.filter((event) => event.status !== "cancelled");
  if (validEvents.length === 0) return 0;
  return Math.round((sumMoney(validEvents.map((event) => event.sale_amount)) / validEvents.length) * 100) / 100;
}

export function calculateWalletBalance(wallet: WalletLike, transactions: TransactionLike[]) {
  const walletTransactions = transactions.filter((item) => item.wallet_id === wallet.id);
  const income = sumMoney(walletTransactions.filter((item) => item.type === "income").map((item) => item.amount));
  const expense = sumMoney(walletTransactions.filter((item) => item.type === "expense").map((item) => item.amount));
  return calculateCashResult(sumMoney([wallet.opening_balance, income]), expense);
}

export function calculateAllocation(cashResult: number, rules: AllocationRule[]) {
  const totalPercentage = sumMoney(rules.map((rule) => rule.percentage));
  if (totalPercentage > 100) {
    throw new Error("A distribuição não pode passar de 100%.");
  }
  const base = Math.max(cashResult, 0);
  return {
    base,
    totalPercentage,
    remainingPercentage: sumMoney([100, -totalPercentage]),
    items: rules.map((rule) => ({
      ...rule,
      amount: Math.round(((base * rule.percentage) / 100) * 100) / 100
    }))
  };
}
