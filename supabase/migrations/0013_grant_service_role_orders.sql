-- The server (service-role key) records Polar orders and gives buyers
-- their downloads: the webhook and thank-you page write orders, order
-- items and entitlements, and look up the buyer's profile by email.
-- Like products in 0006, these need explicit grants for service_role.
grant usage on schema public to service_role;
grant select on public.profiles to service_role;
grant select, insert, update, delete on public.orders to service_role;
grant select, insert, update, delete on public.order_items to service_role;
grant select, insert, update, delete on public.entitlements to service_role;
