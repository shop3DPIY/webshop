-- Fix: handle_new_user() inserted a profile row on signup but never copied
-- the full_name the sign-up form sends in options.data — it only set id
-- and email, so full_name was always NULL regardless of what the user typed.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

-- Backfill any profiles created before this fix (the trigger only affects
-- future signups).
update public.profiles p
set full_name = u.raw_user_meta_data ->> 'full_name'
from auth.users u
where p.id = u.id
  and p.full_name is null
  and u.raw_user_meta_data ->> 'full_name' is not null;
