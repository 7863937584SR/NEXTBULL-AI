import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  MessageSquare,
  ArrowUp,
  Flame,
  Shield,
  Eye,
  Zap,
  Globe,
  Map,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ── TYPES ──
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

interface RedditPost {
  title: string;
  upvotes: number;
  comments: number;
  url: string;
  subreddit: string;
  time: string;
}

// ── SENTIMENT COMPUTATION ──
function computeStockSentiment(stock: StockData): number {
  // Derive sentiment from price change, range position, and volatility
  const changeFactor = Math.min(Math.max(stock.changePercent * 10 + 50, 5), 95);
  const range = stock.high - stock.low;
  const rangePosRaw = range > 0 ? ((stock.price - stock.low) / range) * 100 : 50;
  const rangePos = Math.min(Math.max(rangePosRaw, 10), 90);
  return Math.round(changeFactor * 0.65 + rangePos * 0.35);
}

function computeMarketBreadth(stocks: StockData[]): {
  advancers: number;
  decliners: number;
  unchanged: number;
  breadthRatio: number;
} {
  const advancers = stocks.filter(s => s.change > 0.01).length;
  const decliners = stocks.filter(s => s.change < -0.01).length;
  const unchanged = stocks.length - advancers - decliners;
  const breadthRatio = stocks.length > 0 ? advancers / stocks.length : 0.5;
  return { advancers, decliners, unchanged, breadthRatio };
}

function computeFearGreed(stocks: StockData[], index?: IndexData): number {
  if (stocks.length === 0) return 50;
  const avgChange = stocks.reduce((acc, s) => acc + s.changePercent, 0) / stocks.length;
  const advRatio = stocks.filter(s => s.change > 0).length / stocks.length;
  const idxFactor = index && !index.isError ? Math.min(Math.max(index.changePercent * 8 + 50, 10), 90) : 50;

  return Math.round(
    Math.min(Math.max(avgChange * 10 + 50, 5), 95) * 0.3 +
    advRatio * 100 * 0.3 +
    idxFactor * 0.4
  );
}

function getSentimentLabel(val: number): string {
  if (val >= 75) return 'Extreme Greed';
  if (val >= 60) return 'Bullish';
  if (val >= 45) return 'Neutral';
  if (val >= 30) return 'Bearish';
  return 'Extreme Fear';
}

function getSentimentColor(val: number): string {
  if (val >= 60) return 'text-success';
  if (val >= 45) return 'text-warning';
  return 'text-destructive';
}

function getSentimentBg(val: number): string {
  if (val >= 60) return 'from-success/20 to-emerald-600/10';
  if (val >= 45) return 'from-warning/20 to-amber-600/10';
  return 'from-destructive/20 to-red-600/10';
}

// ── GAUGE COMPONENT ──
const SentimentGauge = ({ value, size = 160, label }: { value: number; size?: number; label: string }) => {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius;
  const progress = (value / 100) * circumference;
  const color = value >= 60 ? '#22c55e' : value >= 45 ? '#f59e0b' : '#ef4444';
  const bgColor = value >= 60 ? 'rgba(34,197,94,0.1)' : value >= 45 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          stroke="hsl(240 5% 18%)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
        {/* Center value */}
        <text x={size / 2} y={size / 2 - 5} textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif">
          {value}
        </text>
        <text x={size / 2} y={size / 2 + 16} textAnchor="middle" fill="hsl(240 5% 65%)" fontSize="11" fontWeight="500" fontFamily="Inter, sans-serif">
          {label}
        </text>
      </svg>
    </div>
  );
};

// ── REDDIT FETCHER ──
async function fetchRedditSentiment(subreddit: string): Promise<RedditPost[]> {
  try {
    const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=6&raw_json=1`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.children || [])
      .filter((c: any) => !c.data.stickied)
      .slice(0, 5)
      .map((c: any) => ({
        title: c.data.title,
        upvotes: c.data.ups,
        comments: c.data.num_comments,
        url: `https://reddit.com${c.data.permalink}`,
        subreddit,
        time: new Date(c.data.created_utc * 1000).toISOString(),
      }));
  } catch {
    return [];
  }
}

function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}


// ── MAIN COMPONENT ──
const Sentimental = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [stockResult, reddit1, reddit2] = await Promise.allSettled([
        supabase.functions.invoke('stock-data'),
        fetchRedditSentiment('IndianStockMarket'),
        fetchRedditSentiment('stocks'),
      ]);

      if (stockResult.status === 'fulfilled' && stockResult.value.data) {
        const d = stockResult.value.data;
        setStocks((d.stocks || []).filter((s: StockData) => !s.isError));
        setIndices((d.indices || []).filter((i: IndexData) => !i.isError));
      }

      const posts: RedditPost[] = [];
      if (reddit1.status === 'fulfilled') posts.push(...reddit1.value);
      if (reddit2.status === 'fulfilled') posts.push(...reddit2.value);
      setRedditPosts(posts);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Sentiment fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── COMPUTED VALUES ──
  const stockSentiments = useMemo(() =>
    stocks.map(s => ({ ...s, sentiment: computeStockSentiment(s) })),
    [stocks]
  );
  const overallSentiment = useMemo(() =>
    stockSentiments.length > 0
      ? Math.round(stockSentiments.reduce((a, s) => a + s.sentiment, 0) / stockSentiments.length)
      : 50,
    [stockSentiments]
  );
  const fearGreed = useMemo(() => computeFearGreed(stocks, indices[0]), [stocks, indices]);
  const breadth = useMemo(() => computeMarketBreadth(stocks), [stocks]);

  // TradingView mini widget for India VIX
  const vixRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    node.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: 'NSE:INDIAVIX',
      width: '100%',
      isTransparent: true,
      colorTheme: 'dark',
      locale: 'en',
    });
    node.appendChild(script);
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Market Sentiment</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
            {lastUpdated ? `Live · Updated ${lastUpdated.toLocaleTimeString('en-IN')}` : 'Loading...'}
            <span className="text-border">·</span>
            Computed from {stocks.length} NSE stocks + Reddit
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchData(); }} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* ── TOP GAUGES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Sentiment */}
        <Card className={`relative overflow-hidden bg-gradient-to-br ${getSentimentBg(overallSentiment)} border-border/40 backdrop-blur-sm`}>
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-primary/10 to-transparent" />
          <CardContent className="p-6 flex flex-col items-center relative z-10">
            <SentimentGauge value={overallSentiment} label={getSentimentLabel(overallSentiment)} />
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mt-2">Overall Sentiment</p>
          </CardContent>
        </Card>

        {/* Fear & Greed Index */}
        <Card className={`relative overflow-hidden bg-gradient-to-br ${getSentimentBg(fearGreed)} border-border/40 backdrop-blur-sm`}>
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-warning/10 to-transparent" />
          <CardContent className="p-6 flex flex-col items-center relative z-10">
            <SentimentGauge value={fearGreed} label={getSentimentLabel(fearGreed)} />
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mt-2">Fear & Greed Index</p>
          </CardContent>
        </Card>

        {/* India VIX Live */}
        <Card className="relative overflow-hidden bg-card/60 border-border/40 backdrop-blur-sm">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardHeader className="pb-1 pt-5">
            <CardTitle className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> India VIX (Live)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div ref={vixRef} className="tradingview-widget-container" style={{ height: '120px' }} />
          </CardContent>
        </Card>
      </div>

      {/* ── MARKET BREADTH ── */}
      <Card className="bg-card/60 border-border/40 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-amber-600/10">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            Market Breadth
            <Badge variant="outline" className="text-[10px] ml-2 bg-secondary/30 border-border/40">
              {stocks.length} stocks tracked
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Breadth bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="text-success font-semibold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {breadth.advancers} Advancing</span>
              {breadth.unchanged > 0 && <span className="text-warning">{breadth.unchanged} Unchanged</span>}
              <span className="text-destructive font-semibold flex items-center gap-1">{breadth.decliners} Declining <TrendingDown className="w-3 h-3" /></span>
            </div>
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-secondary/30">
              <div
                className="bg-gradient-to-r from-success to-emerald-500 transition-all duration-700 rounded-l-full"
                style={{ width: `${(breadth.advancers / Math.max(stocks.length, 1)) * 100}%` }}
              />
              {breadth.unchanged > 0 && (
                <div
                  className="bg-warning/60 transition-all duration-700"
                  style={{ width: `${(breadth.unchanged / Math.max(stocks.length, 1)) * 100}%` }}
                />
              )}
              <div
                className="bg-gradient-to-r from-red-500 to-destructive transition-all duration-700 rounded-r-full"
                style={{ width: `${(breadth.decliners / Math.max(stocks.length, 1)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Advance-Decline Ratio: <span className={`font-bold ${breadth.breadthRatio >= 0.5 ? 'text-success' : 'text-destructive'}`}>
                {(breadth.advancers / Math.max(breadth.decliners, 1)).toFixed(2)}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── STOCK SENTIMENT TABLE ── */}
      <Card className="bg-card/60 border-border/40 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-600/10">
              <Gauge className="w-4 h-4 text-purple-400" />
            </div>
            Stock-Level Sentiment
            <Badge variant="outline" className="text-[10px] ml-2 bg-secondary/30 border-border/40">
              Live from NSE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border/40 bg-secondary/20">
                  <th className="text-left px-5 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Stock</th>
                  <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Price</th>
                  <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Change</th>
                  <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sentiment</th>
                  <th className="text-right px-5 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {stockSentiments
                  .sort((a, b) => b.sentiment - a.sentiment)
                  .map((stock) => {
                    const up = stock.change >= 0;
                    const sentColor = getSentimentColor(stock.sentiment);
                    return (
                      <tr
                        key={stock.symbol}
                        className="hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=NSE%3A${stock.symbol}`, '_blank')}
                      >
                        <td className="px-5 py-3">
                          <div>
                            <span className="font-bold text-primary">{stock.symbol}</span>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{stock.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                          ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`px-4 py-3 text-right tabular-nums ${up ? 'text-success' : 'text-destructive'}`}>
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${up ? 'bg-success/10' : 'bg-destructive/10'}`}>
                            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {up ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 rounded-full bg-secondary/40 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${stock.sentiment >= 60 ? 'bg-gradient-to-r from-success to-emerald-400'
                                  : stock.sentiment >= 45 ? 'bg-gradient-to-r from-warning to-amber-400'
                                    : 'bg-gradient-to-r from-destructive to-red-400'
                                  }`}
                                style={{ width: `${stock.sentiment}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-semibold ${sentColor}`}>
                              {stock.sentiment >= 60 ? 'Bullish' : stock.sentiment >= 45 ? 'Neutral' : 'Bearish'}
                            </span>
                          </div>
                        </td>
                        <td className={`px-5 py-3 text-right font-bold tabular-nums ${sentColor}`}>
                          {stock.sentiment}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── REDDIT SOCIAL SENTIMENT ── */}
      {redditPosts.length > 0 && (
        <Card className="bg-card/60 border-border/40 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-600/10">
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              Social Sentiment
              <Badge variant="outline" className="text-[10px] ml-2 bg-secondary/30 border-border/40">
                Reddit Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {redditPosts.map((post, i) => (
              <a
                key={i}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors group"
              >
                <div className="flex flex-col items-center gap-0.5 min-w-[40px]">
                  <ArrowUp className="w-3 h-3 text-orange-400" />
                  <span className="text-xs font-bold text-foreground">{post.upvotes >= 1000 ? `${(post.upvotes / 1000).toFixed(1)}k` : post.upvotes}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="text-orange-400 font-semibold">r/{post.subreddit}</span>
                    <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" /> {post.comments}</span>
                    <span>{timeAgo(post.time)} ago</span>
                  </div>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}



      {/* ── FOOTER ── */}
      <p className="text-[10px] text-muted-foreground/50 text-center">
        Sentiment scores computed from live NSE price data (change %, intraday range position). Social data from Reddit. Heatmaps from TradingView. Refreshes every 60s.
      </p>
    </div>
  );
};

export default Sentimental;
