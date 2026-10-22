-- Extra collections a product also appears in, next to its primary
-- `category` (which still decides the card color, the "back to collection"
-- link and — via its track — the license). E.g. an IKEA storage insert:
-- category 'ikea-hacks', extra_categories '{organize}'.
--
-- Only collections on the same track as `category` are allowed; that rule
-- is enforced in persistProduct() (src/lib/studio/actions.ts), the single
-- writer for this table. Collection pages match on either column (see
-- getProductsByCategory in src/lib/products.ts).

alter table public.products
  add column extra_categories text[] not null default '{}';

create index products_extra_categories_idx
  on public.products using gin (extra_categories);
