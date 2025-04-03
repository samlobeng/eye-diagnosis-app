-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;

-- Create new policies
CREATE POLICY "Enable insert for authenticated users only"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for users to own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable update for users to own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users to own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Admin policies
CREATE POLICY "Enable all access for admins"
ON profiles FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM admin_profiles
  WHERE admin_profiles.id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM admin_profiles
  WHERE admin_profiles.id = auth.uid()
));

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 