import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import type { DashboardMetrics } from "@/types/domain";

export async function getDashboardMetrics(supabase: any, workspaceId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase.rpc("event_fin_get_dashboard_metrics", {
    p_workspace_id: workspaceId,
    p_start_date: startDate,
    p_end_date: endDate
  });
  if (error) throw error;
  return data as DashboardMetrics;
}

export async function getMonthlySeries(supabase: any, workspaceId: string, months = 6) {
  const { data, error } = await supabase.rpc("event_fin_get_monthly_series", {
    p_workspace_id: workspaceId,
    p_months: months
  });
  if (error) throw error;
  return data as Array<{ month: string; received: number; expenses: number; result: number; events: number }>;
}

export function defaultPeriod() {
  const today = new Date();
  return {
    label: "Este mês",
    startDate: format(startOfMonth(today), "yyyy-MM-dd"),
    endDate: format(endOfMonth(today), "yyyy-MM-dd"),
    chartStartDate: format(startOfMonth(subMonths(today, 5)), "yyyy-MM-dd")
  };
}
