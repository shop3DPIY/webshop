-- Commerce provider switch: Payhip → Polar (polar.sh).
--
-- 1. products.commerce_product_ids: the provider's product id per license
--    tier, e.g. {"personal": "<uuid>", "small": "<uuid>", "unlimited": "<uuid>"}.
--    Polar has one product per price, so every tier is its own Polar
--    product; Studio creates/updates them automatically on save
--    (src/lib/commerce/polar/sync.ts). Empty = not listed yet.
--    external_commerce_id (the old single Payhip id) is no longer used.
--
-- 2. orders.payhip_order_id → external_order_id (provider-neutral), plus
--    the checkout session id so the thank-you page can find its order.
--
-- 3. order_items.license_tier: which license the buyer chose.

alter table public.products
  add column commerce_product_ids jsonb not null default '{}';

alter table public.orders
  rename column payhip_order_id to external_order_id;

alter table public.orders
  add column checkout_id text;

create index orders_checkout_id_idx on public.orders (checkout_id);

alter table public.order_items
  add column license_tier text
    check (license_tier in ('personal', 'small', 'unlimited'));
