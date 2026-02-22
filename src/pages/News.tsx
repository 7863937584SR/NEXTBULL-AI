import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Newspaper,
  Globe,
  IndianRupee,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ArrowUp,
  Clock,
  Search,
  AlertCircle,
  Rss,
} from 'lucide-react';

interface NewsItem {
  title: string;
  description?: string;
  source: string;
  category: string;
  url: string;
  publishedAt: string;
  upvotes?: number;
  comments?: number;
}

const CATEGORY_TABS = [
  { key: 'all', label: 'All News', icon: Newspaper },
  { key: 'indian', label: 'Indian Markets', icon: IndianRupee },
  { key: 'global', label: 'Global Markets', icon: Globe },
];

const SOURCE_COLORS: Record<string, string> = {
  'Google News': 'text-blue-400',
  'MoneyControl': 'text-emerald-400',
  'Economic Times': 'text-orange-400',
  'LiveMint': 'text-rose-400',
  'r/IndianStockMarket': 'text-orange-500',
  'r/wallstreetbets': 'text-yellow-400',
  'r/stocks': 'text-cyan-400',
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 0 || isNaN(seconds)) return 'just now';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ── Fetch Reddit posts (public JSON API, CORS-friendly) ──
async function fetchReddit(subreddit: string, category: string, limit = 8): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}&raw_json=1`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.children || [])
      .filter((c: any) => !c.data.stickied && c.data.title && !c.data.is_self?.toString().startsWith('false'))
      .slice(0, limit)
      .map((c: any) => ({
        title: c.data.title,
        description: (c.data.selftext || '').slice(0, 200) || undefined,
        source: `r/${subreddit}`,
        category,
        url: c.data.url?.startsWith('http') ? c.data.url : `https://reddit.com${c.data.permalink}`,
        publishedAt: new Date(c.data.created_utc * 1000).toISOString(),
        upvotes: c.data.ups,
        comments: c.data.num_comments,
      }));
  } catch (e) {
    console.warn(`Reddit r/${subreddit} fetch failed:`, e);
    return [];
  }
}

// ── Fetch RSS via rss2json (free CORS proxy) ──
async function fetchRSS(rssUrl: string, source: string, category: string, maxItems = 8): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=${maxItems}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 'ok') return [];

    return (data.items || []).slice(0, maxItems).map((item: any) => ({
      title: item.title || '',
      description: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 200) || undefined,
      source,
      category,
      url: item.link || '',
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    }));
  } catch (e) {
    console.warn(`RSS ${source} fetch failed:`, e);
    return [];
  }
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sources, setSources] = useState<string[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Load TradingView timeline widget
  useEffect(() => {
    if (!timelineRef.current) return;
    timelineRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode: 'all_symbols', isTransparent: true, displayMode: 'regular',
      width: '100%', height: '600', colorTheme: 'dark', locale: 'en',
    });
    timelineRef.current.appendChild(script);
  }, []);

  const fetchAllNews = useCallback(async () => {
    try {
      setError(null);

      // Fetch from all sources in parallel (all CORS-friendly)
      const results = await Promise.allSettled([
        fetchRSS(
          'https://news.google.com/rss/search?q=indian+stock+market+NSE+BSE+NIFTY&hl=en-IN&gl=IN&ceid=IN:en',
          'Google News', 'indian', 10
        ),
        fetchRSS(
          'https://news.google.com/rss/search?q=stock+market+wall+street+nasdaq+S%26P+500&hl=en-US&gl=US&ceid=US:en',
          'Google News', 'global', 8
        ),
        fetchRSS(
          'https://www.moneycontrol.com/rss/marketreports.xml',
          'MoneyControl', 'indian', 8
        ),
        fetchRSS(
          'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
          'Economic Times', 'indian', 8
        ),
        fetchRSS(
          'https://www.livemint.com/rss/markets',
          'LiveMint', 'indian', 6
        ),
        fetchReddit('IndianStockMarket', 'indian', 8),
        fetchReddit('wallstreetbets', 'global', 6),
        fetchReddit('stocks', 'global', 6),
      ]);

      const allNews: NewsItem[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allNews.push(...result.value);
        }
      }

      // Deduplicate by title (first 60 chars)
      const seen = new Set<string>();
      const unique = allNews.filter(item => {
        const key = item.title.toLowerCase().trim().slice(0, 60);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort newest first
      unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      // Collect active sources
      const srcSet = new Set(unique.map(n => n.source));

      setNews(unique);
      setSources(Array.from(srcSet));
      setLastFetched(new Date());

      if (unique.length === 0) {
        setError('No news fetched. Some sources may be temporarily unavailable.');
      }
    } catch (err) {
      console.error('News fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllNews();
  }, [fetchAllNews]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchAllNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllNews]);

  const filteredNews = useMemo(() => {
    let items = activeTab === 'all' ? news : news.filter(n => n.category === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q) ||
        (n.description || '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [news, activeTab, searchQuery]);

  const isReddit = (source: string) => source.startsWith('r/');

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-28 rounded-full" />)}
        </div>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            Live News Feed
            <Badge className="bg-gradient-to-r from-success to-emerald-600 text-white border-0 text-[10px] font-bold px-2 py-0.5 animate-pulse-glow shadow-lg shadow-success/20">
              <span className="mr-1">◉</span> LIVE
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
            <Rss className="w-3.5 h-3.5" />
            {lastFetched ? `Updated ${lastFetched.toLocaleTimeString('en-IN')}` : 'Fetching...'}
            <span className="text-border">·</span>
            {news.length} articles from {sources.length} sources
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={autoRefresh ? 'default' : 'secondary'}
            className={`text-[10px] px-2 py-0.5 cursor-pointer select-none ${autoRefresh ? 'bg-primary/20 text-primary border-primary/30' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={() => { setLoading(true); fetchAllNews(); }}
            className="h-8 w-8 border-border/60 hover:border-primary/50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── SOURCE BADGES ── */}
      {sources.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mr-1">Sources:</span>
          {sources.map(src => (
            <Badge key={src} variant="outline" className="text-[10px] px-2 py-0 bg-secondary/30 border-border/40">
              <span className={`${SOURCE_COLORS[src] || 'text-muted-foreground'} mr-1`}>●</span>
              {src}
            </Badge>
          ))}
        </div>
      )}

      {/* ── TABS & SEARCH ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.icon;
            const count = tab.key === 'all' ? news.length : news.filter(n => n.category === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-secondary/50 border-border/50"
          />
        </div>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <Card className="border-destructive/50 bg-gradient-to-r from-destructive/10 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Some sources may be unavailable</p>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchAllNews(); }} className="text-xs flex-shrink-0">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── NEWS ITEMS ── */}
      <div className="space-y-2">
        {filteredNews.map((item, index) => (
          <a
            key={`${item.source}-${index}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <Card className="bg-card/60 border-border/30 hover:border-primary/30 backdrop-blur-sm transition-all duration-200 overflow-hidden">
              <CardContent className="p-4 flex gap-4">
                {/* Left category accent */}
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${item.category === 'indian'
                  ? 'bg-gradient-to-b from-orange-500 to-green-500'
                  : 'bg-gradient-to-b from-blue-500 to-purple-500'
                  }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                    <span className={`font-semibold ${SOURCE_COLORS[item.source] || 'text-muted-foreground'}`}>
                      {item.source}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(item.publishedAt)}
                    </span>
                    {isReddit(item.source) && item.upvotes !== undefined && (
                      <>
                        <span className="flex items-center gap-0.5">
                          <ArrowUp className="w-3 h-3" />
                          {item.upvotes.toLocaleString()}
                        </span>
                        {item.comments !== undefined && (
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3" />
                            {item.comments.toLocaleString()}
                          </span>
                        )}
                      </>
                    )}
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-secondary/30 border-border/40 uppercase tracking-wider">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {filteredNews.length === 0 && !loading && !error && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No news found</p>
          <Button variant="link" size="sm" onClick={() => { setActiveTab('all'); setSearchQuery(''); }}>
            Clear filters
          </Button>
        </div>
      )}

      {/* ── TRADINGVIEW LIVE TIMELINE ── */}
      <Card className="bg-card/80 border-border/50 backdrop-blur-sm overflow-hidden relative hover-glow">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />
        <div className="p-5 pb-2 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/10 ring-1 ring-rose-500/20">
            <Rss className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Market News Timeline</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Live feed · Breaking news, analysis, market events from TradingView
            </p>
          </div>
        </div>
        <div className="p-0">
          <div ref={timelineRef} className="tradingview-widget-container" />
        </div>
      </Card>

      {/* ── FOOTER ── */}
      <div className="text-center text-[10px] text-muted-foreground/60 pt-4 border-t border-border/20">
        Aggregated from Google News, MoneyControl, Economic Times, LiveMint, Reddit, TradingView · Auto-refreshes every 5 minutes
      </div>
    </div>
  );
};

export default News;
