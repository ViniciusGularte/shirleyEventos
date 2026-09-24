export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      event_fin_profiles: {
        Row: {
          id: string;
          full_name: string;
          system_role: "student" | "platform_admin";
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["event_fin_profiles"]["Row"]> & { id: string; full_name: string };
        Update: Partial<Database["public"]["Tables"]["event_fin_profiles"]["Row"]>;
      };
      event_fin_workspaces: {
        Row: {
          id: string;
          name: string;
          status: "active" | "grace" | "suspended" | "archived";
          currency: string;
          timezone: string;
          grace_until: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["event_fin_workspaces"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["event_fin_workspaces"]["Row"]>;
      };
      event_fin_workspace_members: {
        Row: { id: string; workspace_id: string; user_id: string; role: "owner"; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["event_fin_workspace_members"]["Row"]> & { workspace_id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["event_fin_workspace_members"]["Row"]>;
      };
      event_fin_invites: {
        Row: { id: string; email: string; full_name: string; workspace_id: string | null; status: "pending" | "accepted" | "expired" | "cancelled"; auth_user_id: string | null; invited_by: string; expires_at: string | null; accepted_at: string | null; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["event_fin_invites"]["Row"]> & { email: string; full_name: string; invited_by: string };
        Update: Partial<Database["public"]["Tables"]["event_fin_invites"]["Row"]>;
      };
      event_fin_clients: {
        Row: { id: string; workspace_id: string; name: string; phone: string | null; email: string | null; notes: string | null; is_active: boolean; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["event_fin_clients"]["Row"]> & { workspace_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["event_fin_clients"]["Row"]>;
      };
      event_fin_services: {
        Row: { id: string; workspace_id: string; name: string; default_price: number | null; is_active: boolean; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["event_fin_services"]["Row"]> & { workspace_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["event_fin_services"]["Row"]>;
      };
      event_fin_events: {
        Row: { id: string; workspace_id: string; client_id: string; service_id: string | null; title: string | null; service_name_snapshot: string; sale_date: string; event_date: string | null; sale_amount: number; status: "scheduled" | "completed" | "cancelled"; notes: string | null; created_at: string; updated_at: string; cancelled_at: string | null };
        Insert: Partial<Database["public"]["Tables"]["event_fin_events"]["Row"]> & { workspace_id: string; client_id: string; service_name_snapshot: string; sale_date: string; sale_amount: number };
        Update: Partial<Database["public"]["Tables"]["event_fin_events"]["Row"]>;
      };
      event_fin_wallets: {
        Row: { id: string; workspace_id: string; name: string; type: "cash" | "bank" | "digital" | "other"; opening_balance: number; is_active: boolean; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["event_fin_wallets"]["Row"]> & { workspace_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["event_fin_wallets"]["Row"]>;
      };
      event_fin_categories: {
        Row: { id: string; workspace_id: string; name: string; transaction_type: "income" | "expense"; is_system: boolean; is_active: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["event_fin_categories"]["Row"]> & { workspace_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["event_fin_categories"]["Row"]>;
      };
      event_fin_transactions: {
        Row: { id: string; workspace_id: string; type: "income" | "expense"; event_id: string | null; wallet_id: string | null; category_id: string | null; amount: number; occurred_at: string; payment_method: "pix" | "cash" | "credit_card" | "debit_card" | "bank_transfer" | "other" | null; description: string | null; notes: string | null; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["event_fin_transactions"]["Row"]> & { workspace_id: string; type: "income" | "expense"; amount: number; occurred_at: string };
        Update: Partial<Database["public"]["Tables"]["event_fin_transactions"]["Row"]>;
      };
      event_fin_allocation_sets: {
        Row: { id: string; workspace_id: string; effective_from: string; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["event_fin_allocation_sets"]["Row"]> & { workspace_id: string; effective_from: string };
        Update: Partial<Database["public"]["Tables"]["event_fin_allocation_sets"]["Row"]>;
      };
      event_fin_allocation_items: {
        Row: { id: string; allocation_set_id: string; name: string; percentage: number; sort_order: number };
        Insert: Partial<Database["public"]["Tables"]["event_fin_allocation_items"]["Row"]> & { allocation_set_id: string; name: string; percentage: number };
        Update: Partial<Database["public"]["Tables"]["event_fin_allocation_items"]["Row"]>;
      };
      event_fin_admin_audit_logs: {
        Row: { id: string; admin_user_id: string; target_user_id: string | null; workspace_id: string | null; action: string; metadata: Json; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["event_fin_admin_audit_logs"]["Row"]> & { admin_user_id: string; action: string };
        Update: Partial<Database["public"]["Tables"]["event_fin_admin_audit_logs"]["Row"]>;
      };
    };
    Functions: {
      event_fin_get_dashboard_metrics: {
        Args: { p_workspace_id: string; p_start_date: string; p_end_date: string };
        Returns: Json;
      };
      event_fin_get_monthly_series: {
        Args: { p_workspace_id: string; p_months?: number };
        Returns: Json;
      };
      event_fin_get_event_financials: {
        Args: { p_workspace_id: string };
        Returns: Json;
      };
    };
  };
};
