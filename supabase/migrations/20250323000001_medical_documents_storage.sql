/*
  # Create medical documents storage bucket

  1. Storage
    - Create 'medical-documents' bucket for storing verification documents
    - Enable public access to documents
  
  2. Security
    - Add policy for authenticated users to upload their own documents
    - Add policy for public read access to documents
*/

-- Create the medical documents bucket
insert into storage.buckets (id, name, public)
values ('medical-documents', 'medical-documents', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload their own documents
create policy "Users can upload their own medical documents"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'medical-documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update their own documents
create policy "Users can update their own medical documents"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'medical-documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'medical-documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to medical documents
create policy "Public read access to medical documents"
  on storage.objects
  for select
  to public
  using (bucket_id = 'medical-documents'); 