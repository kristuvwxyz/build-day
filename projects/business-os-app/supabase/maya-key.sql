-- Maya Checkout public key for RS OS pay links (/api/site maya). Used when MAYA_PUBLIC_KEY isn't set in Vercel.
-- The key itself is saved straight into the database (never in this repo); only /api/site can read it, with RS_BACKEND_KEY.
alter table public.app_settings add column if not exists maya_public_key text;
create or replace function public.maya_key(p_key text) returns text
language sql stable security definer set search_path = public as $$
  select maya_public_key from public.app_settings where id = 1 and p_key is not null and site_key = p_key
$$;
revoke all on function public.maya_key(text) from public;
grant execute on function public.maya_key(text) to anon, authenticated;
