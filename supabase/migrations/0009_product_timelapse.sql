-- Optional timelapse video per product (public URL in the product-images
-- bucket), shown on the product page next to the photos. Uploaded by the
-- ingest script from a video placed loose in the product folder.

alter table public.products
  add column timelapse_url text;
