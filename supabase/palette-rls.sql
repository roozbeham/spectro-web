drop policy if exists "Users can read their own palettes" on public.palettes;
drop policy if exists "Users can create their own palettes" on public.palettes;
drop policy if exists "Users can update their own palettes" on public.palettes;
drop policy if exists "Users can delete their own palettes" on public.palettes;

alter table public.palettes enable row level security;

create policy "Users can read their own palettes"
on public.palettes
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own palettes"
on public.palettes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own palettes"
on public.palettes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own palettes"
on public.palettes
for delete
to authenticated
using (auth.uid() = user_id);
