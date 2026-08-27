-- Run this in Supabase SQL Editor.
-- Auto-creates a profile row whenever a new user signs up, using the
-- username passed in at signup. Runs with elevated privileges (security
-- definer) so it isn't blocked by the profiles RLS insert policy.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
