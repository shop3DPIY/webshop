-- Business details and legal texts, editable in Studio (Settings / Legal)
-- instead of in code.
--
-- site_settings: one row (id = 1) with the business details as JSON:
--   { companyName, ownerName, street, postcode, city, country, kvk,
--     vatId, iban, contactEmail }
-- Shown in the footer, on the contact page and inside the legal texts
-- ({{kvk}} etc.). The IBAN is stored for your own reference and only
-- appears where a text uses {{iban}}.
--
-- legal_documents: your edited version of each legal page, English and
-- Dutch. No row = the default text from the code
-- (src/content/legal) is shown.
--
-- Server-only (service role), like the other admin tables: no public
-- policies, so the IBAN is never readable from the browser.

create table public.site_settings (
  id integer primary key default 1 check (id = 1),
  business jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.legal_documents (
  slug text primary key
    check (slug in ('privacy', 'cookies', 'terms', 'delivery', 'license')),
  title_en text not null,
  body_en text not null,
  title_nl text not null,
  body_nl text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.legal_documents enable row level security;
grant select, insert, update, delete on public.site_settings to service_role;
grant select, insert, update, delete on public.legal_documents to service_role;
