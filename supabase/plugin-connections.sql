create table if not exists public.plugin_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz null,
  revoked_at timestamptz null,
  figma_user_id text null
);

create index if not exists plugin_connections_user_created_at_idx
  on public.plugin_connections (user_id, created_at desc);

create index if not exists plugin_connections_token_hash_idx
  on public.plugin_connections (token_hash);

alter table public.plugin_connections enable row level security;

drop policy if exists "Users can read their own plugin connections" on public.plugin_connections;

create policy "Users can read their own plugin connections"
on public.plugin_connections
for select
to authenticated
using (auth.uid() = user_id);
