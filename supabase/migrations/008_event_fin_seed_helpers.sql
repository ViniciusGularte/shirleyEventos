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
