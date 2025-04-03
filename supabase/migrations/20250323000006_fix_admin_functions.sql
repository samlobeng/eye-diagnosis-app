-- Drop dependent policies first
DROP POLICY IF EXISTS "Admins can view all admin profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can insert admin profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can update admin profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can delete admin profiles" ON admin_profiles;

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;

DROP POLICY IF EXISTS "Admins can view all medical documents" ON medical_documents;
DROP POLICY IF EXISTS "Admins can update all medical documents" ON medical_documents;
DROP POLICY IF EXISTS "Admins can delete all medical documents" ON medical_documents;

-- Drop existing functions
DROP FUNCTION IF EXISTS approve_user(UUID);
DROP FUNCTION IF EXISTS is_admin(UUID);

-- Create the is_admin function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_profiles WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the approve_user function
CREATE OR REPLACE FUNCTION approve_user(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can approve users';
  END IF;

  -- Update the user's verification status
  UPDATE profiles
  SET verification_status = 'approved',
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_user(UUID) TO authenticated;

-- Ensure admin_profiles table exists
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on admin_profiles
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_profiles
CREATE POLICY "Admins can view all admin profiles"
ON admin_profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert admin profiles"
ON admin_profiles
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update admin profiles"
ON admin_profiles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete admin profiles"
ON admin_profiles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Create policies for profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all profiles"
ON profiles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Create policies for medical_documents
CREATE POLICY "Admins can view all medical documents"
ON medical_documents
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all medical documents"
ON medical_documents
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all medical documents"
ON medical_documents
FOR DELETE
TO authenticated
USING (is_admin(auth.uid())); 