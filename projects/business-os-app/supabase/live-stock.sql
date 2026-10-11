-- Live stock for the public website feed (/api/products, /api/stock). Public on purpose: only listing fields
-- the website already shows (id, kind, names, size, type) plus the stock number and sold-out flag. No customer data.
create or replace function public.live_stock()
returns table (id text, web_id text, kind text, brand text, name text, size text, ptype text, stock numeric, sold_out boolean, active boolean)
language sql stable security definer set search_path = public as $$
  select d.id, d.data->>'webId', coalesce(d.data->>'kind', 'onhand'), d.data->>'brand', d.data->>'name', d.data->>'size', d.data->>'ptype',
         case when d.data->>'stock' ~ '^-?[0-9]+(\.[0-9]+)?$' then (d.data->>'stock')::numeric else 0 end, coalesce((d.data->>'soldOut')::boolean, false),
         coalesce(d.data->>'status', 'active') = 'active'
  from docs d where d.col = 'products' and d.data->>'name' is not null;
$$;
revoke all on function public.live_stock() from public;
grant execute on function public.live_stock() to anon, authenticated;
