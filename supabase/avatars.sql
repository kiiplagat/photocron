-- Run this in Supabase SQL Editor to enable avatar uploads (Settings page).

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Anyone can view avatar files"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload their own avatar files"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Authenticated users can update their own avatar files"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
