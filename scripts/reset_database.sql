
-- ⚠️ PERIGO: ESTE SCRIPT APAGA TODOS OS DADOS DO SISTEMA ⚠️
-- Ele zera Estoque, Histórico de Entradas e Histórico de Consumo.
-- Não apaga os usuários (logins).

BEGIN;

-- Limpa as tabelas (TRUNCATE é mais rápido que DELETE e reseta IDs se fossem sequenciais)
-- O 'CASCADE' garante que limpa quem depende deles também (logs dependem de ingredientes)

TRUNCATE TABLE public.consumption_logs CASCADE;
TRUNCATE TABLE public.supply_logs CASCADE;
TRUNCATE TABLE public.ingredients CASCADE;

COMMIT;

-- Confirmação visual
SELECT 'O BANCO DE DADOS FOI ZERADO COM SUCESSO. INICIE O CADASTRO DO ZERO.' as status;
