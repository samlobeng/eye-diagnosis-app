-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;

-- Create new policies with explicit admin role check
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
);

CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  is_admin(auth.uid())
)
WITH CHECK (
  is_admin(auth.uid())
);

CREATE POLICY "Admins can delete all profiles"
ON profiles
FOR DELETE
TO authenticated
USING (
  is_admin(auth.uid())
);

-- Drop existing policies for medical_documents
DROP POLICY IF EXISTS "Admins can view all medical documents" ON medical_documents;
DROP POLICY IF EXISTS "Admins can update all medical documents" ON medical_documents;
DROP POLICY IF EXISTS "Admins can delete all medical documents" ON medical_documents;

-- Create new policies with explicit admin role check
CREATE POLICY "Admins can view all medical documents"
ON medical_documents
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
);

CREATE POLICY "Admins can update all medical documents"
ON medical_documents
FOR UPDATE
TO authenticated
USING (
  is_admin(auth.uid())
)
WITH CHECK (
  is_admin(auth.uid())
);

CREATE POLICY "Admins can delete all medical documents"
ON medical_documents
FOR DELETE
TO authenticated
USING (
  is_admin(auth.uid())
);

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, UPDATE, DELETE ON medical_documents TO authenticated; 