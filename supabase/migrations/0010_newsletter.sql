-- Newsletter subscribers. Anyone can sign up from the footer (just an
-- email); account holders can also do it from their account. New
-- subscribers get every category (all_categories = true); the personal
-- link in every mail (/newsletter/<token>) lets them pick categories or
-- unsubscribe without logging in.
--
-- No public RLS policies on purpose: the site only reads/writes this table
-- through server actions with the service-role client (src/lib/newsletter).
-- Admins can read it (Studio → Newsletter).

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  token uuid not null unique default gen_random_uuid(),
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  all_categories boolean not null default true,
  categories text[] not null default '{}',
  locale text not null default 'en',
  source text not null default 'footer' check (source in ('footer', 'account')),
  user_id uuid references public.profiles (id) on delete set null,
  consent_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "newsletter_admin_read"
  on public.newsletter_subscribers for select
  using (public.is_admin());

grant select on public.newsletter_subscribers to authenticated;
grant select, insert, update, delete on public.newsletter_subscribers to service_role;
