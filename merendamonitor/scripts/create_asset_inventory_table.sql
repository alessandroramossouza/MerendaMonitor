-- Tabela de Patrimônio / Inventário de Salas
create table school_assets (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id),
  classroom_id uuid references classrooms(id), -- Se null, pertence à escola em geral (corredor, pátio, etc)
  name text not null, -- Ex: Cadeira, Mesa, Projetor
  category text default 'Mobília', -- Mobília, Eletrônicos, Didático, Outros
  quantity integer default 1,
  condition text default 'Bom', -- Novo, Bom, Regular, Ruim, Inservível
  acquisition_date date,
  estimated_value numeric,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Policy to allow access (standard for MVP)
alter table school_assets enable row level security;
create policy "Enable all access for all users" on school_assets for all using (true) with check (true);
