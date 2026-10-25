-- Server push of website listings (api/push-listings.js). Run ONCE in Supabase: SQL Editor -> New query -> paste -> Run.
-- No keys to fill in: it uses the website key already saved in app_settings.site_key (the same as RS_BACKEND_KEY in Vercel).
--
-- What it does: when a listing is marked "pending" (changed, not yet on the website), the database calls
-- https://os.regalspritz.com/api/push-listings, which sends the whole list to the website backend.
-- The listing is then marked synced. No need to keep RS OS open.

create extension if not exists pg_net with schema extensions;

-- Calls the Vercel endpoint after a listing is saved as pending. The key proves the call came from here.
create or replace function public.web_push_fire() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare k text;
begin
  select site_key into k from public.app_settings where id = 1;
  if k is null or k = '' then return null; end if;
  perform net.http_post(
    url := 'https://os.regalspritz.com/api/push-listings',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-rs-push-key', k),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  return null;
end $$;
revoke all on function public.web_push_fire() from public, anon, authenticated;

drop trigger if exists web_push_on_pending on public.docs;
create trigger web_push_on_pending
  after insert or update on public.docs
  for each row when (new.col = 'products' and new.data->>'webSync' = 'pending')
  execute function public.web_push_fire();

-- The endpoint's helpers. Each one needs the website key, so only /api/push-listings can use them.
-- 1. Debounce: p_at set = "this call is the newest"; p_at null = "which call is the newest?"
create or replace function public.web_push_gate(p_key text, p_at bigint) returns bigint
language plpgsql security definer set search_path = public as $$
begin
  if p_key is null or not exists (select 1 from public.app_settings where id = 1 and site_key = p_key) then return null; end if;
  if p_at is not null then
    insert into public.docs (path, col, id, data) values ('webmeta/_push_gate', 'webmeta', '_push_gate', jsonb_build_object('at', p_at))
    on conflict (path) do update set data = jsonb_build_object('at', p_at), updated_at = now();
    return p_at;
  end if;
  return (select (data->>'at')::bigint from public.docs where path = 'webmeta/_push_gate');
end $$;

-- 2. Every listing record, as one JSON array (Supabase sends at most 1,000 rows per answer, so not as rows).
-- Only the fields the website list needs (keeps Supabase data use low): active listings get the website fields,
-- inactive ones only what the order-photo table needs (brand, name, size, first photo).
create or replace function public.web_push_docs(p_key text) returns jsonb
language sql stable security definer set search_path = public as $$
  with t as (
    select d.id, d.data, coalesce(d.data->>'status', 'active') = 'active' as act
    from public.docs d
    where d.col = 'products' and d.data->>'name' is not null
      and p_key is not null and exists (select 1 from public.app_settings s where s.id = 1 and s.site_key = p_key))
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'data', case when act then jsonb_strip_nulls(jsonb_build_object(
      'status', data->'status', 'name', data->'name', 'brand', data->'brand', 'size', data->'size', 'kind', data->'kind',
      'stock', data->'stock', 'webId', data->'webId', 'ptype', data->'ptype', 'imgs', data->'imgs',
      'photo', case when coalesce(data->>'photo', '') like 'data:%' then null else data->'photo' end,
      'webOrder', data->'webOrder', 'createdAt', data->'createdAt', 'rank', data->'rank', 'category', data->'category',
      'price', data->'price', 'compareAt', data->'compareAt', 'wasNull', data->'wasNull', 'notes', data->'notes',
      'accords', data->'accords', 'isNew', data->'isNew', 'badges', data->'badges', 'eta', data->'eta',
      'soldOut', data->'soldOut', 'vac', data->'vac', 'inspiredBy', data->'inspiredBy', 'webCreated', data->'webCreated',
      'description', case when data->>'category' = 'secondreign' then data->'description' else null end))
    else jsonb_strip_nulls(jsonb_build_object(
      'status', data->'status', 'name', data->'name', 'brand', data->'brand', 'size', data->'size',
      'imgs', case when jsonb_typeof(data->'imgs') = 'array' and jsonb_array_length(data->'imgs') > 0 then jsonb_build_array(data->'imgs'->0) end,
      'photo', case when coalesce(data->>'photo', '') like 'data:%' then null else data->'photo' end))
    end)), '[]'::jsonb)
  from t;
$$;

-- 3. After the website took the list: mark the listings it sent as synced.
-- Only listings changed before the endpoint read the list are marked (a change made during the send stays pending).
create or replace function public.web_mark_synced(p_key text, p_before bigint) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if p_key is null or not exists (select 1 from public.app_settings where id = 1 and site_key = p_key) then return null; end if;
  update public.docs
     set data = data || jsonb_build_object('webSync', 'synced', 'syncedAt', (extract(epoch from now()) * 1000)::bigint), updated_at = now()
   where col = 'products' and data->>'webSync' = 'pending'
     and (case when data->>'editedAt' ~ '^[0-9.]+$' then (data->>'editedAt')::numeric else 0 end) <= p_before;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.web_push_gate(text, bigint) from public;
revoke all on function public.web_push_docs(text) from public;
revoke all on function public.web_mark_synced(text, bigint) from public;
grant execute on function public.web_push_gate(text, bigint) to anon, authenticated;
grant execute on function public.web_push_docs(text) to anon, authenticated;
grant execute on function public.web_mark_synced(text, bigint) to anon, authenticated;
