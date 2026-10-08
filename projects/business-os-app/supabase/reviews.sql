-- Reviews on regalspritz.com, live from RS OS (Admin / Marketing → Reviews).
-- reviews_public(): the shown reviews (no emails, nothing private) for /api/reviews.
-- review_submit(): a review written on the website; saved as "pending" until the team approves it in RS OS.
create or replace function public.reviews_public() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'list', coalesce((select jsonb_agg(jsonb_build_array(
        coalesce(d.data->>'jmId', d.id), coalesce(d.data->>'handle', ''), coalesce(d.data->>'product', ''),
        greatest(1, least(5, round(coalesce((d.data->>'rating')::numeric, 5))))::int, coalesce(d.data->>'date', ''),
        coalesce(nullif(d.data->>'customer', ''), 'Anonymous'), coalesce(d.data->>'title', ''), coalesce(d.data->>'text', ''),
        case when jsonb_typeof(d.data->'pics') = 'array' then d.data->'pics' else '[]'::jsonb end, coalesce(d.data->>'reply', ''))
      order by coalesce(d.data->>'date', '') desc, coalesce((d.data->>'ord')::numeric, 1e9))
      from public.docs d where d.col = 'reviews' and coalesce(d.data->>'status', 'shown') = 'shown'), '[]'::jsonb),
    'alias', coalesce((select data->'alias' from public.docs where path = 'config/reviews'), '{}'::jsonb))
$$;

create or replace function public.review_submit(p jsonb) returns text
language plpgsql volatile security definer set search_path = public as $$
declare
  v_text text := left(btrim(coalesce(p->>'text', '')), 2000);
  v_name text := left(btrim(coalesce(p->>'customer', '')), 80);
  v_id text := 'web' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);
  v_now bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if length(v_text) < 3 then raise exception 'Please write your review.'; end if;
  -- Simple flood guard: at most 30 new website reviews waiting per hour.
  if (select count(*) from public.docs where col = 'reviews' and data->>'status' = 'pending' and updated_at > now() - interval '1 hour') >= 30 then
    raise exception 'Too many reviews right now. Please try again later.'; end if;
  insert into public.docs (path, col, id, data) values ('reviews/' || v_id, 'reviews', v_id, jsonb_build_object(
    'customer', case when coalesce((p->>'anon')::boolean, false) or v_name = '' then 'Anonymous' else v_name end,
    'rating', greatest(1, least(5, coalesce((p->>'rating')::int, 5))),
    'product', left(coalesce(p->>'product', ''), 200), 'handle', left(coalesce(p->>'handle', ''), 200),
    'title', left(btrim(coalesce(p->>'title', '')), 100), 'text', v_text,
    -- Photo links from /api/reviews (our review-photos bucket only), at most 3.
    'pics', coalesce((select jsonb_agg(u) from (select u from jsonb_array_elements_text(case when jsonb_typeof(p->'pics') = 'array' then p->'pics' else '[]'::jsonb end) with ordinality x(u, n)
      where u ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/review-photos/web/[0-9a-f]{32}\.jpg$' order by n limit 3) z), '[]'::jsonb),
    'date', to_char(clock_timestamp() at time zone 'Asia/Manila', 'YYYY-MM-DD'),
    'source', 'Website', 'status', 'pending', 'chunk', 'web', 'createdAt', v_now, 'updatedAt', v_now, 'updatedBy', 'Website'));
  return v_id;
end $$;

revoke all on function public.reviews_public() from public;
revoke all on function public.review_submit(jsonb) from public;
grant execute on function public.reviews_public() to anon, authenticated;
grant execute on function public.review_submit(jsonb) to anon, authenticated;
