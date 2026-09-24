
-- supabase/migrations/001_event_fin_enums.sql

create extension if not exists citext;
create extension if not exists pgcrypto;

do $$ begin
  create type event_fin_system_role as enum ('student', 'platform_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_member_role as enum ('owner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_workspace_status as enum ('active', 'grace', 'suspended', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_event_status as enum ('scheduled', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_transaction_type as enum ('income', 'expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_wallet_type as enum ('cash', 'bank', 'digital', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_payment_method as enum ('pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_invite_status as enum ('pending', 'accepted', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

-- supabase/migrations/002_event_fin_core.sql

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

-- supabase/migrations/003_event_fin_finance.sql

create table if not exists event_fin_clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references event_fin_workspaces(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists event_fin_clients_workspace_id_idx on event_fin_clients(workspace_id);
create index if not exists event_fin_clients_workspace_name_idx on event_fin_clients(workspace_id, name);
drop trigger if exists trg_event_fin_clients_updated_at on event_fin_clients;
create trigger trg_event_fin_clients_updated_at before update on event_fin_clients for each row execute function event_fin_set_updated_at();

create table if not exists event_fin_services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references event_fin_workspaces(id) on delete cascade,
  name text not null,
  default_price numeric(14,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, name)
);
drop trigger if exists trg_event_fin_services_updated_at on event_fin_services;
create trigger trg_event_fin_services_updated_at before update on event_fin_services for each row execute function event_fin_set_updated_at();

create table if not exists event_fin_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references event_fin_workspaces(id) on delete cascade,
  client_id uuid not null references event_fin_clients(id),
  service_id uuid references event_fin_services(id),
  title text,
  service_name_snapshot text not null,
  sale_date date not null,
  event_date date,
  sale_amount numeric(14,2) not null check (sale_amount >= 0),
  status event_fin_event_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz
);
create index if not exists event_fin_events_workspace_id_idx on event_fin_events(workspace_id);
create index if not exists event_fin_events_client_id_idx on event_fin_events(client_id);
create index if not exists event_fin_events_service_id_idx on event_fin_events(service_id);
create index if not exists event_fin_events_event_date_idx on event_fin_events(event_date);
create index if not exists event_fin_events_sale_date_idx on event_fin_events(sale_date);
create index if not exists event_fin_events_status_idx on event_fin_events(status);
create index if not exists event_fin_events_workspace_sale_date_idx on event_fin_events(workspace_id, sale_date);
create index if not exists event_fin_events_workspace_event_date_idx on event_fin_events(workspace_id, event_date);
drop trigger if exists trg_event_fin_events_updated_at on event_fin_events;
create trigger trg_event_fin_events_updated_at before update on event_fin_events for each row execute function event_fin_set_updated_at();

create table if not exists event_fin_wallets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references event_fin_workspaces(id) on delete cascade,
  name text not null,
  type event_fin_wallet_type not null default 'bank',
  opening_balance numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, name)
);
drop trigger if exists trg_event_fin_wallets_updated_at on event_fin_wallets;
create trigger trg_event_fin_wallets_updated_at before update on event_fin_wallets for each row execute function event_fin_set_updated_at();

create table if not exists event_fin_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references event_fin_workspaces(id) on delete cascade,
  name text not null,
  transaction_type event_fin_transaction_type not null default 'expense',
  is_system boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, name, transaction_type)
);
drop trigger if exists trg_event_fin_categories_updated_at on event_fin_categories;
create trigger trg_event_fin_categories_updated_at before update on event_fin_categories for each row execute function event_fin_set_updated_at();

create table if not exists event_fin_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references event_fin_workspaces(id) on delete cascade,
  type event_fin_transaction_type not null,
  event_id uuid references event_fin_events(id) on delete set null,
  wallet_id uuid references event_fin_wallets(id) on delete set null,
  category_id uuid references event_fin_categories(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  occurred_at date not null,
  payment_method event_fin_payment_method,
  description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_fin_expense_requires_category check (type = 'income' or category_id is not null)
);
create index if not exists event_fin_transactions_workspace_id_idx on event_fin_transactions(workspace_id);
create index if not exists event_fin_transactions_event_id_idx on event_fin_transactions(event_id);
create index if not exists event_fin_transactions_wallet_id_idx on event_fin_transactions(wallet_id);
create index if not exists event_fin_transactions_category_id_idx on event_fin_transactions(category_id);
create index if not exists event_fin_transactions_type_idx on event_fin_transactions(type);
create index if not exists event_fin_transactions_occurred_at_idx on event_fin_transactions(occurred_at);
create index if not exists event_fin_transactions_workspace_occurred_at_idx on event_fin_transactions(workspace_id, occurred_at);
create index if not exists event_fin_transactions_workspace_type_occurred_at_idx on event_fin_transactions(workspace_id, type, occurred_at);
create index if not exists event_fin_transactions_event_type_idx on event_fin_transactions(event_id, type);
drop trigger if exists trg_event_fin_transactions_updated_at on event_fin_transactions;
create trigger trg_event_fin_transactions_updated_at before update on event_fin_transactions for each row execute function event_fin_set_updated_at();

-- supabase/migrations/004_event_fin_allocations.sql

create table if not exists event_fin_allocation_sets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references event_fin_workspaces(id) on delete cascade,
  effective_from date not null,
  created_at timestamptz not null default now(),
  unique(workspace_id, effective_from)
);

create table if not exists event_fin_allocation_items (
  id uuid primary key default gen_random_uuid(),
  allocation_set_id uuid not null references event_fin_allocation_sets(id) on delete cascade,
  name text not null,
  percentage numeric(5,2) not null check (percentage >= 0 and percentage <= 100),
  sort_order integer not null default 0,
  unique(allocation_set_id, name)
);

create or replace function event_fin_validate_allocation_total()
returns trigger
language plpgsql
as $$
declare
  total numeric(7,2);
begin
  select coalesce(sum(percentage), 0)
    into total
    from event_fin_allocation_items
   where allocation_set_id = new.allocation_set_id
     and id <> coalesce(new.id, gen_random_uuid());
  if total + new.percentage > 100 then
    raise exception 'Allocation total cannot exceed 100';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_event_fin_allocation_total on event_fin_allocation_items;
create trigger trg_event_fin_allocation_total before insert or update on event_fin_allocation_items for each row execute function event_fin_validate_allocation_total();

-- supabase/migrations/005_event_fin_admin.sql

create table if not exists event_fin_admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id),
  target_user_id uuid references auth.users(id),
  workspace_id uuid references event_fin_workspaces(id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- supabase/migrations/006_event_fin_rls.sql

create or replace function event_fin_is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from event_fin_profiles
    where id = auth.uid()
      and system_role = 'platform_admin'
  ) or auth.role() = 'service_role';
$$;

create or replace function event_fin_user_has_workspace(p_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select auth.role() = 'service_role' or exists (
    select 1 from event_fin_workspace_members
    where user_id = auth.uid()
      and workspace_id = p_workspace_id
  );
$$;

create or replace function event_fin_user_has_active_workspace(p_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select auth.role() = 'service_role' or exists (
    select 1
    from event_fin_workspace_members m
    join event_fin_workspaces w on w.id = m.workspace_id
    where m.user_id = auth.uid()
      and m.workspace_id = p_workspace_id
      and w.status in ('active', 'grace')
  );
$$;

alter table event_fin_profiles enable row level security;
alter table event_fin_workspaces enable row level security;
alter table event_fin_workspace_members enable row level security;
alter table event_fin_invites enable row level security;
alter table event_fin_clients enable row level security;
alter table event_fin_services enable row level security;
alter table event_fin_events enable row level security;
alter table event_fin_wallets enable row level security;
alter table event_fin_categories enable row level security;
alter table event_fin_transactions enable row level security;
alter table event_fin_allocation_sets enable row level security;
alter table event_fin_allocation_items enable row level security;
alter table event_fin_admin_audit_logs enable row level security;

drop policy if exists event_fin_profiles_select_self_or_admin on event_fin_profiles;
create policy event_fin_profiles_select_self_or_admin on event_fin_profiles for select using (id = auth.uid() or event_fin_is_platform_admin());
drop policy if exists event_fin_profiles_update_self on event_fin_profiles;
create policy event_fin_profiles_update_self on event_fin_profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists event_fin_profiles_admin_all on event_fin_profiles;
create policy event_fin_profiles_admin_all on event_fin_profiles for all using (event_fin_is_platform_admin()) with check (event_fin_is_platform_admin());

drop policy if exists event_fin_workspaces_select_member_or_admin on event_fin_workspaces;
create policy event_fin_workspaces_select_member_or_admin on event_fin_workspaces for select using (event_fin_user_has_workspace(id) or event_fin_is_platform_admin());
drop policy if exists event_fin_workspaces_admin_all on event_fin_workspaces;
create policy event_fin_workspaces_admin_all on event_fin_workspaces for all using (event_fin_is_platform_admin()) with check (event_fin_is_platform_admin());

drop policy if exists event_fin_workspace_members_select_member_or_admin on event_fin_workspace_members;
create policy event_fin_workspace_members_select_member_or_admin on event_fin_workspace_members for select using (user_id = auth.uid() or event_fin_is_platform_admin());
drop policy if exists event_fin_workspace_members_admin_all on event_fin_workspace_members;
create policy event_fin_workspace_members_admin_all on event_fin_workspace_members for all using (event_fin_is_platform_admin()) with check (event_fin_is_platform_admin());

drop policy if exists event_fin_invites_admin_all on event_fin_invites;
create policy event_fin_invites_admin_all on event_fin_invites for all using (event_fin_is_platform_admin()) with check (event_fin_is_platform_admin());

drop policy if exists event_fin_audit_admin_select on event_fin_admin_audit_logs;
create policy event_fin_audit_admin_select on event_fin_admin_audit_logs for select using (event_fin_is_platform_admin());
drop policy if exists event_fin_audit_admin_insert on event_fin_admin_audit_logs;
create policy event_fin_audit_admin_insert on event_fin_admin_audit_logs for insert with check (event_fin_is_platform_admin());

drop policy if exists event_fin_clients_student_crud on event_fin_clients;
create policy event_fin_clients_student_crud on event_fin_clients for all using (event_fin_user_has_active_workspace(workspace_id)) with check (event_fin_user_has_active_workspace(workspace_id));
drop policy if exists event_fin_clients_admin_read on event_fin_clients;
create policy event_fin_clients_admin_read on event_fin_clients for select using (event_fin_is_platform_admin());

drop policy if exists event_fin_services_student_crud on event_fin_services;
create policy event_fin_services_student_crud on event_fin_services for all using (event_fin_user_has_active_workspace(workspace_id)) with check (event_fin_user_has_active_workspace(workspace_id));
drop policy if exists event_fin_services_admin_read on event_fin_services;
create policy event_fin_services_admin_read on event_fin_services for select using (event_fin_is_platform_admin());

drop policy if exists event_fin_events_student_crud on event_fin_events;
create policy event_fin_events_student_crud on event_fin_events for all using (event_fin_user_has_active_workspace(workspace_id)) with check (event_fin_user_has_active_workspace(workspace_id));
drop policy if exists event_fin_events_admin_read on event_fin_events;
create policy event_fin_events_admin_read on event_fin_events for select using (event_fin_is_platform_admin());

drop policy if exists event_fin_wallets_student_crud on event_fin_wallets;
create policy event_fin_wallets_student_crud on event_fin_wallets for all using (event_fin_user_has_active_workspace(workspace_id)) with check (event_fin_user_has_active_workspace(workspace_id));
drop policy if exists event_fin_wallets_admin_read on event_fin_wallets;
create policy event_fin_wallets_admin_read on event_fin_wallets for select using (event_fin_is_platform_admin());

drop policy if exists event_fin_categories_student_crud on event_fin_categories;
create policy event_fin_categories_student_crud on event_fin_categories for all using (event_fin_user_has_active_workspace(workspace_id)) with check (event_fin_user_has_active_workspace(workspace_id));
drop policy if exists event_fin_categories_admin_read on event_fin_categories;
create policy event_fin_categories_admin_read on event_fin_categories for select using (event_fin_is_platform_admin());

drop policy if exists event_fin_transactions_student_crud on event_fin_transactions;
create policy event_fin_transactions_student_crud on event_fin_transactions for all using (event_fin_user_has_active_workspace(workspace_id)) with check (event_fin_user_has_active_workspace(workspace_id));
drop policy if exists event_fin_transactions_admin_read on event_fin_transactions;
create policy event_fin_transactions_admin_read on event_fin_transactions for select using (event_fin_is_platform_admin());

drop policy if exists event_fin_allocation_sets_student_crud on event_fin_allocation_sets;
create policy event_fin_allocation_sets_student_crud on event_fin_allocation_sets for all using (event_fin_user_has_active_workspace(workspace_id)) with check (event_fin_user_has_active_workspace(workspace_id));
drop policy if exists event_fin_allocation_sets_admin_read on event_fin_allocation_sets;
create policy event_fin_allocation_sets_admin_read on event_fin_allocation_sets for select using (event_fin_is_platform_admin());

drop policy if exists event_fin_allocation_items_student_crud on event_fin_allocation_items;
create policy event_fin_allocation_items_student_crud on event_fin_allocation_items for all using (
  exists (select 1 from event_fin_allocation_sets s where s.id = allocation_set_id and event_fin_user_has_active_workspace(s.workspace_id))
) with check (
  exists (select 1 from event_fin_allocation_sets s where s.id = allocation_set_id and event_fin_user_has_active_workspace(s.workspace_id))
);
drop policy if exists event_fin_allocation_items_admin_read on event_fin_allocation_items;
create policy event_fin_allocation_items_admin_read on event_fin_allocation_items for select using (event_fin_is_platform_admin());

-- supabase/migrations/007_event_fin_functions.sql

create or replace function event_fin_get_event_financials(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not (event_fin_user_has_workspace(p_workspace_id) or event_fin_is_platform_admin()) then
    raise exception 'not allowed';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(summary))
    from (
      select
        e.id as event_id,
        e.sale_amount,
        coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::numeric(14,2) as received_amount,
        greatest(e.sale_amount - coalesce(sum(t.amount) filter (where t.type = 'income'), 0), 0)::numeric(14,2) as outstanding_amount,
        coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::numeric(14,2) as expense_amount,
        (e.sale_amount - coalesce(sum(t.amount) filter (where t.type = 'expense'), 0))::numeric(14,2) as expected_result
      from event_fin_events e
      left join event_fin_transactions t on t.event_id = e.id
      where e.workspace_id = p_workspace_id
      group by e.id
      order by e.sale_date desc
    ) summary
  ), '[]'::jsonb);
end;
$$;

create or replace function event_fin_get_dashboard_metrics(p_workspace_id uuid, p_start_date date, p_end_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  sold numeric(14,2);
  received numeric(14,2);
  expenses numeric(14,2);
  outstanding numeric(14,2);
  event_count integer;
  completed_event_count integer;
  average_ticket numeric(14,2);
begin
  if not (event_fin_user_has_workspace(p_workspace_id) or event_fin_is_platform_admin()) then
    raise exception 'not allowed';
  end if;

  select
    coalesce(sum(sale_amount) filter (where status <> 'cancelled'), 0),
    count(*) filter (where status <> 'cancelled'),
    count(*) filter (where status = 'completed' and event_date between p_start_date and p_end_date)
  into sold, event_count, completed_event_count
  from event_fin_events
  where workspace_id = p_workspace_id
    and sale_date between p_start_date and p_end_date;

  select
    coalesce(sum(amount) filter (where type = 'income'), 0),
    coalesce(sum(amount) filter (where type = 'expense'), 0)
  into received, expenses
  from event_fin_transactions
  where workspace_id = p_workspace_id
    and occurred_at between p_start_date and p_end_date;

  select coalesce(sum(greatest(e.sale_amount - coalesce(tx.received, 0), 0)), 0)
  into outstanding
  from event_fin_events e
  left join (
    select event_id, sum(amount) as received
    from event_fin_transactions
    where workspace_id = p_workspace_id and type = 'income'
    group by event_id
  ) tx on tx.event_id = e.id
  where e.workspace_id = p_workspace_id
    and e.status <> 'cancelled'
    and e.sale_date between p_start_date and p_end_date;

  average_ticket := case when event_count = 0 then 0 else sold / event_count end;

  return jsonb_build_object(
    'sold', sold,
    'received', received,
    'expenses', expenses,
    'cash_result', received - expenses,
    'outstanding', outstanding,
    'event_count', event_count,
    'completed_event_count', completed_event_count,
    'average_ticket', round(average_ticket, 2)
  );
end;
$$;

create or replace function event_fin_get_monthly_series(p_workspace_id uuid, p_months integer default 6)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not (event_fin_user_has_workspace(p_workspace_id) or event_fin_is_platform_admin()) then
    raise exception 'not allowed';
  end if;

  return coalesce((
    with months as (
      select date_trunc('month', current_date)::date - (interval '1 month' * gs.i) as month_start
      from generate_series(0, greatest(p_months, 1) - 1) as gs(i)
    )
    select jsonb_agg(row_to_json(row_data) order by row_data.month)
    from (
      select
        to_char(m.month_start, 'YYYY-MM') as month,
        coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::numeric(14,2) as received,
        coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::numeric(14,2) as expenses,
        (coalesce(sum(t.amount) filter (where t.type = 'income'), 0) - coalesce(sum(t.amount) filter (where t.type = 'expense'), 0))::numeric(14,2) as result,
        (select count(*) from event_fin_events e where e.workspace_id = p_workspace_id and date_trunc('month', e.event_date)::date = m.month_start)::int as events
      from months m
      left join event_fin_transactions t on t.workspace_id = p_workspace_id and date_trunc('month', t.occurred_at)::date = m.month_start
      group by m.month_start
      order by m.month_start
    ) row_data
  ), '[]'::jsonb);
end;
$$;

-- supabase/migrations/008_event_fin_seed_helpers.sql

create or replace function event_fin_seed_workspace(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  allocation_set_id uuid;
begin
  insert into event_fin_wallets(workspace_id, name, type, opening_balance)
  values (p_workspace_id, 'Caixa Geral', 'cash', 0)
  on conflict (workspace_id, name) do nothing;

  insert into event_fin_services(workspace_id, name)
  values
    (p_workspace_id, 'Assessoria Final'),
    (p_workspace_id, 'Assessoria Parcial'),
    (p_workspace_id, 'Assessoria Completa')
  on conflict (workspace_id, name) do nothing;

  insert into event_fin_categories(workspace_id, name, transaction_type, is_system, sort_order)
  values
    (p_workspace_id, 'Equipe', 'expense', true, 10),
    (p_workspace_id, 'Logística / Transporte', 'expense', true, 20),
    (p_workspace_id, 'Marketing', 'expense', true, 30),
    (p_workspace_id, 'Cursos e Mentorias', 'expense', true, 40),
    (p_workspace_id, 'Internet', 'expense', true, 50),
    (p_workspace_id, 'Telefone', 'expense', true, 60),
    (p_workspace_id, 'Estacionamento', 'expense', true, 70),
    (p_workspace_id, 'Manutenção de veículo', 'expense', true, 80),
    (p_workspace_id, 'Escritório', 'expense', true, 90),
    (p_workspace_id, 'Limpeza', 'expense', true, 100),
    (p_workspace_id, 'Condomínio', 'expense', true, 110),
    (p_workspace_id, 'Impressão', 'expense', true, 120),
    (p_workspace_id, 'Plataforma de Eventos', 'expense', true, 130),
    (p_workspace_id, 'Contador', 'expense', true, 140),
    (p_workspace_id, 'Impostos', 'expense', true, 150),
    (p_workspace_id, 'Material', 'expense', true, 160),
    (p_workspace_id, 'Outros', 'expense', true, 170)
  on conflict (workspace_id, name, transaction_type) do nothing;

  insert into event_fin_allocation_sets(workspace_id, effective_from)
  values (p_workspace_id, date_trunc('month', current_date)::date)
  on conflict (workspace_id, effective_from) do update set effective_from = excluded.effective_from
  returning id into allocation_set_id;

  insert into event_fin_allocation_items(allocation_set_id, name, percentage, sort_order)
  values
    (allocation_set_id, 'Pró-labore', 50, 10),
    (allocation_set_id, 'Reserva de emergência', 20, 20),
    (allocation_set_id, 'Investimento na empresa', 15, 30),
    (allocation_set_id, 'Marketing', 10, 40),
    (allocation_set_id, 'Conhecimento', 5, 50)
  on conflict (allocation_set_id, name) do nothing;
end;
$$;

-- supabase/migrations/009_event_fin_fix_allocation_trigger.sql

create or replace function event_fin_validate_allocation_total()
returns trigger
language plpgsql
as $$
declare
  current_total numeric(7,2);
begin
  select coalesce(sum(item.percentage), 0)
    into current_total
    from event_fin_allocation_items as item
   where item.allocation_set_id = new.allocation_set_id
     and item.id <> coalesce(new.id, gen_random_uuid());

  if current_total + new.percentage > 100 then
    raise exception 'Allocation total cannot exceed 100';
  end if;

  return new;
end;
$$;

-- supabase/migrations/010_event_fin_fix_seed_workspace_variable.sql

create or replace function event_fin_seed_workspace(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allocation_set_id uuid;
begin
  insert into event_fin_wallets(workspace_id, name, type, opening_balance)
  values (p_workspace_id, 'Caixa Geral', 'cash', 0)
  on conflict (workspace_id, name) do nothing;

  insert into event_fin_services(workspace_id, name)
  values
    (p_workspace_id, 'Assessoria Final'),
    (p_workspace_id, 'Assessoria Parcial'),
    (p_workspace_id, 'Assessoria Completa')
  on conflict (workspace_id, name) do nothing;

  insert into event_fin_categories(workspace_id, name, transaction_type, is_system, sort_order)
  values
    (p_workspace_id, 'Equipe', 'expense', true, 10),
    (p_workspace_id, 'Logística / Transporte', 'expense', true, 20),
    (p_workspace_id, 'Marketing', 'expense', true, 30),
    (p_workspace_id, 'Cursos e Mentorias', 'expense', true, 40),
    (p_workspace_id, 'Internet', 'expense', true, 50),
    (p_workspace_id, 'Telefone', 'expense', true, 60),
    (p_workspace_id, 'Estacionamento', 'expense', true, 70),
    (p_workspace_id, 'Manutenção de veículo', 'expense', true, 80),
    (p_workspace_id, 'Escritório', 'expense', true, 90),
    (p_workspace_id, 'Limpeza', 'expense', true, 100),
    (p_workspace_id, 'Condomínio', 'expense', true, 110),
    (p_workspace_id, 'Impressão', 'expense', true, 120),
    (p_workspace_id, 'Plataforma de Eventos', 'expense', true, 130),
    (p_workspace_id, 'Contador', 'expense', true, 140),
    (p_workspace_id, 'Impostos', 'expense', true, 150),
    (p_workspace_id, 'Material', 'expense', true, 160),
    (p_workspace_id, 'Outros', 'expense', true, 170)
  on conflict (workspace_id, name, transaction_type) do nothing;

  insert into event_fin_allocation_sets(workspace_id, effective_from)
  values (p_workspace_id, date_trunc('month', current_date)::date)
  on conflict (workspace_id, effective_from) do update set effective_from = excluded.effective_from
  returning id into v_allocation_set_id;

  insert into event_fin_allocation_items(allocation_set_id, name, percentage, sort_order)
  values
    (v_allocation_set_id, 'Pró-labore', 50, 10),
    (v_allocation_set_id, 'Reserva de emergência', 20, 20),
    (v_allocation_set_id, 'Investimento na empresa', 15, 30),
    (v_allocation_set_id, 'Marketing', 10, 40),
    (v_allocation_set_id, 'Conhecimento', 5, 50)
  on conflict (allocation_set_id, name) do nothing;
end;
$$;

-- supabase/migrations/011_event_fin_prevent_role_escalation.sql

create or replace function event_fin_prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if event_fin_is_platform_admin() then
    return new;
  end if;

  if new.system_role is distinct from old.system_role then
    raise exception 'system_role cannot be changed by this user';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_event_fin_profiles_prevent_role_escalation on event_fin_profiles;
create trigger trg_event_fin_profiles_prevent_role_escalation
before update on event_fin_profiles
for each row
execute function event_fin_prevent_profile_role_escalation();

-- supabase/migrations/012_event_fin_harden_security_definer_rpcs.sql

create or replace function event_fin_get_event_financials(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not (event_fin_user_has_active_workspace(p_workspace_id) or event_fin_is_platform_admin()) then
    raise exception 'not allowed';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(summary))
    from (
      select
        e.id as event_id,
        e.sale_amount,
        coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::numeric(14,2) as received_amount,
        greatest(e.sale_amount - coalesce(sum(t.amount) filter (where t.type = 'income'), 0), 0)::numeric(14,2) as outstanding_amount,
        coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::numeric(14,2) as expense_amount,
        (e.sale_amount - coalesce(sum(t.amount) filter (where t.type = 'expense'), 0))::numeric(14,2) as expected_result
      from event_fin_events e
      left join event_fin_transactions t on t.event_id = e.id
      where e.workspace_id = p_workspace_id
      group by e.id
      order by e.sale_date desc
    ) summary
  ), '[]'::jsonb);
end;
$$;

create or replace function event_fin_get_dashboard_metrics(p_workspace_id uuid, p_start_date date, p_end_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  sold numeric(14,2);
  received numeric(14,2);
  expenses numeric(14,2);
  outstanding numeric(14,2);
  event_count integer;
  completed_event_count integer;
  average_ticket numeric(14,2);
begin
  if not (event_fin_user_has_active_workspace(p_workspace_id) or event_fin_is_platform_admin()) then
    raise exception 'not allowed';
  end if;

  select
    coalesce(sum(sale_amount) filter (where status <> 'cancelled'), 0),
    count(*) filter (where status <> 'cancelled'),
    count(*) filter (where status = 'completed' and event_date between p_start_date and p_end_date)
  into sold, event_count, completed_event_count
  from event_fin_events
  where workspace_id = p_workspace_id
    and sale_date between p_start_date and p_end_date;

  select
    coalesce(sum(amount) filter (where type = 'income'), 0),
    coalesce(sum(amount) filter (where type = 'expense'), 0)
  into received, expenses
  from event_fin_transactions
  where workspace_id = p_workspace_id
    and occurred_at between p_start_date and p_end_date;

  select coalesce(sum(greatest(e.sale_amount - coalesce(tx.received, 0), 0)), 0)
  into outstanding
  from event_fin_events e
  left join (
    select event_id, sum(amount) as received
    from event_fin_transactions
    where workspace_id = p_workspace_id and type = 'income'
    group by event_id
  ) tx on tx.event_id = e.id
  where e.workspace_id = p_workspace_id
    and e.status <> 'cancelled'
    and e.sale_date between p_start_date and p_end_date;

  average_ticket := case when event_count = 0 then 0 else sold / event_count end;

  return jsonb_build_object(
    'sold', sold,
    'received', received,
    'expenses', expenses,
    'cash_result', received - expenses,
    'outstanding', outstanding,
    'event_count', event_count,
    'completed_event_count', completed_event_count,
    'average_ticket', round(average_ticket, 2)
  );
end;
$$;

create or replace function event_fin_get_monthly_series(p_workspace_id uuid, p_months integer default 6)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not (event_fin_user_has_active_workspace(p_workspace_id) or event_fin_is_platform_admin()) then
    raise exception 'not allowed';
  end if;

  return coalesce((
    with months as (
      select date_trunc('month', current_date)::date - (interval '1 month' * gs.i) as month_start
      from generate_series(0, greatest(p_months, 1) - 1) as gs(i)
    )
    select jsonb_agg(row_to_json(row_data) order by row_data.month)
    from (
      select
        to_char(m.month_start, 'YYYY-MM') as month,
        coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::numeric(14,2) as received,
        coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::numeric(14,2) as expenses,
        (coalesce(sum(t.amount) filter (where t.type = 'income'), 0) - coalesce(sum(t.amount) filter (where t.type = 'expense'), 0))::numeric(14,2) as result,
        (select count(*) from event_fin_events e where e.workspace_id = p_workspace_id and date_trunc('month', e.event_date)::date = m.month_start)::int as events
      from months m
      left join event_fin_transactions t on t.workspace_id = p_workspace_id and date_trunc('month', t.occurred_at)::date = m.month_start
      group by m.month_start
      order by m.month_start
    ) row_data
  ), '[]'::jsonb);
end;
$$;

create or replace function event_fin_seed_workspace(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allocation_set_id uuid;
begin
  if auth.role() <> 'service_role' and not event_fin_is_platform_admin() then
    raise exception 'not allowed';
  end if;

  insert into event_fin_wallets(workspace_id, name, type, opening_balance)
  values (p_workspace_id, 'Caixa Geral', 'cash', 0)
  on conflict (workspace_id, name) do nothing;

  insert into event_fin_services(workspace_id, name)
  values
    (p_workspace_id, 'Assessoria Final'),
    (p_workspace_id, 'Assessoria Parcial'),
    (p_workspace_id, 'Assessoria Completa')
  on conflict (workspace_id, name) do nothing;

  insert into event_fin_categories(workspace_id, name, transaction_type, is_system, sort_order)
  values
    (p_workspace_id, 'Equipe', 'expense', true, 10),
    (p_workspace_id, 'Logística / Transporte', 'expense', true, 20),
    (p_workspace_id, 'Marketing', 'expense', true, 30),
    (p_workspace_id, 'Cursos e Mentorias', 'expense', true, 40),
    (p_workspace_id, 'Internet', 'expense', true, 50),
    (p_workspace_id, 'Telefone', 'expense', true, 60),
    (p_workspace_id, 'Estacionamento', 'expense', true, 70),
    (p_workspace_id, 'Manutenção de veículo', 'expense', true, 80),
    (p_workspace_id, 'Escritório', 'expense', true, 90),
    (p_workspace_id, 'Limpeza', 'expense', true, 100),
    (p_workspace_id, 'Condomínio', 'expense', true, 110),
    (p_workspace_id, 'Impressão', 'expense', true, 120),
    (p_workspace_id, 'Plataforma de Eventos', 'expense', true, 130),
    (p_workspace_id, 'Contador', 'expense', true, 140),
    (p_workspace_id, 'Impostos', 'expense', true, 150),
    (p_workspace_id, 'Material', 'expense', true, 160),
    (p_workspace_id, 'Outros', 'expense', true, 170)
  on conflict (workspace_id, name, transaction_type) do nothing;

  insert into event_fin_allocation_sets(workspace_id, effective_from)
  values (p_workspace_id, date_trunc('month', current_date)::date)
  on conflict (workspace_id, effective_from) do update set effective_from = excluded.effective_from
  returning id into v_allocation_set_id;

  insert into event_fin_allocation_items(allocation_set_id, name, percentage, sort_order)
  values
    (v_allocation_set_id, 'Pró-labore', 50, 10),
    (v_allocation_set_id, 'Reserva de emergência', 20, 20),
    (v_allocation_set_id, 'Investimento na empresa', 15, 30),
    (v_allocation_set_id, 'Marketing', 10, 40),
    (v_allocation_set_id, 'Conhecimento', 5, 50)
  on conflict (allocation_set_id, name) do nothing;
end;
$$;

revoke execute on function event_fin_seed_workspace(uuid) from anon, authenticated;
