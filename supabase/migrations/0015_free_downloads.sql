-- Free designs are for newsletter subscribers: the visitor leaves their
-- email (and subscribes), and the download link is mailed to them.
--
-- free_downloads: one row per address + design. The token in the mailed
-- link is the key to the files (src/app/api/free/[token]/[format]); the
-- rows also tell update mails who has the design (src/lib/updates).

alter table public.newsletter_subscribers
  drop constraint newsletter_subscribers_source_check;
alter table public.newsletter_subscribers
  add constraint newsletter_subscribers_source_check
  check (source in ('footer', 'account', 'free_download'));

create table public.free_downloads (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  product_id uuid not null references public.products (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique (email, product_id)
);

alter table public.free_downloads enable row level security;

create policy "free_downloads_admin_read"
  on public.free_downloads for select
  using (public.is_admin());

grant select on public.free_downloads to authenticated;
grant select, insert, update, delete on public.free_downloads to service_role;
