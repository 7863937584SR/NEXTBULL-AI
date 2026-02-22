import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import TradingViewWidget from '@/components/dashboard/TradingViewWidget';

const Dashboard = () => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke('stock-data');
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setLastUpdated(new Date(data.fetchedAt));
    } catch (err) {
      console.error('Failed to fetch stock data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Compact header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">Market Dashboard</h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </span>
          )}
          <Badge
            variant={autoRefresh ? 'default' : 'secondary'}
            className={`text-[10px] h-5 ${autoRefresh ? 'bg-success text-success-foreground' : ''}`}
          >
            {autoRefresh ? '● LIVE' : 'PAUSED'}
          </Badge>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : {}} />
          </Button>
        </div>
      </div>

      {/* Full-height TradingView chart */}
      <div className="flex-1 min-h-0">
        <TradingViewWidget symbol="BSE:SENSEX" />
      </div>
    </div>
  );
};

export default Dashboard;
