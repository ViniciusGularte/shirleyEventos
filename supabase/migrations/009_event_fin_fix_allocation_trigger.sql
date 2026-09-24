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
