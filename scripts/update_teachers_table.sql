-- Adiciona colunas faltantes na tabela de professores
alter table teachers add column if not exists address text;
alter table teachers add column if not exists enrollment_number text;
