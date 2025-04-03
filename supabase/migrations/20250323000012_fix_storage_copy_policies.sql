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
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (storage.foldername(name))[1] = 'temp' OR
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (storage.foldername(name))[1] = 'temp' OR
    (storage.foldername(name))[1] = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id = 'medical-documents' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (storage.foldername(name))[1] = 'temp' OR
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (storage.foldername(name))[1] = 'temp' OR
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Create a function to handle file copying
CREATE OR REPLACE FUNCTION public.copy_file(
  source_bucket text,
  source_path text,
  dest_bucket text,
  dest_path text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Copy the file
  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  SELECT 
    dest_bucket,
    dest_path,
    auth.uid(),
    metadata
  FROM storage.objects
  WHERE bucket_id = source_bucket AND name = source_path;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.copy_file TO authenticated;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 