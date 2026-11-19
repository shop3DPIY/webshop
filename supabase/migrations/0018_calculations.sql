-- Saved price calculations (Account → Calculator). Every signed-in
-- customer keeps their own list; Carmen uses the same page. Rows are
-- private: RLS lets each user see and change only their own.

create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default '',
  inputs jsonb not null,
  price_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calculations_user_idx on public.calculations (user_id, updated_at desc);

alter table public.calculations enable row level security;

create policy "calculations_own"
  on public.calculations for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.calculations to authenticated;
grant select, insert, update, delete on public.calculations to service_role;
