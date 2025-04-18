-- Create diagnoses table
CREATE TABLE IF NOT EXISTS diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    disease_name TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Doctors can view their own diagnoses"
    ON diagnoses FOR SELECT
    USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own diagnoses"
    ON diagnoses FOR INSERT
    WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own diagnoses"
    ON diagnoses FOR UPDATE
    USING (auth.uid() = doctor_id)
    WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own diagnoses"
    ON diagnoses FOR DELETE
    USING (auth.uid() = doctor_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS diagnoses_doctor_id_idx ON diagnoses(doctor_id);
CREATE INDEX IF NOT EXISTS diagnoses_patient_id_idx ON diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS diagnoses_disease_name_idx ON diagnoses(disease_name);
CREATE INDEX IF NOT EXISTS diagnoses_created_at_idx ON diagnoses(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_diagnoses_updated_at
    BEFORE UPDATE ON diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 