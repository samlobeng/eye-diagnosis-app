/*
  # Add medical verification fields

  1. Modify `profiles` table
    - Add `medical_license_number` (text)
    - Add `verification_status` (text)
    - Add `verified_at` (timestamp)
    - Add `rejected_reason` (text)

  2. Create `medical_documents` table
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles)
    - `document_type` (text)
    - `file_url` (text)
    - `status` (text)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  3. Security
    - Enable RLS on `medical_documents` table
    - Add policies for authenticated users to manage their own documents
*/

-- Add medical verification fields to profiles table
ALTER TABLE profiles
ADD COLUMN medical_license_number text,
ADD COLUMN verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN verified_at timestamptz,
ADD COLUMN rejected_reason text;

-- Create medical_documents table
CREATE TABLE medical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('license', 'passport', 'selfie')),
  file_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own medical documents"
  ON medical_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medical documents"
  ON medical_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update verification status
CREATE OR REPLACE FUNCTION update_verification_status()
RETURNS trigger AS $$
BEGIN
  -- Check if all required documents are approved
  IF NOT EXISTS (
    SELECT 1 FROM medical_documents
    WHERE user_id = NEW.user_id
    AND status != 'approved'
  ) THEN
    -- Update profile verification status
    UPDATE profiles
    SET verification_status = 'approved',
        verified_at = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update verification status
CREATE TRIGGER on_document_approved
  AFTER UPDATE ON medical_documents
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION update_verification_status(); 