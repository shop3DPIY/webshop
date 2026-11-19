-- "My materials" for the calculator: each user's own list of filaments
-- (spool price + weight, per seller/discount) and supplies bought in
-- packs (boxes, paper, flyers, magnets…). Picked from in the calculator.
-- Private per user, like calculations.

create table public.calc_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('filament', 'extra', 'packaging', 'marketing')),
  name text not null,
  supplier text not null default '',
  -- Filament: spool price; supplies: price of the pack
  price numeric(10, 2) not null default 0,
  -- Filament: spool weight in grams; supplies: pieces in the pack
  pack_size numeric(10, 2) not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calc_library_user_idx on public.calc_library (user_id, kind, name);

alter table public.calc_library enable row level security;

create policy "calc_library_own"
  on public.calc_library for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.calc_library to authenticated;
grant select, insert, update, delete on public.calc_library to service_role;
