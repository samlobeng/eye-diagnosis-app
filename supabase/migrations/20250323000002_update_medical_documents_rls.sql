-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own documents" ON medical_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON medical_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON medical_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON medical_documents;

-- Create new policies that allow document uploads during registration
CREATE POLICY "Allow document uploads during registration"
ON medical_documents
FOR INSERT
TO public
WITH CHECK (
  -- Allow uploads to temp directory without authentication
  (file_url LIKE 'temp/%') OR
  -- Allow authenticated users to upload their own documents
  (auth.uid() = user_id)
);

CREATE POLICY "Users can view their own documents"
ON medical_documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON medical_documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON medical_documents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update storage policies to allow uploads to temp directory
DROP POLICY IF EXISTS "Allow public uploads to temp directory" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload their own documents" ON storage.objects;

CREATE POLICY "Allow public uploads to temp directory"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'medical-documents' AND
  (name LIKE 'temp/%')
);

CREATE POLICY "Allow authenticated users to upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-documents' AND
  (name LIKE auth.uid()::text || '/%')
);

CREATE POLICY "Allow users to read their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  (name LIKE auth.uid()::text || '/%' OR name LIKE 'temp/%')
);

CREATE POLICY "Allow users to update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  (name LIKE auth.uid()::text || '/%')
)
WITH CHECK (
  bucket_id = 'medical-documents' AND
  (name LIKE auth.uid()::text || '/%')
);

CREATE POLICY "Allow users to delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  (name LIKE auth.uid()::text || '/%' OR name LIKE 'temp/%')
); 