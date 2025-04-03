-- Create a function to handle document insertion
CREATE OR REPLACE FUNCTION public.insert_medical_document(
  p_user_id uuid,
  p_document_type text,
  p_file_url text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO medical_documents (user_id, document_type, file_url)
  VALUES (p_user_id, p_document_type, p_file_url);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_medical_document TO authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own documents" ON medical_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON medical_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON medical_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON medical_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON medical_documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON medical_documents;
DROP POLICY IF EXISTS "Admins can delete all documents" ON medical_documents;

-- Create new policies for medical_documents
CREATE POLICY "Users can view their own documents"
ON medical_documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON medical_documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON medical_documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
ON medical_documents FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_profiles
  WHERE admin_profiles.id = auth.uid()
));

CREATE POLICY "Admins can update all documents"
ON medical_documents FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_profiles
  WHERE admin_profiles.id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM admin_profiles
  WHERE admin_profiles.id = auth.uid()
));

CREATE POLICY "Admins can delete all documents"
ON medical_documents FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_profiles
  WHERE admin_profiles.id = auth.uid()
));

-- Enable RLS
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY; 