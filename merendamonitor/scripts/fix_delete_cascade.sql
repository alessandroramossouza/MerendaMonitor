
-- SOLUÇÃO DEFINITIVA PARA EXCLUSÃO (CASCADE DELETE)
-- Este comando altera o banco para permitir que, ao excluir um produto,
-- todo o histórico dele (entrada e saída) seja excluído automaticamente.

-- 1. Remover as restrições antigas (que bloqueiam a exclusão)
alter table consumption_logs drop constraint if exists consumption_logs_ingredient_id_fkey;
alter table supply_logs drop constraint if exists supply_logs_ingredient_id_fkey;

-- 2. Recriar as restrições com a regra ON DELETE CASCADE
-- Isso diz ao banco: "Se o ingrediente sumir, apague os logs também"

alter table consumption_logs
  add constraint consumption_logs_ingredient_id_fkey
  foreign key (ingredient_id)
  references ingredients(id)
  on delete cascade;

alter table supply_logs
  add constraint supply_logs_ingredient_id_fkey
  foreign key (ingredient_id)
  references ingredients(id)
  on delete cascade;

-- Confirmação
comment on table ingredients is 'CASCADE DELETE ATIVADO';
