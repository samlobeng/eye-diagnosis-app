/*
  # Create avatars storage bucket

  1. Storage
    - Create 'avatars' bucket for storing user avatar images
    - Enable public access to avatars
  
  2. Security
    - Add policy for authenticated users to upload their own avatars
    - Add policy for public read access to avatars
*/

-- Create the avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatars
create policy "Users can upload their own avatars"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update their own avatars
create policy "Users can update their own avatars"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to avatars
create policy "Public read access to avatars"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');