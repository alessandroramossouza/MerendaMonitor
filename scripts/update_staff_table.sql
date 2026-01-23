-- Adiciona colunas faltantes na tabela de funcionários (staff)
alter table staff add column if not exists address text;
alter table staff add column if not exists enrollment_number text;
alter table staff add column if not exists hire_date date;
