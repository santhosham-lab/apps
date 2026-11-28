-- Daily Spend: private per-user expense storage for Supabase
-- Run this once in Supabase Dashboard -> SQL Editor -> New query.

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null check (char_length(trim(description)) between 1 and 100),
  amount numeric(12,2) not null check (amount > 0),
  spent_on date not null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_spent_on_idx
  on public.expenses (user_id, spent_on desc);

alter table public.expenses enable row level security;

drop policy if exists "Users can read their own expenses" on public.expenses;
create policy "Users can read their own expenses"
  on public.expenses for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their own expenses" on public.expenses;
create policy "Users can add their own expenses"
  on public.expenses for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own expenses" on public.expenses;
create policy "Users can delete their own expenses"
  on public.expenses for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on public.expenses to authenticated;
