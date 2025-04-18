-- First, ensure the table exists with the correct structure
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT NOT NULL,
    record_number TEXT NOT NULL,
    notes TEXT,
    disclaimer_accepted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Add new columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'record_number') THEN
        ALTER TABLE patients ADD COLUMN record_number TEXT NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'notes') THEN
        ALTER TABLE patients ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'disclaimer_accepted') THEN
        ALTER TABLE patients ADD COLUMN disclaimer_accepted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON patients;

CREATE POLICY "Enable read access for authenticated users" ON patients
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON patients
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON patients
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_record_number ON patients(record_number);
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(full_name); 