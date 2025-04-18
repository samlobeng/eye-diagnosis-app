-- Drop existing functions and policies
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.approve_user(uuid);
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create the is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_profiles 
    WHERE id = user_id
  );
END;
$$;

-- Create the approve_user function
CREATE OR REPLACE FUNCTION public.approve_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user(uuid) TO authenticated;

-- Create admin_profiles table if it doesn't exist
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