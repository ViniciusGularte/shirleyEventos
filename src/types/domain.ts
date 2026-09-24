export type SystemRole = "student" | "platform_admin";
export type WorkspaceStatus = "active" | "grace" | "suspended" | "archived";
export type EventStatus = "scheduled" | "completed" | "cancelled";
export type TransactionType = "income" | "expense";
export type WalletType = "cash" | "bank" | "digital" | "other";
export type PaymentMethod = "pix" | "cash" | "credit_card" | "debit_card" | "bank_transfer" | "other";

export type DashboardMetrics = {
  sold: number;
  received: number;
  expenses: number;
  cash_result: number;
  outstanding: number;
  event_count: number;
  completed_event_count: number;
  average_ticket: number;
};
