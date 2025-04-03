-- Create analysis_results table
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    confidence FLOAT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all analysis results
CREATE POLICY "Allow authenticated users to read analysis results"
    ON public.analysis_results
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert analysis results
CREATE POLICY "Allow authenticated users to insert analysis results"
    ON public.analysis_results
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update analysis results
CREATE POLICY "Allow authenticated users to update analysis results"
    ON public.analysis_results
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete analysis results
CREATE POLICY "Allow authenticated users to delete analysis results"
    ON public.analysis_results
    FOR DELETE
    TO authenticated
    USING (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_analysis_results_updated_at
    BEFORE UPDATE ON public.analysis_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 