-- Create saved reports table
CREATE TABLE IF NOT EXISTS public.saved_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on row level security
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own reports"
    ON public.saved_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
    ON public.saved_reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
    ON public.saved_reports
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
