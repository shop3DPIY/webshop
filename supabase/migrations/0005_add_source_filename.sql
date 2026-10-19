-- Internal-only column: the original filename from Carmen's design
-- software (e.g. Fusion 360 / whatever she exports from), kept for her own
-- traceability. Never shown to customers — only read/written from Studio
-- (src/components/studio/ProductForm.tsx) and the local ingest script's
-- API route (src/app/api/studio/ingest/route.ts). The public product
-- mapper in src/lib/products.ts does not select it.

alter table public.products add column source_filename text;
