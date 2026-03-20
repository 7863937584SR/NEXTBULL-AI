-- Create research_comments table
CREATE TABLE IF NOT EXISTS public.research_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.research_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can read comments
CREATE POLICY "Anyone can read comments"
  ON public.research_comments
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Authenticated users can insert own comments"
  ON public.research_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.research_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can delete any comment
CREATE POLICY "Admin can delete any comment"
  ON public.research_comments
  FOR DELETE
  TO authenticated
  USING (auth.email() = 'surjaroy513@gmail.com');

-- Create index for fast lookups by post
CREATE INDEX idx_research_comments_post_id ON public.research_comments(post_id);
CREATE INDEX idx_research_comments_created_at ON public.research_comments(created_at);
