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
