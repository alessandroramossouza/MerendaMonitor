
-- Tabela de Ingredientes (Estoque)
create table ingredients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  current_stock numeric not null default 0,
  min_threshold numeric not null default 5,
  unit text not null default 'kg',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Logs de Consumo
create table consumption_logs (
  id uuid default gen_random_uuid() primary key,
  date date default current_date,
  ingredient_id uuid references ingredients(id),
  ingredient_name text not null,
  amount_used numeric not null,
  student_count integer not null,
  grams_per_student numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Dados Iniciais (Opcional - para começar com algo)
insert into ingredients (name, category, current_stock, min_threshold, unit) values
('Arroz Branco', 'Grãos', 150, 20, 'kg'),
('Feijão Carioca', 'Grãos', 80, 15, 'kg'),
('Frango (Peito)', 'Proteínas', 12, 15, 'kg'),
('Macarrão', 'Grãos', 40, 10, 'kg'),
('Cenoura', 'Hortifruti', 5, 8, 'kg');
