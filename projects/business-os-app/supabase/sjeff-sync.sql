-- S-JEFF sheet sync (K, Nov 25, 2026). Used by api/sjeff.js, which a Google Apps Script calls every 30 minutes.
-- Run once in Supabase -> SQL Editor. It adds app_settings.sjeff_key (the Apps Script's password) and two helpers.
-- Both helpers need the website key (site_key, same as RS_BACKEND_KEY) AND the sjeff key.

alter table public.app_settings add column if not exists sjeff_key text;
update public.app_settings set sjeff_key = md5(random()::text || clock_timestamp()::text) || md5(random()::text) where id = 1 and sjeff_key is null;

create or replace function public.sjeff_ok(p_key text, p_secret text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(p_key, '') <> '' and coalesce(p_secret, '') <> '' and exists (
    select 1 from public.app_settings where id = 1 and site_key = p_key and sjeff_key = p_secret)
$$;

-- Everything the sync needs: S-JEFF listings (no photos), open RS OS orders, website order team fields, the sync state.
create or replace function public.sjeff_read(p_key text, p_secret text) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when not public.sjeff_ok(p_key, p_secret) then null else jsonb_build_object(
    'products', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'data', jsonb_strip_nulls(jsonb_build_object(
        'name', d.data->'name', 'brand', d.data->'brand', 'size', d.data->'size', 'ptype', d.data->'ptype', 'kind', d.data->'kind',
        'status', d.data->'status', 'stock', d.data->'stock', 'soldOut', d.data->'soldOut', 'barcode', d.data->'barcode',
        'sjeffKey', d.data->'sjeffKey', 'webId', d.data->'webId', 'category', d.data->'category'))))
      from public.docs d where d.col = 'products'
        and (d.data->>'supplier' ilike 's-jeff%' or d.data->>'importedFrom' ilike 's-jeff%' or d.data ? 'sjeffKey')), '[]'::jsonb),
    'orders', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'data', jsonb_build_object(
        'num', d.data->'num', 'customer', d.data->'customer', 'payment', d.data->'payment', 'fulfillment', d.data->'fulfillment',
        'archived', d.data->'archived', 'items', d.data->'items')))
      from public.docs d where d.col = 'orders' and coalesce((d.data->>'archived')::boolean, false) = false
        and case when d.data->>'createdAt' ~ '^[0-9.]+$' then (d.data->>'createdAt')::numeric else 0 end > extract(epoch from now())::numeric * 1000 - 17280000000::numeric
        and coalesce(d.data->>'fulfillment', '') not in ('fulfilled', 'delivered', 'cancelled')), '[]'::jsonb),
    'webmeta', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'data', d.data - 'log'))
      from public.docs d where d.col = 'webmeta' and d.id <> '_sjeff' and d.data ? 'fulfillment'), '[]'::jsonb),
    'state', (select d.data from public.docs d where d.col = 'webmeta' and d.id = '_sjeff'))
  end
$$;

-- Apply the sync's changes. p = { products: [{id, set}], orders: [{id, set, log}], webmeta: [{id, set, log}], state: {...} }.
create or replace function public.sjeff_write(p_key text, p_secret text, p jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare x jsonb; n int := 0; now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  if not public.sjeff_ok(p_key, p_secret) then return null; end if;
  for x in select * from jsonb_array_elements(coalesce(p->'products', '[]'::jsonb)) loop
    update public.docs set data = data || (x->'set') || jsonb_build_object('webSync', 'pending', 'editedAt', now_ms), updated_at = now()
     where col = 'products' and id = x->>'id';
    n := n + 1;
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p->'orders', '[]'::jsonb)) loop
    update public.docs set data = data || (x->'set') || jsonb_build_object('log',
        coalesce(data->'log', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now_ms, 'by', 'Auto · S-JEFF sync', 'msg', x->>'log'))), updated_at = now()
     where col = 'orders' and id = x->>'id';
    n := n + 1;
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p->'webmeta', '[]'::jsonb)) loop
    insert into public.docs (path, col, id, data, updated_at)
      values ('webmeta/' || (x->>'id'), 'webmeta', x->>'id', (x->'set') || jsonb_build_object('log', jsonb_build_array(jsonb_build_object('at', now_ms, 'by', 'Auto · S-JEFF sync', 'msg', x->>'log'))), now())
      on conflict (path) do update set data = public.docs.data || (x->'set') || jsonb_build_object('log',
        coalesce(public.docs.data->'log', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now_ms, 'by', 'Auto · S-JEFF sync', 'msg', x->>'log'))), updated_at = now();
    n := n + 1;
  end loop;
  if p ? 'state' then
    insert into public.docs (path, col, id, data, updated_at) values ('webmeta/_sjeff', 'webmeta', '_sjeff', p->'state', now())
      on conflict (path) do update set data = p->'state', updated_at = now();
  end if;
  return n;
end $$;

revoke all on function public.sjeff_ok(text, text) from public;
revoke all on function public.sjeff_read(text, text) from public;
revoke all on function public.sjeff_write(text, text, jsonb) from public;
grant execute on function public.sjeff_read(text, text) to anon, authenticated;
grant execute on function public.sjeff_write(text, text, jsonb) to anon, authenticated;
