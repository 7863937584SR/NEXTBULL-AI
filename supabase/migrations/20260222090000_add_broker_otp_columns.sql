
-- Add phone_number and connection_method columns to broker_connections
ALTER TABLE public.broker_connections
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS connection_method TEXT NOT NULL DEFAULT 'api'
    CHECK (connection_method IN ('api', 'otp'));
