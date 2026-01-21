
-- ⚠️ SCRIPT DE EMERGÊNCIA - LIBERAÇÃO TOTAL ⚠️
-- Este script desativa temporariamente as travas de segurança (RLS)
-- para garantir que o problema não seja permissão de acesso.

-- 1. Desativar RLS (Row Level Security) - Permite acesso livre
alter table public.ingredients disable row level security;
alter table public.consumption_logs disable row level security;
alter table public.supply_logs disable row level security;
alter table public.profiles disable row level security;

-- 2. Garantir permissões para todos os roles (anon e authenticated)
grant usage on schema public to postgres, anon, authenticated, service_role;

grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;

-- 3. Verificação (Opcional - apenas para registro)
comment on table public.ingredients is 'RLS DESATIVADO - ACESSO LIVRE';
