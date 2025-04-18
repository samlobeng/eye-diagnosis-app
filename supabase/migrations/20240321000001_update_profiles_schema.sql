-- Drop existing document-related tables and functions
DROP TABLE IF EXISTS medical_documents;
DROP FUNCTION IF EXISTS copy_file;
DROP FUNCTION IF EXISTS insert_medical_document;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Update profiles table
ALTER TABLE profiles
  DROP COLUMN IF EXISTS medical_license_number,
  ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- Create new policies
CREATE POLICY "Users can view their own profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profiles"
  ON profiles FOR UPDATE
  USING (auth.uid() = id); 