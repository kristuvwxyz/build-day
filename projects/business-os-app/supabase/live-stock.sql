-- Live stock for the public website feed (/api/products, /api/stock). Public on purpose: only listing fields
-- the website already shows (id, kind, names, size, type) plus the stock number and sold-out flag. No customer data.
-- Returns one JSON array (not rows), because Supabase's API sends at most 1,000 rows per answer.
drop function if exists public.live_stock();
create or replace function public.live_stock()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'web_id', d.data->>'webId', 'kind', coalesce(d.data->>'kind', 'onhand'), 'brand', d.data->>'brand', 'name', d.data->>'name',
    'size', d.data->>'size', 'ptype', d.data->>'ptype',
    'stock', case when d.data->>'stock' ~ '^-?[0-9]+(\.[0-9]+)?$' then (d.data->>'stock')::numeric else 0 end,
    'sold_out', coalesce((d.data->>'soldOut')::boolean, false), 'active', true)), '[]'::jsonb)
  from docs d where d.col = 'products' and d.data->>'name' is not null and coalesce(d.data->>'status', 'active') = 'active';
$$;
revoke all on function public.live_stock() from public;
grant execute on function public.live_stock() to anon, authenticated;
