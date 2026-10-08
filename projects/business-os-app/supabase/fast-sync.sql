-- Fast sync for RS OS (2026-10-08): the app keeps a copy of the data on the device and only downloads what changed.
-- 1) updated_at is always set by the server (not the phone's clock), so "changed since" is reliable.
-- 2) An index makes "changed since" quick.
-- 3) doc_deletes remembers deleted rows for 30 days, so devices that were closed also drop them.
create table if not exists public.doc_deletes (path text primary key, col text not null, at timestamptz not null default clock_timestamp());
create index if not exists doc_deletes_at_idx on public.doc_deletes (at);
alter table public.doc_deletes enable row level security;
drop policy if exists doc_deletes_read on public.doc_deletes;
create policy doc_deletes_read on public.doc_deletes for select using (
  path like 'data/users/' || (select auth.uid())::text || '/%' or (path not like 'data/users/%' and (select public.is_member())));

create or replace function public.docs_touch() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := clock_timestamp();
  if tg_op = 'INSERT' then delete from doc_deletes where path = new.path; end if;
  return new;
end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before insert or update on public.docs for each row execute function public.docs_touch();

create or replace function public.docs_tomb() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into doc_deletes(path, col, at) values (old.path, old.col, clock_timestamp()) on conflict (path) do update set at = excluded.at;
  delete from doc_deletes where at < now() - interval '30 days';
  return old;
end $$;
drop trigger if exists docs_tomb on public.docs;
create trigger docs_tomb after delete on public.docs for each row execute function public.docs_tomb();

create index if not exists docs_updated_idx on public.docs (updated_at);
create index if not exists docs_col_updated_idx on public.docs (col, updated_at);
