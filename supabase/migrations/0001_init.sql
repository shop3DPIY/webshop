-- 3DPIY initial schema: accounts, products, orders, entitlements.
--
-- This file is NOT applied automatically. Run it once you create a real
-- Supabase project — see SETUP.md for the exact steps (Supabase dashboard
-- SQL editor, or `supabase db push` via the CLI).
--
-- Design notes:
-- - `products` mirrors src/types/product.ts exactly, so the admin studio
--   and the (currently static-JSON) product schema stay compatible.
-- - Payhip stays the payment provider. It doesn't know about our accounts,
--   so `orders` are written by a webhook (service role, bypasses RLS) and
--   linked to a profile by matching email — on signup if the account
--   didn't exist yet (see claim_orders_for_new_profile below).
-- - Paid files are never served directly: product_files are referenced by
--   storage path only, and downloads happen via short-lived signed URLs
--   generated server-side after checking `entitlements`.

-- ---------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  category text not null,
  tags text[] not null default '{}',
  images jsonb not null default '[]',          -- [{ src, alt }]
  download_files jsonb not null default '[]',   -- [{ format, fileName, note, storagePath }]
  dimensions jsonb,                             -- { width, depth, height }
  print_settings jsonb,                         -- { layerHeightMm, recommendedMaterials, supportsRequired, instructions, compatiblePrinters }
  version text not null default '1.0.0',
  last_updated date not null default current_date,
  license_type text not null check (license_type in ('personal', 'commercial', 'enterprise', 'free')),
  is_free boolean not null default false,
  external_commerce_id text,
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  related_product_ids uuid[],
  external_links jsonb,                         -- { printables, makerWorld }
  price_cents integer,                          -- informational only; Payhip is the source of truth for the charged price
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products_select_published_or_admin"
  on public.products for select
  using (publication_status = 'published' or public.is_admin());

create policy "products_write_admin_only"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- orders (written by the Payhip webhook via the service-role client)
-- ---------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  payhip_order_id text unique not null,
  buyer_email text not null,
  customer_id uuid references public.profiles (id),
  total_cents integer,
  currency text,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "orders_select_own_or_admin"
  on public.orders for select
  using (customer_id = auth.uid() or public.is_admin());

create policy "orders_write_admin_only"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id),
  external_product_id text,
  title text,
  price_cents integer
);

alter table public.order_items enable row level security;

create policy "order_items_select_own_or_admin"
  on public.order_items for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );

create policy "order_items_write_admin_only"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- entitlements (who owns what — drives the download library)
-- ---------------------------------------------------------------------
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id),
  order_id uuid references public.orders (id),
  granted_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

alter table public.entitlements enable row level security;

create policy "entitlements_select_own_or_admin"
  on public.entitlements for select
  using (customer_id = auth.uid() or public.is_admin());

create policy "entitlements_write_admin_only"
  on public.entitlements for all
  using (public.is_admin())
  with check (public.is_admin());

-- Claim any pre-existing orders (bought before the account existed) when
-- a new profile is created, matching on email.
create or replace function public.claim_orders_for_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set customer_id = new.id
  where buyer_email = new.email and customer_id is null;

  insert into public.entitlements (customer_id, product_id, order_id)
  select new.id, oi.product_id, oi.order_id
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.customer_id = new.id and oi.product_id is not null
  on conflict (customer_id, product_id) do nothing;

  return new;
end;
$$;

create trigger on_profile_created_claim_orders
  after insert on public.profiles
  for each row execute function public.claim_orders_for_new_profile();

-- ---------------------------------------------------------------------
-- storage buckets: images public, paid files private
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;

create policy "product_files_admin_manage"
  on storage.objects for all
  using (bucket_id = 'product-files' and public.is_admin())
  with check (bucket_id = 'product-files' and public.is_admin());

create policy "product_images_admin_manage"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_update_delete"
  on storage.objects for all
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
