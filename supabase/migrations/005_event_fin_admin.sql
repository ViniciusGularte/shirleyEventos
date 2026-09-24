create table if not exists event_fin_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id),
  target_user_id uuid references auth.users(id),
  workspace_id uuid references event_fin_workspaces(id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
