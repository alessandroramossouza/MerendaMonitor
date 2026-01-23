-- Tabela de Notificações para Cozinha e outros alertas
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references schools(id),
  type text not null default 'info', -- attendance_alert, low_stock, expiration_warning, etc.
  title text not null,
  message text not null,
  is_read boolean default false,
  metadata jsonb, -- JSON with context like classroom_id, student_count, date
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table notifications enable row level security;
create policy "Enable all access for all users" on notifications for all using (true) with check (true);
