-- Photos buyers add to a website review (up to 3, JPEG, max 1 MB each), uploaded by /api/reviews.
-- Public bucket (the website shows them). Anyone may add a JPEG under web/ (no overwrite, no delete); only the team can remove.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 1048576, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg'];
drop policy if exists "website adds review photos" on storage.objects;
create policy "website adds review photos" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'review-photos' and name like 'web/%' and lower(storage.extension(name)) = 'jpg');
drop policy if exists "team removes review photos" on storage.objects;
create policy "team removes review photos" on storage.objects for delete to authenticated using (bucket_id = 'review-photos' and is_member());
