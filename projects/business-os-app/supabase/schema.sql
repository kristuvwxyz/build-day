-- Regal Spritz PH: database for the standalone app.
-- How to use: Supabase dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
-- Before running, change YOUR-EMAIL@example.com (near the bottom) to the email you will sign in with as owner.

-- Every record lives in one table, addressed like a folder path: "orders/sh-123", "config/home", "team/m-000001".
create table if not exists public.docs (
  path text primary key,
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists docs_col_idx on public.docs (col);
alter table public.docs replica identity full;

create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  owner_email text not null
);

-- Who is signed in, matched to the team directory (by linked account, email, or mobile number).
create or replace function public.my_member() returns jsonb
language sql stable security definer set search_path = public as $$
  select d.data || jsonb_build_object('_id', d.id) from public.docs d
  where d.col = 'team' and coalesce(d.data->>'status', 'active') <> 'inactive' and (
    d.data->>'uid' = auth.uid()::text
    or (coalesce(auth.jwt()->>'email', '') <> '' and lower(auth.jwt()->>'email') = any (regexp_split_to_array(lower(coalesce(d.data->>'email', '')), '[\s,;]+')))
    or (length(regexp_replace(coalesce(auth.jwt()->>'phone', ''), '\D', '', 'g')) >= 10
        and right(regexp_replace(coalesce(d.data->>'phone', ''), '\D', '', 'g'), 10) = right(regexp_replace(auth.jwt()->>'phone', '\D', '', 'g'), 10))
  ) limit 1
$$;
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_settings s where lower(s.owner_email) = lower(coalesce(auth.jwt()->>'email', '')))
$$;
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_owner() or public.my_member() is not null
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_owner() or coalesce(public.my_member()->>'department', '') in ('CEO', 'ADMIN')
$$;
create or replace function public.owner_email() returns text
language sql stable security definer set search_path = public as $$
  select owner_email from public.app_settings where id = 1 and auth.uid() is not null
$$;

-- Merge fields into a record (like "update"), creating it if needed. Runs with the signed-in person's rights.
create or replace function public.doc_merge(p_path text, p_patch jsonb) returns void
language sql security invoker set search_path = public as $$
  insert into public.docs (path, col, id, data) values (p_path, regexp_replace(p_path, '/[^/]+$', ''), regexp_replace(p_path, '^.*/', ''), p_patch)
  on conflict (path) do update set data = public.docs.data || excluded.data, updated_at = now();
$$;

-- Access rules (row level security): only team members see data; private per-person data stays private.
alter table public.docs enable row level security;
alter table public.app_settings enable row level security;
drop policy if exists docs_read on public.docs;
drop policy if exists docs_insert on public.docs;
drop policy if exists docs_update on public.docs;
drop policy if exists docs_delete on public.docs;
create policy docs_read on public.docs for select to authenticated using (
  (path like 'data/users/' || auth.uid()::text || '/%')
  or (path not like 'data/users/%' and public.is_member())
);
create policy docs_insert on public.docs for insert to authenticated with check (
  (path like 'data/users/' || auth.uid()::text || '/%')
  or (col = 'accessreq' and id = auth.uid()::text)
  or (col in ('config', 'team') and public.is_admin())
  or (col not in ('config', 'team', 'accessreq') and path not like 'data/users/%' and public.is_member())
);
create policy docs_update on public.docs for update to authenticated
using (
  (path like 'data/users/' || auth.uid()::text || '/%')
  or (col = 'accessreq' and (id = auth.uid()::text or public.is_admin()))
  or (col in ('config', 'team') and public.is_admin())
  or (col not in ('config', 'team', 'accessreq') and path not like 'data/users/%' and public.is_member())
)
with check (
  (path like 'data/users/' || auth.uid()::text || '/%')
  or (col = 'accessreq' and (id = auth.uid()::text or public.is_admin()))
  or (col in ('config', 'team') and public.is_admin())
  or (col not in ('config', 'team', 'accessreq') and path not like 'data/users/%' and public.is_member())
);
create policy docs_delete on public.docs for delete to authenticated using (
  (path like 'data/users/' || auth.uid()::text || '/%')
  or (col in ('config', 'team', 'accessreq') and public.is_admin())
  or (col not in ('config', 'team', 'accessreq') and path not like 'data/users/%' and public.is_member())
);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.docs to authenticated;
grant execute on function public.doc_merge(text, jsonb), public.is_member(), public.is_admin(), public.is_owner(), public.my_member(), public.owner_email() to authenticated;
revoke all on public.app_settings from anon, authenticated;

-- Live updates (so everyone sees changes instantly).
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- >>> CHANGE THIS to your own email before you press Run <<<
insert into public.app_settings (id, owner_email) values (1, 'YOUR-EMAIL@example.com')
on conflict (id) do update set owner_email = excluded.owner_email;
