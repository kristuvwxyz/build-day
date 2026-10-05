-- One RS order-number counter for every channel (website, Messenger, IG, walk-in).
create sequence if not exists public.rs_order_seq minvalue 1;
revoke all on sequence public.rs_order_seq from public, anon, authenticated;

-- The website backend key (same value as RS_BACKEND_KEY in Vercel) is the check for these functions.
update public.app_settings set site_key = 'CHANGE-ME-RS_BACKEND_KEY' where id = 1;

-- Highest RS number already used in the dashboard's own orders.
create or replace function public.rs_max_used() returns int
language sql stable security definer set search_path = public as $$
  select coalesce(max((regexp_match(data->>'num', '^RS(\d+)$', 'i'))[1]::int), 0) from docs where col = 'orders'
$$;
revoke all on function public.rs_max_used() from public, anon, authenticated;

-- Make sure the next number is above p_min (e.g. the highest website order number).
create or replace function public.rs_counter_floor(p_key text, p_min int) returns int
language plpgsql security definer set search_path = public as $$
declare v_last bigint; v_called boolean; v_floor int;
begin
  if p_key is null or not exists (select 1 from app_settings where id = 1 and site_key = p_key) then raise exception 'Not allowed.' using errcode = '28000'; end if;
  perform pg_advisory_xact_lock(4207);
  v_floor := greatest(coalesce(p_min, 0), rs_max_used());
  select last_value, is_called into v_last, v_called from rs_order_seq;
  if (case when v_called then v_last else v_last - 1 end) < v_floor then perform setval('rs_order_seq', v_floor, true); end if;
  select last_value into v_last from rs_order_seq;
  return v_last;
end $$;

-- Hand out the next RS number. Atomic: two orders at the same moment never get the same number.
create or replace function public.next_rs_number(p_key text) returns text
language plpgsql security definer set search_path = public as $$
declare v_last bigint; v_called boolean; v_floor int;
begin
  if p_key is null or not exists (select 1 from app_settings where id = 1 and site_key = p_key) then raise exception 'Not allowed.' using errcode = '28000'; end if;
  perform pg_advisory_xact_lock(4207);
  v_floor := rs_max_used();
  select last_value, is_called into v_last, v_called from rs_order_seq;
  if (case when v_called then v_last else v_last - 1 end) < v_floor then perform setval('rs_order_seq', v_floor, true); end if;
  return 'RS' || nextval('rs_order_seq');
end $$;

revoke all on function public.rs_counter_floor(text, int), public.next_rs_number(text) from public;
grant execute on function public.rs_counter_floor(text, int), public.next_rs_number(text) to anon, authenticated;

-- The old website order inbox is no longer used (website orders are read live; customer details stay on the website).
drop function if exists public.site_order(text, jsonb);

-- Starting point: RS9995 is already used by the first website test order.
select public.rs_counter_floor('CHANGE-ME-RS_BACKEND_KEY', 9995);
