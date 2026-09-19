-- Origen Manager — esquema PostgreSQL para Supabase.
-- Pegar completo en Supabase > SQL Editor > Run. Es seguro re-ejecutarlo.
-- Multiusuario: cada fila pertenece a auth.uid() y RLS aísla los datos por usuario.

create extension if not exists pgcrypto;

do $$ begin create type client_status as enum ('activo','pausado','pendiente','baja'); exception when duplicate_object then null; end $$;
do $$ begin create type priority as enum ('alta','media','baja'); exception when duplicate_object then null; end $$;

create table if not exists clients (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, company text default '', phone text default '', email text default '', instagram text default '', address text default '', notes text default '',
  status client_status not null default 'activo',
  sessions_month int default 0, posts_month int default 0, reels_month int default 0, stories_month int default 0, other_deliverables text default '',
  created_at timestamptz default now());

create table if not exists workflows (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, job_type text);

create table if not exists workflow_steps (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
  workflow_id uuid not null references workflows on delete cascade,
  position int not null default 0, name text not null, offset_days int not null default 0, duration_min int default 30, priority priority not null default 'media');

create table if not exists services (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
  client_id uuid not null references clients on delete cascade,
  name text not null, price numeric not null check (price >= 0), frequency text not null default 'mensual' check (frequency in ('mensual','trimestral','unico')),
  start_date date not null, pay_day int not null check (pay_day between 1 and 31), status client_status not null default 'activo');

create table if not exists events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
  client_id uuid references clients on delete cascade, workflow_id uuid references workflows on delete set null,
  title text not null, job_type text not null, date date not null, time text default '', description text default '',
  status text not null default 'pendiente' check (status in ('pendiente','completada')));

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
  client_id uuid references clients on delete cascade, event_id uuid references events on delete cascade,
  title text not null, date date not null, time text default '', priority priority not null default 'media',
  status text not null default 'pendiente' check (status in ('pendiente','completada')), duration_min int default 30, notes text default '');

create table if not exists payments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
  client_id uuid not null references clients on delete cascade, service_id uuid references services on delete set null,
  amount numeric not null check (amount >= 0), due_date date not null, paid_date date,
  status text not null default 'pendiente' check (status in ('pendiente','cobrado')), concept text default '');

create table if not exists contents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
  client_id uuid not null references clients on delete cascade,
  kind text not null, title text not null, date date not null, status text not null default 'planificado' check (status in ('planificado','publicado')));

create table if not exists notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
  client_id uuid references clients on delete cascade, body text not null, created_at timestamptz default now());

create table if not exists goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
  metric text not null check (metric in ('clients','revenue')), target numeric not null);

create index if not exists tasks_date on tasks (user_id, date) where status = 'pendiente';
create index if not exists payments_due on payments (user_id, due_date);
create index if not exists events_date on events (user_id, date);

-- Seguridad: cada usuario sólo ve y modifica lo suyo.
do $$ declare t text; begin
  foreach t in array array['clients','workflows','workflow_steps','services','events','tasks','payments','contents','notes','goals'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists own on %I', t);
    execute format('create policy own on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
