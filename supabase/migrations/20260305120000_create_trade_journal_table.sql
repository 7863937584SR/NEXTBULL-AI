-- Trade journal entries (manual notes + linked to real trades)
CREATE TABLE IF NOT EXISTS public.trade_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell', 'long', 'short')),
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  quantity NUMERIC NOT NULL,
  pnl NUMERIC,
  fees NUMERIC DEFAULT 0,
  strategy TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  emotion TEXT CHECK (emotion IN ('confident', 'fearful', 'greedy', 'neutral', 'revenge', 'fomo', 'disciplined')),
  screenshot_url TEXT,
  broker TEXT DEFAULT 'delta',
  external_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trade_journal' AND policyname = 'Users can view own journal entries') THEN
    CREATE POLICY "Users can view own journal entries" ON public.trade_journal FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trade_journal' AND policyname = 'Users can insert own journal entries') THEN
    CREATE POLICY "Users can insert own journal entries" ON public.trade_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trade_journal' AND policyname = 'Users can update own journal entries') THEN
    CREATE POLICY "Users can update own journal entries" ON public.trade_journal FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trade_journal' AND policyname = 'Users can delete own journal entries') THEN
    CREATE POLICY "Users can delete own journal entries" ON public.trade_journal FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_trade_journal_user ON public.trade_journal(user_id, trade_date DESC);
