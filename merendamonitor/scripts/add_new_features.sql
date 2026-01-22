-- ====================================
-- MERENDAMONITOR - NOVAS FUNCIONALIDADES
-- Script de atualização do banco de dados
-- ====================================

-- 1. Atualizar tabela supply_logs (adicionar campo que está no código mas falta no schema)
ALTER TABLE supply_logs ADD COLUMN IF NOT EXISTS expiration_date date;

-- 2. Nova tabela: Receitas/Preparos
CREATE TABLE IF NOT EXISTS recipes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text,
  servings integer not null default 1,
  preparation_time integer, -- minutos
  instructions text,
  cost_per_serving numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Nova tabela: Ingredientes das Receitas
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid references recipes(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete cascade,
  quantity_kg numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Nova tabela: Cardápios Mensais
CREATE TABLE IF NOT EXISTS monthly_menus (
  id uuid default gen_random_uuid() primary key,
  year integer not null,
  month integer not null,
  school_days integer not null,
  estimated_students integer not null,
  status text default 'draft', -- draft, approved, executed
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(year, month)
);

-- 5. Nova tabela: Itens do Cardápio Mensal (dia a dia)
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid default gen_random_uuid() primary key,
  menu_id uuid references monthly_menus(id) on delete cascade,
  date date not null,
  recipe_id uuid references recipes(id),
  planned_students integer,
  actual_students integer,
  status text default 'planned', -- planned, executed, cancelled
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Nova tabela: Controle de Custos
CREATE TABLE IF NOT EXISTS cost_tracking (
  id uuid default gen_random_uuid() primary key,
  ingredient_id uuid references ingredients(id) on delete cascade,
  supply_log_id uuid references supply_logs(id) on delete cascade,
  unit_cost numeric not null, -- custo por kg
  total_cost numeric not null,
  purchase_date date,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Nova tabela: Desperdícios
CREATE TABLE IF NOT EXISTS waste_logs (
  id uuid default gen_random_uuid() primary key,
  date date default current_date,
  ingredient_id uuid references ingredients(id) on delete cascade,
  ingredient_name text not null,
  amount numeric not null,
  reason text, -- expired, spoiled, leftover, other
  cost_impact numeric default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 8. Nova tabela: Calendário Escolar
CREATE TABLE IF NOT EXISTS school_calendar (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  is_school_day boolean default true,
  event_name text, -- feriado, recesso, evento especial
  expected_attendance_rate numeric default 1.0, -- % de presença esperada (0-1)
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 9. Nova tabela: Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact text,
  phone text,
  email text,
  address text,
  rating numeric default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 10. Adicionar relacionamento com fornecedores na tabela supply_logs
ALTER TABLE supply_logs ADD COLUMN IF NOT EXISTS supplier_id uuid references suppliers(id);

-- 11. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_consumption_logs_date ON consumption_logs(date);
CREATE INDEX IF NOT EXISTS idx_consumption_logs_ingredient ON consumption_logs(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_supply_logs_date ON supply_logs(date);
CREATE INDEX IF NOT EXISTS idx_supply_logs_expiration ON supply_logs(expiration_date);
CREATE INDEX IF NOT EXISTS idx_menu_items_date ON menu_items(date);
CREATE INDEX IF NOT EXISTS idx_school_calendar_date ON school_calendar(date);
CREATE INDEX IF NOT EXISTS idx_waste_logs_date ON waste_logs(date);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- 12. Dados iniciais de exemplo (opcional)

-- Exemplo de receitas básicas
INSERT INTO recipes (name, category, servings, preparation_time, instructions, cost_per_serving) 
VALUES 
  ('Arroz com Feijão', 'Básico', 100, 60, 'Cozinhar arroz e feijão separadamente. Servir junto.', 1.50),
  ('Macarrão com Molho', 'Massas', 100, 45, 'Cozinhar macarrão. Preparar molho de tomate. Misturar.', 1.80),
  ('Frango Ensopado', 'Proteínas', 100, 90, 'Refogar frango com temperos. Adicionar legumes. Cozinhar até ficar macio.', 3.50)
ON CONFLICT DO NOTHING;

-- Exemplo de fornecedores
INSERT INTO suppliers (name, contact, phone, email, is_active, rating)
VALUES
  ('Prefeitura Municipal - PNAE', 'Secretaria de Educação', '(11) 3000-0000', 'pnae@prefeitura.gov.br', true, 5),
  ('Agricultura Familiar Local', 'João Silva', '(11) 98000-0000', 'joao@agricfamiliar.com.br', true, 4),
  ('Distribuidora Alimentos Ltda', 'Maria Santos', '(11) 97000-0000', 'maria@distribuidora.com.br', true, 4)
ON CONFLICT DO NOTHING;

-- Commit das alterações
COMMIT;
