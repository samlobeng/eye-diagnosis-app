-- Add doctor_id column to analysis_results table
ALTER TABLE analysis_results
ADD COLUMN doctor_id UUID REFERENCES auth.users(id);

-- Add RLS policy for doctor access
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view their own analysis results"
ON analysis_results
FOR SELECT
TO authenticated
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own analysis results"
ON analysis_results
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = doctor_id);

-- Update existing records with the doctor_id from the profiles table
UPDATE analysis_results ar
SET doctor_id = p.id
FROM profiles p
WHERE ar.patient_id = p.id;

-- Make doctor_id required only after all records have been updated
ALTER TABLE analysis_results
ALTER COLUMN doctor_id SET NOT NULL; 