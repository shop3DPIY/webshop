-- Collection texts ("col-<slug>") are edited in Studio → Texts too, so the
-- slug list can't be fixed any more: any lowercase slug is allowed (the
-- app decides which texts exist).
alter table public.legal_documents drop constraint legal_documents_slug_check;
alter table public.legal_documents add constraint legal_documents_slug_check
  check (slug ~ '^[a-z0-9-]{2,60}$');
