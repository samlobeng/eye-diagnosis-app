-- Create admin role
CREATE ROLE admin;

-- Grant necessary permissions to admin role
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO admin;

-- Create admin profiles table
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies for admin_profiles
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin profiles"
ON admin_profiles
FOR SELECT
TO admin
USING (true);

CREATE POLICY "Admins can insert admin profiles"
ON admin_profiles
FOR INSERT
TO admin
WITH CHECK (true);

CREATE POLICY "Admins can update admin profiles"
ON admin_profiles
FOR UPDATE
TO admin
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete admin profiles"
ON admin_profiles
FOR DELETE
TO admin
USING (true);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_profiles WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for profiles table to allow admin access
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO admin
USING (true);

CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO admin
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete all profiles"
ON profiles
FOR DELETE
TO admin
USING (true);

-- Create RLS policies for medical_documents table to allow admin access
CREATE POLICY "Admins can view all medical documents"
ON medical_documents
FOR SELECT
TO admin
USING (true);

CREATE POLICY "Admins can update all medical documents"
ON medical_documents
FOR UPDATE
TO admin
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete all medical documents"
ON medical_documents
FOR DELETE
TO admin
USING (true);

-- Create function to approve user
CREATE OR REPLACE FUNCTION approve_user(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET verification_status = 'approved',
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 