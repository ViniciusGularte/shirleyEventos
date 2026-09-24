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
