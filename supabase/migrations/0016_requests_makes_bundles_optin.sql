-- Model requests (with voting), customer "makes" photos, bundles,
-- newsletter double opt-in, and the last Payhip leftover.
--
-- Run once in the Supabase SQL editor. Like the newsletter tables, the
-- new tables have no public RLS policies: the site only reads/writes
-- them through server code with the service-role client.

-- ---------------------------------------------------------------------
-- 1. Payhip is gone: drop its old single product id.
-- ---------------------------------------------------------------------
alter table public.products drop column if exists external_commerce_id;

-- ---------------------------------------------------------------------
-- 2. Newsletter double opt-in. New footer/free-download signups start as
--    'pending' and only become 'subscribed' after clicking the link in
--    the confirmation mail. Existing subscribers stay as they are.
-- ---------------------------------------------------------------------
alter table public.newsletter_subscribers
  drop constraint newsletter_subscribers_status_check;
alter table public.newsletter_subscribers
  add constraint newsletter_subscribers_status_check
  check (status in ('pending', 'subscribed', 'unsubscribed'));
alter table public.newsletter_subscribers
  add column confirm_sent_at timestamptz,
  add column confirmed_at timestamptz;

-- ---------------------------------------------------------------------
-- 3. Model requests ("I'd like a design for …" / "something's wrong
--    with …"). Requests Carmen approves in Studio (status open/planned/
--    done) show on /requests, where signed-in visitors can vote.
--    'new' = not reviewed yet, 'declined' = hidden. Problem reports are
--    never public.
-- ---------------------------------------------------------------------
create table public.model_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'request' check (kind in ('request', 'problem')),
  title text not null,
  details text not null default '',
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  email text not null check (email = lower(email)),
  user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'open', 'planned', 'done', 'declined')),
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.model_request_votes (
  request_id uuid not null references public.model_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

alter table public.model_requests enable row level security;
alter table public.model_request_votes enable row level security;
grant select, insert, update, delete on public.model_requests to service_role;
grant select, insert, update, delete on public.model_request_votes to service_role;

-- ---------------------------------------------------------------------
-- 4. Customer "makes": owners of a design upload a photo of their print;
--    it shows on the product page once approved in Studio. Rejecting
--    deletes the row and the photo.
-- ---------------------------------------------------------------------
create table public.customer_makes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null default '',
  caption text not null default '',
  image_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index customer_makes_product_idx on public.customer_makes (product_id, status);

alter table public.customer_makes enable row level security;
grant select, insert, update, delete on public.customer_makes to service_role;

-- Public bucket: approved photos are shown on the site. Pending ones
-- have unguessable names and are only linked from Studio.
insert into storage.buckets (id, name, public)
values ('customer-makes', 'customer-makes', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 5. Bundles: a product whose bundle_product_ids is non-empty is a bundle.
--    Buying it gives the buyer every included design (see fulfill.ts);
--    the signup trigger below does the same for guest purchases.
-- ---------------------------------------------------------------------
alter table public.products
  add column bundle_product_ids uuid[] not null default '{}';

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

  -- The designs inside any bundle they bought.
  insert into public.entitlements (customer_id, product_id, order_id)
  select new.id, included.product_id, oi.order_id
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  join public.products p on p.id = oi.product_id
  cross join lateral unnest(p.bundle_product_ids) as included(product_id)
  where o.customer_id = new.id
  on conflict (customer_id, product_id) do nothing;

  return new;
end;
$$;
