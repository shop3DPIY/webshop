-- Fix: public catalog pages (Shop, Collections, product detail,
-- generateStaticParams) are read by visitors who are NOT logged in — on
-- Supabase that's the "anon" role, which only had SELECT on nothing.
-- 0003 granted "authenticated" but missed "anon", so any signed-out
-- visitor hit "permission denied for table products". RLS still limits
-- this to published rows only (see products_select_published_or_admin in
-- 0001) — this grant only unlocks the table in principle.
--
-- Only "products" gets this — profiles/orders/order_items/entitlements
-- stay authenticated-only, unrelated to anonymous catalog browsing.

grant usage on schema public to anon;
grant select on public.products to anon;
