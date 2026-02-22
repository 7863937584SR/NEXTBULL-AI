import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, BarChart3, RefreshCw, AlertCircle, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import StockCharts from '@/components/dashboard/StockCharts';
import TradingViewWidget from '@/components/dashboard/TradingViewWidget';
import GlobalMarketsWidget from '@/components/dashboard/GlobalMarketsWidget';


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

// Gradient themes for index cards
const indexGradients = [
  'from-blue-500/15 via-blue-500/5 to-transparent border-blue-500/25',
  'from-teal-500/15 via-teal-500/5 to-transparent border-teal-500/25',
  'from-cyan-500/15 via-cyan-500/5 to-transparent border-cyan-500/25',
  'from-indigo-500/15 via-indigo-500/5 to-transparent border-indigo-500/25',
];

const iconGradients = [
  'from-blue-500 to-blue-600',
  'from-teal-500 to-emerald-600',
  'from-cyan-500 to-sky-600',
  'from-indigo-500 to-violet-600',
];

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
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const validStocks = useMemo(() => stocks.filter(s => !s.isError), [stocks]);
  const marketUp = indices.length > 0 && !indices[0].isError ? indices[0].change >= 0 : true;
  const gainersCount = useMemo(() => validStocks.filter(s => s.change > 0).length, [validStocks]);
  const losersCount = useMemo(() => validStocks.filter(s => s.change < 0).length, [validStocks]);
  const totalVolume = useMemo(() => {
    const vol = validStocks.reduce((acc, s) => {
      const v = parseFloat(s.volume?.replace(/[^0-9.]/g, '') || '0');
      return acc + v;
    }, 0);
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
    return vol.toFixed(0);
  }, [validStocks]);

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Skeleton header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        {/* Skeleton index cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        {/* Skeleton summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Market Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-IN')}` : 'Connecting...'}
            <span className="text-border">·</span>
            Live NSE data
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={autoRefresh ? 'default' : 'secondary'}
            className={`text-xs px-3 py-1 ${autoRefresh
              ? 'bg-gradient-to-r from-success to-emerald-600 text-white border-0 animate-pulse-glow shadow-lg shadow-success/20'
              : 'bg-secondary text-muted-foreground'
              }`}
          >
            <span className="mr-1.5">{autoRefresh ? '◉' : '○'}</span>
            {autoRefresh ? 'LIVE' : 'PAUSED'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${autoRefresh ? 'animate-spin' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : {}} />
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all h-8 w-8"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ═══════════════ ERROR ALERT ═══════════════ */}
      {error && (
        <Card className="border-destructive/50 bg-gradient-to-r from-destructive/10 to-transparent backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-destructive">Connection Error</p>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════ MARKET INDEX CARDS ═══════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.filter(idx => !idx.isError).map((idx, i) => {
          const up = idx.change >= 0;
          const gradientClass = indexGradients[i % indexGradients.length];
          const iconGradient = iconGradients[i % iconGradients.length];
          return (
            <Card
              key={idx.name}
              className={`relative overflow-hidden bg-gradient-to-br ${gradientClass} border backdrop-blur-sm hover-lift hover-glow group cursor-default`}
            >
              {/* Decorative glow circle */}
              <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${iconGradient} opacity-10 group-hover:opacity-25 transition-opacity duration-500 group-hover-icon`} />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{idx.name}</span>
                  <div className={`p-1.5 rounded-lg ${up ? 'bg-success/15' : 'bg-destructive/15'}`}>
                    {up ? <TrendingUp className="w-3.5 h-3.5 text-success" /> : <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                  {idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center gap-1.5 mt-2 text-sm font-semibold ${up ? 'text-success' : 'text-destructive'}`}>
                  {up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span>{up ? '+' : ''}{idx.change.toFixed(2)}</span>
                  <span className="text-xs opacity-80">({up ? '+' : ''}{idx.changePercent.toFixed(2)}%)</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ═══════════════ MARKET SUMMARY STRIP ═══════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Market Status */}
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover-lift hover-glow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${marketUp
              ? 'bg-gradient-to-br from-success/20 to-emerald-600/10'
              : 'bg-gradient-to-br from-destructive/20 to-red-600/10'
              }`}>
              <Activity className={`w-5 h-5 ${marketUp ? 'text-success' : 'text-destructive'}`} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</p>
              <p className={`text-base font-bold ${marketUp ? 'text-success' : 'text-destructive'}`}>
                {marketUp ? 'Bullish' : 'Bearish'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Gainers */}
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-success/30 transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-success/20 to-emerald-600/10">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Gainers</p>
              <p className="text-base font-bold text-success">{gainersCount} <span className="text-xs font-normal text-muted-foreground">stocks</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Losers */}
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-destructive/30 transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-destructive/20 to-red-600/10">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Losers</p>
              <p className="text-base font-bold text-destructive">{losersCount} <span className="text-xs font-normal text-muted-foreground">stocks</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Volume */}
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-chart-3/30 transition-all duration-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/10">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Volume</p>
              <p className="text-base font-bold text-foreground">{totalVolume}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════ TRADINGVIEW CHART ═══════════════ */}
      <TradingViewWidget symbol="NSE:NIFTY" />

      {/* ═══════════════ CHARTS SECTION ═══════════════ */}
      {validStocks.length > 0 && <StockCharts stocks={validStocks} />}

      {/* ═══════════════ STOCKS TABLE ═══════════════ */}
      <Card className="bg-card/80 border-border/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-0 pt-5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-amber-600/10">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              Top NSE Stocks
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-secondary/50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live · 60s refresh
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border/50 bg-secondary/30">
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Symbol</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Company</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Price (₹)</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Change</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">% Change</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">High</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Low</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Volume</th>
                  <th className="text-right px-6 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-10">Chart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {validStocks.map((stock) => {
                  const up = stock.change >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      className="hover:bg-secondary/40 transition-colors duration-150 group cursor-pointer"
                      onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=NSE%3A${stock.symbol}`, '_blank')}
                      title={`View ${stock.symbol} chart on TradingView`}
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-primary group-hover:text-primary/80 transition-colors">{stock.symbol}</span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">{stock.name}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-foreground tabular-nums">
                        ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3.5 text-right font-semibold tabular-nums ${up ? 'text-success' : 'text-destructive'}`}>
                        {up ? '+' : ''}{stock.change.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3.5 text-right tabular-nums ${up ? 'text-success' : 'text-destructive'}`}>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${up ? 'bg-success/10' : 'bg-destructive/10'}`}>
                          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {up ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-muted-foreground tabular-nums hidden md:table-cell">
                        ₹{stock.high.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-right text-muted-foreground tabular-nums hidden md:table-cell">
                        ₹{stock.low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-right text-muted-foreground hidden lg:table-cell">{stock.volume}</td>
                      <td className="px-6 py-3.5 text-right">
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity inline-block" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════ GLOBAL MARKETS ═══════════════ */}
      <GlobalMarketsWidget />
    </div>
  );
};

export default Dashboard;
