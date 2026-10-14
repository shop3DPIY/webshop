-- Fix: enabling Row Level Security restricts which ROWS are visible, but
-- it does not grant baseline TABLE-level privileges. Supabase's dashboard
-- Table Editor auto-grants these; tables created via raw SQL (as we did)
-- do not get them automatically. Without this, every query from the
-- "authenticated" role fails with "permission denied for table X",
-- regardless of what the RLS policies say.
--
-- RLS policies (already in place from 0001) still do their job on top of
-- this: these GRANTs only unlock the table in principle, row-level access
-- is still fully governed by the existing policies.

grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update, delete on public.entitlements to authenticated;
