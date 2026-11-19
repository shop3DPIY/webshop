-- The FAQs (Shop and Business) are edited in Studio → Texts like the
-- legal pages, in the same table.
alter table public.legal_documents drop constraint legal_documents_slug_check;
alter table public.legal_documents add constraint legal_documents_slug_check
  check (slug in ('privacy', 'cookies', 'terms', 'delivery', 'license', 'faq-shop', 'faq-business'));
