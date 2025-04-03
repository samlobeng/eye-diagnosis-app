-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;

-- Create new policies for storage.objects
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'medical-documents');

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text OR
  (storage.foldername(name))[1] = 'temp'
);

CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text OR
  (storage.foldername(name))[1] = 'temp'
)
WITH CHECK (
  bucket_id = 'medical-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text OR
  (storage.foldername(name))[1] = 'temp'
);

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text OR
  (storage.foldername(name))[1] = 'temp'
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 