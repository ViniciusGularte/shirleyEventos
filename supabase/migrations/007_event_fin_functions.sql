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
