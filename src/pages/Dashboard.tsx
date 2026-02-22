import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import TradingViewWidget from '@/components/dashboard/TradingViewWidget';

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  isError?: boolean;
}

const Dashboard = () => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke('stock-data');

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setIndices(data.indices || []);
      setLastUpdated(new Date(data.fetchedAt));
    } catch (err) {
      console.error('Failed to fetch stock data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={autoRefresh ? 'default' : 'secondary'} className={autoRefresh ? 'bg-success text-success-foreground' : ''}>
            {autoRefresh ? '● LIVE' : '● PAUSED'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : {}} />
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* TradingView Chart — full focus */}
      <TradingViewWidget symbol="NSE:NIFTY" />
    </div>
  );
};

export default Dashboard;
