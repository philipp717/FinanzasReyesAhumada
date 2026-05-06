-- ============================================
-- Fami — Schema de base de datos para Supabase
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Profiles (linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  onboarding_completed boolean default false,
  onboarding_data jsonb default '{}',
  created_at timestamptz default now()
);

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  type text check (type in ('ingreso', 'gasto', 'ahorro', 'deuda')) not null,
  amount numeric(12, 0) not null check (amount > 0),
  category text not null default 'otro',
  description text default '',
  payment_method text default 'efectivo',
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Saving goals
create table if not exists public.saving_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  target_amount numeric(12, 0) not null check (target_amount > 0),
  current_amount numeric(12, 0) default 0 check (current_amount >= 0),
  deadline date not null,
  created_at timestamptz default now()
);

-- ============================================
-- Row Level Security (RLS) — cada usuario
-- solo ve sus propios datos
-- ============================================

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.saving_goals enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can upsert own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Transactions policies
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Saving goals policies
create policy "Users can view own goals"
  on public.saving_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.saving_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.saving_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.saving_goals for delete
  using (auth.uid() = user_id);

-- ============================================
-- Auto-create profile on signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- Indexes para performance
-- ============================================

create index if not exists idx_transactions_user_date
  on public.transactions(user_id, date desc);

create index if not exists idx_saving_goals_user
  on public.saving_goals(user_id);
