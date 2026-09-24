create or replace function event_fin_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists event_fin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  system_role event_fin_system_role not null default 'student',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_fin_profiles_system_role_idx on event_fin_profiles(system_role);
create index if not exists event_fin_profiles_last_seen_at_idx on event_fin_profiles(last_seen_at);

drop trigger if exists trg_event_fin_profiles_updated_at on event_fin_profiles;
create trigger trg_event_fin_profiles_updated_at before update on event_fin_profiles for each row execute function event_fin_set_updated_at();

create table if not exists event_fin_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status event_fin_workspace_status not null default 'active',
  currency text not null default 'BRL',
  timezone text not null default 'America/Sao_Paulo',
  grace_until timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

drop trigger if exists trg_event_fin_workspaces_updated_at on event_fin_workspaces;
create trigger trg_event_fin_workspaces_updated_at before update on event_fin_workspaces for each row execute function event_fin_set_updated_at();

create table if not exists event_fin_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references event_fin_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role event_fin_member_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create index if not exists event_fin_workspace_members_user_id_idx on event_fin_workspace_members(user_id);
create index if not exists event_fin_workspace_members_workspace_id_idx on event_fin_workspace_members(workspace_id);

create table if not exists event_fin_invites (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  full_name text not null,
  workspace_id uuid references event_fin_workspaces(id) on delete cascade,
  status event_fin_invite_status not null default 'pending',
  auth_user_id uuid references auth.users(id),
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
