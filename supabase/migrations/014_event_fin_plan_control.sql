alter table event_fin_workspaces
  add column if not exists plan_started_on date,
  add column if not exists plan_amount numeric(12,2),
  add column if not exists billing_email text,
  add column if not exists billing_phone text,
  add column if not exists payment_due_day smallint,
  add column if not exists next_payment_due_on date,
  add column if not exists last_payment_on date,
  add column if not exists plan_paused_at timestamptz,
  add column if not exists plan_pause_reason text,
  add column if not exists payment_reminder_at timestamptz,
  add column if not exists payment_reminder_channel text,
  add column if not exists payment_reminder_note text,
  add column if not exists plan_notes text;

update event_fin_workspaces
set plan_started_on = created_at::date
where plan_started_on is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'event_fin_workspaces_plan_amount_check') then
    alter table event_fin_workspaces add constraint event_fin_workspaces_plan_amount_check check (plan_amount is null or plan_amount >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'event_fin_workspaces_due_day_check') then
    alter table event_fin_workspaces add constraint event_fin_workspaces_due_day_check check (payment_due_day is null or payment_due_day between 1 and 31);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'event_fin_workspaces_reminder_channel_check') then
    alter table event_fin_workspaces add constraint event_fin_workspaces_reminder_channel_check check (payment_reminder_channel is null or payment_reminder_channel in ('whatsapp', 'email', 'phone', 'other'));
  end if;
end $$;

create index if not exists event_fin_workspaces_next_payment_due_idx on event_fin_workspaces(next_payment_due_on);
create index if not exists event_fin_workspaces_plan_paused_idx on event_fin_workspaces(plan_paused_at) where plan_paused_at is not null;
