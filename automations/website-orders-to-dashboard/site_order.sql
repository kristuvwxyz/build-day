alter table public.app_settings add column if not exists site_key text;
update public.app_settings set site_key = 'CHANGE-ME-SECRET-SITE-KEY' where id = 1;

-- Website -> dashboard order inbox. The website calls this once when an order is placed
-- (and again with the same siteRef when payment or status changes). It hands back the RS number.
create or replace function public.site_order(p_key text, p_order jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_ref text := nullif(trim(coalesce(p_order->>'siteRef', '')), '');
  v_row public.docs%rowtype;
  v_num text; v_n int; v_now bigint := (extract(epoch from now()) * 1000)::bigint;
  v_pay text := lower(coalesce(p_order->>'payment', ''));
  v_ful text := lower(coalesce(p_order->>'fulfillment', ''));
  v_items jsonb; v_doc jsonb; v_created bigint; v_chg boolean;
begin
  if p_key is null or not exists (select 1 from app_settings where id = 1 and site_key is not null and site_key = p_key) then
    raise exception 'bad key' using errcode = '28000';
  end if;
  if v_pay not in ('', 'pending', 'paid', 'partially_paid', 'refunded', 'voided') then v_pay := ''; end if;
  if v_ful not in ('', 'unfulfilled', 'on_hold', 'fulfilled', 'delivered', 'cancelled') then v_ful := ''; end if;
  perform pg_advisory_xact_lock(4207);
  if v_ref is not null then
    select * into v_row from docs where col = 'orders' and data->>'siteRef' = v_ref limit 1;
    if found then
      v_chg := (v_pay <> '' and v_pay <> coalesce(v_row.data->>'payment', '')) or (v_ful <> '' and v_ful <> coalesce(v_row.data->>'fulfillment', ''));
      if v_chg then
        update docs set data = data
            || case when v_pay <> '' then jsonb_build_object('payment', v_pay) else '{}'::jsonb end
            || case when v_ful <> '' then jsonb_build_object('fulfillment', v_ful) else '{}'::jsonb end
            || jsonb_build_object('updatedAt', v_now, 'log', coalesce(data->'log', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', v_now, 'by', 'Website',
                 'msg', 'website update:' || case when v_pay <> '' then ' payment ' || v_pay else '' end || case when v_ful <> '' then ' status ' || v_ful else '' end))),
          updated_at = now()
        where path = v_row.path;
      end if;
      return jsonb_build_object('ok', true, 'orderNumber', v_row.data->>'num', 'new', false);
    end if;
  end if;
  select coalesce(max((regexp_match(data->>'num', '(\d+)\s*$'))[1]::int), 1000) into v_n
    from docs where col = 'orders' and data->>'num' ~ '\d+\s*$';
  v_num := 'RS' || (v_n + 1);
  select coalesce(jsonb_agg(jsonb_build_object(
      'name', coalesce(i->>'name', ''), 'qty', greatest(1, coalesce((i->>'qty')::numeric, 1)),
      'price', coalesce((i->>'price')::numeric, 0), 'sku', coalesce(i->>'sku', ''), 'cost', 0, 'productId', coalesce(i->>'productId', ''))), '[]'::jsonb)
    into v_items from jsonb_array_elements(coalesce(p_order->'items', '[]'::jsonb)) i;
  v_created := coalesce((p_order->>'createdAt')::bigint, v_now);
  v_doc := jsonb_build_object(
    'num', v_num, 'siteRef', v_ref, 'platform', 'website', 'source', 'website',
    'customer', coalesce(p_order->>'customer', ''), 'email', coalesce(p_order->>'email', ''), 'phone', coalesce(p_order->>'phone', ''),
    'address', coalesce(p_order->>'address', ''), 'ship', coalesce(p_order->'ship', '{}'::jsonb),
    'courier', coalesce(p_order->>'courier', ''), 'pickup', coalesce((p_order->>'pickup')::boolean, false),
    'items', v_items, 'adjust', coalesce((p_order->>'shipping')::numeric, 0), 'fees', 0,
    'discount', coalesce((p_order->>'discount')::numeric, 0), 'payMethod', coalesce(p_order->>'payMethod', ''),
    'note', coalesce(p_order->>'note', ''), 'tags', coalesce(p_order->'tags', '[]'::jsonb), 'comments', '[]'::jsonb,
    'payment', case when v_pay = '' then 'pending' else v_pay end,
    'fulfillment', case when v_ful = '' then 'unfulfilled' else v_ful end,
    'imported', true, 'noStock', true, 'restocked', false,
    'createdAt', v_created, 'date', to_char(to_timestamp(v_created / 1000.0) at time zone 'Asia/Manila', 'YYYY-MM-DD'),
    'log', jsonb_build_array(jsonb_build_object('at', v_now, 'by', 'Website', 'msg', 'order came in from the website' || coalesce(' (' || v_ref || ')', ''))),
    'updatedAt', v_now);
  insert into docs (path, col, id, data) values ('orders/web-' || v_num, 'orders', 'web-' || v_num, v_doc);
  return jsonb_build_object('ok', true, 'orderNumber', v_num, 'new', true);
end $$;
revoke all on function public.site_order(text, jsonb) from public;
grant execute on function public.site_order(text, jsonb) to anon, authenticated;
