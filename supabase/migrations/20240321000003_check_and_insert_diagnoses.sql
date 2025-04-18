-- Check if diagnoses table exists and has correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'diagnoses') THEN
        RAISE EXCEPTION 'diagnoses table does not exist. Please run the previous migration first.';
    END IF;
END $$;

-- Insert sample data for testing
INSERT INTO diagnoses (doctor_id, patient_id, disease_name, count, created_at)
VALUES 
    ('929983e3-2c32-4d5f-86d6-ded7981cc7f4', '00000000-0000-0000-0000-000000000000', 'Cataract', 5, NOW() - INTERVAL '1 month'),
    ('929983e3-2c32-4d5f-86d6-ded7981cc7f4', '00000000-0000-0000-0000-000000000000', 'Glaucoma', 3, NOW() - INTERVAL '2 weeks'),
    ('929983e3-2c32-4d5f-86d6-ded7981cc7f4', '00000000-0000-0000-0000-000000000000', 'Diabetic Retinopathy', 2, NOW() - INTERVAL '1 week'),
    ('929983e3-2c32-4d5f-86d6-ded7981cc7f4', '00000000-0000-0000-0000-000000000000', 'Macular Degeneration', 4, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING; 