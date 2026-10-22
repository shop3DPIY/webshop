-- Pricing tool (Studio → Pricing).
--
-- 1. pricing_settings: a single row holding the editable price table
--    (per-category base/min/max + the general factors) as jsonb. The
--    shape and the default values live in code (src/lib/pricing/), so a
--    missing row — or a key missing from it — simply falls back to the
--    defaults; nothing is seeded here.
--
-- 2. products: the inputs the calculation needs (complexity, set + part
--    count, STEP included) and, per price tier, both the calculated price
--    and the price actually chosen. `price_cents` (from 0001) is reused as
--    the chosen Persoonlijk price. `price_overrides` lists the tiers whose
--    chosen price was typed in by hand — the recalculate screen skips
--    those by default.

create table public.pricing_settings (
  id integer primary key default 1 check (id = 1),
  settings jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.pricing_settings enable row level security;

create policy "pricing_settings_admin_only"
  on public.pricing_settings for all
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.pricing_settings to authenticated;
grant select, insert, update, delete on public.pricing_settings to service_role;

alter table public.products
  add column complexity text not null default 'standard'
    check (complexity in ('simple', 'standard', 'complex')),
  add column is_set boolean not null default false,
  add column part_count integer not null default 1 check (part_count >= 1),
  add column includes_step boolean not null default false,
  add column price_personal_calc_cents integer,
  add column price_small_cents integer,
  add column price_small_calc_cents integer,
  add column price_unlimited_cents integer,
  add column price_unlimited_calc_cents integer,
  add column price_overrides text[] not null default '{}';
