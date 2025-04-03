-- Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL,
    address TEXT,
    medical_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all patients
CREATE POLICY "Allow authenticated users to read patients"
    ON public.patients
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert patients
CREATE POLICY "Allow authenticated users to insert patients"
    ON public.patients
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update patients
CREATE POLICY "Allow authenticated users to update patients"
    ON public.patients
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete patients
CREATE POLICY "Allow authenticated users to delete patients"
    ON public.patients
    FOR DELETE
    TO authenticated
    USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
