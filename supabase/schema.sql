-- Run this script in Supabase SQL editor
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  gender text,
  birth_date date,
  looking_for text[],
  phone text,
  bio text,
  interests text[],
  avatar_url text,
  consent_terms boolean default false,
  consent_privacy boolean default false,
  consent_marketing boolean default false,
  consent_analytics boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  alter column updated_at set default now();

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Anyone can view profiles" on public.profiles;
create policy "Anyone can view profiles"
  on public.profiles
  for select
  using (true);

drop policy if exists "Users manage their profile" on public.profiles;
create policy "Users manage their profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users update their profile"
  on public.profiles
  for update
  using (auth.uid() = id);


