-- Live visitors on regalspritz.com: each open tab pings with a random id (no names, no IP) every 30 seconds.
-- "Live" = tabs seen in the last 75 seconds. Old rows are deleted after 10 minutes.
create table if not exists public.live_visits (sid text primary key, path text, seen timestamptz not null default now());
alter table public.live_visits enable row level security;

create or replace function public.live_ping(p_sid text, p_path text default '') returns int
language plpgsql security definer set search_path = public as $$
begin
  if p_sid is null or length(p_sid) < 8 or length(p_sid) > 64 then return 0; end if;
  insert into live_visits(sid, path, seen) values (p_sid, left(coalesce(p_path, ''), 200), now())
    on conflict (sid) do update set seen = now(), path = excluded.path;
  delete from live_visits where seen < now() - interval '10 minutes';
  return (select count(*) from live_visits where seen > now() - interval '75 seconds');
end $$;

create or replace function public.live_count() returns int
language sql security definer set search_path = public as $$
  select count(*)::int from live_visits where seen > now() - interval '75 seconds'
$$;

revoke all on function public.live_ping(text, text) from public;
revoke all on function public.live_count() from public;
grant execute on function public.live_ping(text, text) to anon, authenticated;
grant execute on function public.live_count() to anon, authenticated;
