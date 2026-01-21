
-- Garantir que as tabelas principais tenham acesso liberado (ou via auth)

-- 1. Habilitar RLS nas tabelas (se ainda não estiverem)
alter table ingredients enable row level security;
alter table consumption_logs enable row level security;
alter table supply_logs enable row level security;

-- 2. Criar Políticas de Acesso
-- Permitir que QUALQUER usuário autenticado veja e edite
-- (Simplificação para evitar bloqueios, já que temos admin/cook no front)

-- INGREDIENTS
create policy "Allow all authenticated users to select ingredients"
on ingredients for select to authenticated using (true);

create policy "Allow all authenticated users to insert ingredients"
on ingredients for insert to authenticated with check (true);

create policy "Allow all authenticated users to update ingredients"
on ingredients for update to authenticated using (true);

create policy "Allow all authenticated users to delete ingredients"
on ingredients for delete to authenticated using (true);

-- CONSUMPTION LOGS
create policy "Allow all for consumption logs"
on consumption_logs for all to authenticated using (true);

-- SUPPLY LOGS
create policy "Allow all for supply logs"
on supply_logs for all to authenticated using (true);

-- Como fallback, se quiser permitir acesso anonimo para debug (opcional, manter comentado)
-- create policy "Allow anon select" on ingredients for select to anon using (true);
