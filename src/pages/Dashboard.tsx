import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import StockCharts from '@/components/dashboard/StockCharts';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: string;
  isError?: boolean;
}

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  isError?: boolean;
}

const Dashboard = () => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [stocks, setStocks] = useState<StockData[]>([]);
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
      setStocks(data.stocks || []);
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
    // Refresh every 60s to stay within API limits (800/day)
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const validStocks = stocks.filter(s => !s.isError);
  const marketUp = indices.length > 0 && !indices[0].isError ? indices[0].change >= 0 : true;

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
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
            {' · '}Live NSE market data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={autoRefresh ? 'default' : 'secondary'} className={autoRefresh ? 'bg-success text-success-foreground animate-pulse-glow' : ''}>
            {autoRefresh ? '● LIVE' : '● PAUSED'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : {}} />
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
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

      {/* Market Indices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.filter(idx => !idx.isError).map((idx) => {
          const up = idx.change >= 0;
          return (
            <Card key={idx.name} className="bg-card border-border hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">{idx.name}</span>
                  {up ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${up ? 'text-success' : 'text-destructive'}`}>
                  {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{up ? '+' : ''}{idx.change.toFixed(2)}</span>
                  <span>({up ? '+' : ''}{idx.changePercent.toFixed(2)}%)</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Market Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Market Status</p>
              <p className={`text-lg font-bold ${marketUp ? 'text-success' : 'text-destructive'}`}>
                {marketUp ? 'Bullish' : 'Bearish'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gainers</p>
              <p className="text-lg font-bold text-success">
                {validStocks.filter(s => s.change > 0).length} stocks
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Losers</p>
              <p className="text-lg font-bold text-destructive">
                {validStocks.filter(s => s.change < 0).length} stocks
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Charts */}
      {validStocks.length > 0 && <StockCharts stocks={validStocks} />}

      {/* Stocks Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Top NSE Stocks
            </CardTitle>
            <span className="text-xs text-muted-foreground">Live data • Refreshes every 60s</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Symbol</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Company</th>
                  <th className="text-right px-4 py-3 font-medium">Price (₹)</th>
                  <th className="text-right px-4 py-3 font-medium">Change</th>
                  <th className="text-right px-4 py-3 font-medium">% Change</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">High</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Low</th>
                  <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Volume</th>
                </tr>
              </thead>
              <tbody>
                {validStocks.map((stock) => {
                  const up = stock.change >= 0;
                  return (
                    <tr key={stock.symbol} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary">{stock.symbol}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{stock.name}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">
                        ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium tabular-nums ${up ? 'text-success' : 'text-destructive'}`}>
                        {up ? '+' : ''}{stock.change.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums ${up ? 'text-success' : 'text-destructive'}`}>
                        <span className="inline-flex items-center gap-1">
                          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {up ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums hidden md:table-cell">
                        ₹{stock.high.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums hidden md:table-cell">
                        ₹{stock.low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{stock.volume}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
