-- Fix: persistProduct() (src/lib/studio/actions.ts) now writes to
-- `products` via the admin/service-role client for both callers (the
-- Studio form AND the new ingest API route, which has no user session to
-- authenticate "authenticated" role access with). 0003 only granted
-- table privileges to "authenticated" and "anon" (0004) — service_role
-- was never granted anything here, because until this refactor nothing
-- used it for the products table (only for Storage uploads, which use a
-- separate privilege mechanism). Without this, every write 403s with
-- "permission denied for table products" even though the key is valid.

grant select, insert, update, delete on public.products to service_role;
