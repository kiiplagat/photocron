-- Run this whole file in the Supabase SQL Editor (Project → SQL Editor → New query)

-- 1. PROFILES ---------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are visible to everyone"
  on profiles for select
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);


-- 2. FOLLOWS -----------------------------------------------------------
create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

alter table follows enable row level security;

create policy "Follow relationships are visible to everyone"
  on follows for select
  using (true);

create policy "Users can follow as themselves"
  on follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow as themselves"
  on follows for delete
  using (auth.uid() = follower_id);


-- 3. PHOTOS --------------------------------------------------------------
create table photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  image_url text not null,
  caption text,
  taken_at date not null,
  privacy text not null default 'public' check (privacy in ('public', 'followers', 'private')),
  created_at timestamptz default now()
);

create index photos_user_taken_at_idx on photos (user_id, taken_at desc);

alter table photos enable row level security;

-- This single policy is what makes the three privacy levels real:
-- it's enforced by Postgres on every query, not just hidden in the UI.
create policy "Photo visibility follows its privacy setting"
  on photos for select
  using (
    privacy = 'public'
    or user_id = auth.uid()
    or (
      privacy = 'followers'
      and exists (
        select 1 from follows
        where follows.follower_id = auth.uid()
        and follows.following_id = photos.user_id
      )
    )
  );

create policy "Users can post their own photos"
  on photos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own photos"
  on photos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own photos"
  on photos for delete
  using (auth.uid() = user_id);


-- 4. STORAGE BUCKET --------------------------------------------------------
-- Create this bucket in the Supabase dashboard: Storage → New bucket → name it "photos" → Public bucket = ON
-- (Images are served via public URL; access to the underlying rows/metadata is still gated by the policies above.)

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Anyone can view photo files"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "Authenticated users can upload their own photo files"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
