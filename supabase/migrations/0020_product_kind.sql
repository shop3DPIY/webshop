-- What a product is: a 3D print design (default) or a sewing pattern
-- (dolls). Patterns hide the printing details on the product page and are
-- delivered as a PDF download (format "PATTERN"). They can be sold on
-- their own or put in a bundle with print designs.
alter table public.products
  add column product_kind text not null default 'print'
    check (product_kind in ('print', 'pattern'));
