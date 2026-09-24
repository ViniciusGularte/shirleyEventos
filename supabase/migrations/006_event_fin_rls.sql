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
