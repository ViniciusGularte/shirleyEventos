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
