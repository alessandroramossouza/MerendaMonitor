-- ====================================
-- MERENDAMONITOR - GESTÃO ESCOLAR COMPLETA
-- Sistema de Cadastro de Escola, Funcionários, Professores, Alunos e Presença
-- ====================================

-- 1. TABELA DE ESCOLAS
CREATE TABLE IF NOT EXISTS schools (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  inep_code text unique,
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

-- 2. TABELA DE FUNCIONÁRIOS (Diretores, Coordenadores, Supervisores)
CREATE TABLE IF NOT EXISTS staff (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  role text not null, -- 'director', 'coordinator', 'supervisor'
  cpf text unique,
  enrollment_number text,
  address text,
  phone text,
  email text,
  hire_date date,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. TABELA DE SÉRIES/ANOS
CREATE TABLE IF NOT EXISTS grades (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id) on delete cascade,
  name text not null, -- '1º Ano', '2º Ano', 'Pré-escola', etc.
  education_level text, -- 'infantil', 'fundamental_1', 'fundamental_2', 'medio', 'eja'
  order_index integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. TABELA DE PROFESSORES
CREATE TABLE IF NOT EXISTS teachers (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  cpf text unique,
  enrollment_number text,
  address text,
  phone text,
  email text,
  specialization text, -- 'Matemática', 'Português', 'Polivalente', etc.
  hire_date date,
  is_active boolean default true,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. TABELA DE SALAS/TURMAS
CREATE TABLE IF NOT EXISTS classrooms (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id) on delete cascade,
  grade_id uuid references grades(id) on delete set null,
  teacher_id uuid references teachers(id) on delete set null,
  name text not null, -- 'Sala 1A', 'Turma Azul', etc.
  capacity integer default 30,
  shift text, -- 'morning', 'afternoon', 'evening', 'full_time'
  room_number text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. TABELA DE ALUNOS
CREATE TABLE IF NOT EXISTS students (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id) on delete cascade,
  classroom_id uuid references classrooms(id) on delete set null,
  name text not null,
  birth_date date,
  cpf text unique,
  registration_number text,
  address text,
  
  -- Dados do Responsável
  guardian_name text not null,
  guardian_phone text not null,
  guardian_cpf text,
  guardian_relationship text, -- 'Pai', 'Mãe', 'Avô', 'Tio', etc.
  
  -- Informações Complementares
  has_special_needs boolean default false,
  special_needs_description text,
  has_food_restriction boolean default false,
  food_restriction_description text,
  blood_type text,
  
  -- Status
  enrollment_status text default 'active', -- 'active', 'transferred', 'dropped', 'graduated'
  enrollment_date date,
  photo_url text,
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. TABELA DE PRESENÇA DIÁRIA (CHAMADA)
CREATE TABLE IF NOT EXISTS daily_attendance (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id) on delete cascade,
  classroom_id uuid references classrooms(id) on delete cascade,
  date date not null,
  shift text not null, -- 'morning', 'afternoon', 'evening', 'full_time'
  
  -- Contadores
  total_students integer not null default 0, -- Total de alunos matriculados na sala
  present_count integer not null default 0, -- Quantos vieram
  absent_count integer not null default 0, -- Quantos faltaram
  
  -- Quem registrou
  registered_by_name text,
  registered_by_role text, -- 'teacher', 'coordinator', 'staff'
  
  -- Observações
  notes text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Garantir que só haja um registro por sala por data e turno
  unique(classroom_id, date, shift)
);

-- 8. TABELA DE PRESENÇA INDIVIDUAL (Opcional - para controle detalhado)
CREATE TABLE IF NOT EXISTS student_attendance (
  id uuid default gen_random_uuid() primary key,
  daily_attendance_id uuid references daily_attendance(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  is_present boolean not null,
  arrival_time time,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Garantir que cada aluno só tenha um registro por chamada
  unique(daily_attendance_id, student_id)
);

-- 9. TABELA DE TRANSFERÊNCIAS (Histórico)
CREATE TABLE IF NOT EXISTS student_transfers (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade,
  from_classroom_id uuid references classrooms(id) on delete set null,
  to_classroom_id uuid references classrooms(id) on delete set null,
  transfer_date date not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 10. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_staff_school ON staff(school_id);
CREATE INDEX IF NOT EXISTS idx_grades_school ON grades(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_school ON classrooms(school_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_classroom ON students(classroom_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON daily_attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_classroom ON daily_attendance(classroom_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON student_attendance(student_id);

-- 11. VIEWS ÚTEIS

-- View: Total de alunos presentes por dia na escola inteira
CREATE OR REPLACE VIEW v_school_daily_presence AS
SELECT 
  school_id,
  date,
  SUM(present_count) as total_present,
  SUM(total_students) as total_enrolled,
  ROUND((SUM(present_count)::numeric / NULLIF(SUM(total_students), 0)) * 100, 2) as attendance_rate
FROM daily_attendance
GROUP BY school_id, date;

-- View: Estatísticas por sala
CREATE OR REPLACE VIEW v_classroom_stats AS
SELECT 
  c.id as classroom_id,
  c.name as classroom_name,
  g.name as grade_name,
  t.name as teacher_name,
  c.shift,
  COUNT(s.id) as total_students,
  c.capacity,
  c.capacity - COUNT(s.id) as available_spots
FROM classrooms c
LEFT JOIN grades g ON c.grade_id = g.id
LEFT JOIN teachers t ON c.teacher_id = t.id
LEFT JOIN students s ON s.classroom_id = c.id AND s.enrollment_status = 'active'
WHERE c.is_active = true
GROUP BY c.id, c.name, g.name, t.name, c.shift, c.capacity;

-- 12. DADOS INICIAIS DE EXEMPLO (Escola Demo)
INSERT INTO schools (name, inep_code, address, phone, email, city, state, total_capacity)
VALUES 
  ('Escola Municipal Exemplo', '12345678', 'Rua das Flores, 123', '(11) 3000-0000', 'contato@escolaexemplo.edu.br', 'São Paulo', 'SP', 500)
ON CONFLICT DO NOTHING;

-- Séries de Exemplo
INSERT INTO grades (school_id, name, education_level, order_index)
SELECT 
  s.id,
  grade_name,
  level,
  idx
FROM schools s,
LATERAL (VALUES
  ('Pré-escola', 'infantil', 1),
  ('1º Ano', 'fundamental_1', 2),
  ('2º Ano', 'fundamental_1', 3),
  ('3º Ano', 'fundamental_1', 4),
  ('4º Ano', 'fundamental_1', 5),
  ('5º Ano', 'fundamental_1', 6)
) AS grades_data(grade_name, level, idx)
WHERE s.inep_code = '12345678'
ON CONFLICT DO NOTHING;

-- Commit
COMMIT;

-- ====================================
-- INSTRUÇÕES DE USO:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se todas as tabelas foram criadas
-- 3. Configure as políticas RLS conforme necessário
-- 4. A escola demo será criada automaticamente
-- ====================================
