-- Server push of website listings (api/push-listings.js). Run ONCE in Supabase: SQL Editor -> New query -> paste -> Run.
-- Before running, put your own values in the last insert (the Vercel URL, and a secret you make up; see the steps below).
--
-- What it does: when a listing is marked "pending" (changed, not yet on the website), the database calls
-- https://regal-spritz-os.vercel.app/api/push-listings, which sends the whole list to the website backend.
-- The listing is then marked synced. No need to keep RS OS open.

create extension if not exists pg_net with schema extensions;

-- Where to call and the shared secret. Nobody can read this table (no policies), only the database functions below.
create table if not exists public.web_push_config (
  id int primary key default 1 check (id = 1),
  url text not null,
  secret text not null
);
alter table public.web_push_config enable row level security;

-- Calls the Vercel endpoint. Runs after a listing is saved as pending.
create or replace function public.web_push_fire() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare cfg record;
begin
  select url, secret into cfg from public.web_push_config where id = 1;
  if cfg.url is null then return null; end if;
  perform net.http_post(
    url := cfg.url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-rs-push-secret', cfg.secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
  return null;
end $$;

drop trigger if exists web_push_on_pending on public.docs;
create trigger web_push_on_pending
  after insert or update on public.docs
  for each row when (new.col = 'products' and new.data->>'webSync' = 'pending')
  execute function public.web_push_fire();

-- Called by the endpoint after the website took the list: marks the listings it sent as synced.
-- Only listings changed before the endpoint read the list are marked (a change made during the send stays pending).
create or replace function public.web_mark_synced(p_before bigint) returns int
language sql security definer set search_path = public as $$
  with u as (
    update public.docs
       set data = data || jsonb_build_object('webSync', 'synced', 'syncedAt', (extract(epoch from now()) * 1000)::bigint)
     where col = 'products' and data->>'webSync' = 'pending'
       and (case when data->>'editedAt' ~ '^[0-9.]+$' then (data->>'editedAt')::numeric else 0 end) <= p_before
    returning 1)
  select count(*)::int from u;
$$;
revoke all on function public.web_mark_synced(bigint) from public, anon, authenticated;
grant execute on function public.web_mark_synced(bigint) to service_role;

-- YOUR VALUES: url = the Vercel address below; secret = a long random text you make up (keep it private).
-- The same secret goes into Vercel as RS_PUSH_SECRET.
insert into public.web_push_config (id, url, secret)
values (1, 'https://regal-spritz-os.vercel.app/api/push-listings', 'PUT-A-LONG-RANDOM-SECRET-HERE')
on conflict (id) do update set url = excluded.url, secret = excluded.secret;
