-- Newsletter welcome discount: a confirmed new subscriber gets a one-off
-- 10% code (a Polar discount, max 1 use, 60 days). Stored so the same
-- address never gets a second one.
alter table public.newsletter_subscribers
  add column welcome_code text,
  add column welcome_code_at timestamptz;
