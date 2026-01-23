-- Tabela de Escolas
create table schools (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  inep_code text,
  address text,
  phone text,
  email text,
  city text,
  state text,
  zip_code text,
  total_capacity integer default 0,
  logo_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Séries/Anos (1º Ano A, 2º Ano B...)
create table grades (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id),
  name text not null, -- Ex: 1º Ano, Berçário II
  education_level text, -- infantil, fundamental_1, fundamental_2, medio, eja
  order_index integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Professores
create table teachers (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id),
  name text not null,
  cpf text,
  phone text,
  email text,
  specialization text,
  hire_date date,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Salas de Aula / Turmas
create table classrooms (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id),
  grade_id uuid references grades(id),
  teacher_id uuid references teachers(id),
  name text not null, -- Ex: 1º Ano A
  capacity integer default 30,
  shift text check (shift in ('morning', 'afternoon', 'evening', 'full_time')),
  room_number text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Alunos
create table students (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id),
  classroom_id uuid references classrooms(id), -- Turma atual
  name text not null,
  birth_date date,
  cpf text,
  registration_number text, -- Matrícula
  address text,
  
  -- Dados do Responsável
  guardian_name text,
  guardian_phone text,
  guardian_cpf text,
  guardian_relationship text,
  
  -- Saúde e Restrições
  has_special_needs boolean default false,
  special_needs_description text,
  has_food_restriction boolean default false,
  food_restriction_description text,
  blood_type text,
  
  -- Status
  enrollment_status text default 'active', -- active, transferred, dropped, graduated
  enrollment_date date default current_date,
  photo_url text,
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Funcionários (Direção, Secretaria, etc)
create table staff (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id),
  name text not null,
  role text, -- director, coordinator, supervisor
  cpf text,
  phone text,
  email text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabela de Registro Diário de Presença (Cabeçalho por Turma)
create table daily_attendance (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id),
  classroom_id uuid references classrooms(id),
  date date default current_date,
  shift text,
  total_students integer default 0,
  present_count integer default 0,
  absent_count integer default 0,
  registered_by_name text,
  registered_by_role text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(classroom_id, date, shift) -- Evita duplicata para mesma turma/data/turno
);

-- Enable RLS (Row Level Security) - Boa prática, mas inicialmente vamos deixar policies abertas ou genericas para facilitar o MVP
alter table schools enable row level security;
alter table grades enable row level security;
alter table teachers enable row level security;
alter table classrooms enable row level security;
alter table students enable row level security;
alter table staff enable row level security;
alter table daily_attendance enable row level security;

-- Policies (Permite tudo para usuarios autenticados e anonimos por enquanto para nao travar o desenvolvimento)
create policy "Enable all access for all users" on schools for all using (true) with check (true);
create policy "Enable all access for all users" on grades for all using (true) with check (true);
create policy "Enable all access for all users" on teachers for all using (true) with check (true);
create policy "Enable all access for all users" on classrooms for all using (true) with check (true);
create policy "Enable all access for all users" on students for all using (true) with check (true);
create policy "Enable all access for all users" on staff for all using (true) with check (true);
create policy "Enable all access for all users" on daily_attendance for all using (true) with check (true);
