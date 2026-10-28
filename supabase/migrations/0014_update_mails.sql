-- "Update available" mails to buyers (Studio → product → Notify buyers).
--
-- products.update_notified_version: the last version buyers were mailed
-- about, so Studio can show whether the current version still needs a
-- mail (and never mails the same version twice by accident).
--
-- update_mail_optouts: buyers who don't want update mails. Keyed on
-- email so it covers guests without an account too. The unsubscribe link
-- in each mail carries an HMAC of the email (src/lib/updates/server.ts),
-- so no token column is needed. Server-only, like newsletter_subscribers.

alter table public.products add column update_notified_version text;

create table public.update_mail_optouts (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.update_mail_optouts enable row level security;

grant select, insert, update, delete on public.update_mail_optouts to service_role;
