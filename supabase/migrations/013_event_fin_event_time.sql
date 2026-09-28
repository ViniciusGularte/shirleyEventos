alter table event_fin_events
  add column if not exists event_time time;
