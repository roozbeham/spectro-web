create extension if not exists "pgcrypto";

create table if not exists public.palettes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Palette',
  seed_hex text not null,
  mode text not null check (mode in ('neutral', 'status')),
  colors jsonb not null default '[]'::jsonb,
  color_data jsonb not null default '[]'::jsonb,
  groups jsonb null,
  settings jsonb not null default '{}'::jsonb,
  source text not null default 'web' check (source in ('web', 'figma', 'api')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists palettes_user_updated_at_idx
  on public.palettes (user_id, updated_at desc);

create index if not exists palettes_updated_at_idx
  on public.palettes (updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists palettes_set_updated_at on public.palettes;

create trigger palettes_set_updated_at
before update on public.palettes
for each row
execute function public.set_updated_at();

alter table public.palettes enable row level security;
