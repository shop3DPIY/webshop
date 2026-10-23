-- Dutch product title and description, shown on the /nl site. The
-- existing title/description columns are the English (default) text.
-- Filled by the "Text with AI" button in Studio and by the ingest script
-- (both via /api/studio/describe), or typed by hand. Empty = the Dutch
-- site falls back to the English text.

alter table public.products
  add column title_nl text,
  add column description_nl text;
