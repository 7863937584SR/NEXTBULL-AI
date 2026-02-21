
-- Create broker_connections table to store OAuth tokens
CREATE TABLE public.broker_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker TEXT NOT NULL,
  access_token TEXT,
  token_expiry TIMESTAMPTZ,
  broker_user_id TEXT,
  email TEXT,
  user_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, broker)
);

-- Enable RLS
ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections (without token)
CREATE POLICY "Users can view own broker connections"
  ON public.broker_connections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own connections
CREATE POLICY "Users can insert own broker connections"
  ON public.broker_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update own broker connections"
  ON public.broker_connections FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete own broker connections"
  ON public.broker_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_broker_connections_updated_at
  BEFORE UPDATE ON public.broker_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
