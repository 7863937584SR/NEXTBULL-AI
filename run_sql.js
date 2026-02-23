import axios from 'axios';

const TOKEN = 'sbp_fc0ebdff5d1dc6adf27b3999541bc21680952477';
const PROJECT_REF = 'yauanhuyeuekrippwpgh';

const query = `
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
`;

async function run() {
    try {
        const res = await axios.post(
            `https://api.supabase.com/v1/projects/${PROJECT_REF}/query`,
            { query },
            {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('SQL Execution Success!');
        console.log(res.data);
    } catch (e) {
        console.error('SQL Execution Failed.');
        if (e.response) {
            console.error(e.response.data);
        } else {
            console.error(e.message);
        }
    }
}

run();
