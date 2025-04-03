-- List all existing policies (for reference)
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop all existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_record.policyname);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows users to access their own profile
CREATE POLICY "Users can access their own profile" ON profiles
FOR ALL
USING (auth.uid() = id);

-- Create a policy that allows service role to access all profiles
CREATE POLICY "Service role can access all profiles" ON profiles
FOR ALL
USING (auth.role() = 'service_role'); 