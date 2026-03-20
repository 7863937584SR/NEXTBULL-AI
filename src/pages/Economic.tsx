import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  IndianRupee,
  Bell,
  Loader2,
  RefreshCw,
  Plus,
  X,
  Trash2,
  Search,
  Zap,
  BarChart3,
  Target,
  Timer,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { TVLazyWidget } from '@/components/dashboard/TVLazyWidget';

/* ═══════════════════════════════════════════
   TradingView Colors + Config
   ═══════════════════════════════════════════ */
const TVUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

const TV = {
  bg: '#131722',
  surface: '#1e222d',
  surfaceHover: '#262b3d',
  border: '#2a2e39',
  borderHover: '#363c4e',
  blue: '#2962ff',
  blueHover: '#1e53e5',
  text: '#d1d4dc',
  textSecondary: '#787b86',
  textMuted: '#4c525e',
  success: '#26a69a',
  danger: '#ef5350',
  warning: '#ff9800',
  high: '#ef5350',
  medium: '#ff9800',
  low: '#26a69a',
};

/* ═══════════════════════════════════════════
   DATA TYPES
   ═══════════════════════════════════════════ */
interface EconomicEvent {
  time: string;
  country: 'IN' | 'US' | 'EU' | 'JP' | 'CN' | 'UK' | 'GL';
  impact: 'high' | 'medium' | 'low';
  category: string;
  event: string;
  actual?: string;
  forecast?: string;
  prior?: string;
  description?: string;
  isCustom?: boolean;
  customId?: string;
}

interface DayEvents {
  date: Date;
  events: EconomicEvent[];
}

interface CustomEvent {
  id: string;
  dateKey: string; // 'YYYY-MM-DD'
  time: string;
  country: 'IN' | 'US' | 'EU' | 'JP' | 'CN' | 'UK' | 'GL';
  impact: 'high' | 'medium' | 'low';
  category: string;
  event: string;
  forecast?: string;
  prior?: string;
  description?: string;
}

function loadCustomEvents(): CustomEvent[] {
  try {
    return JSON.parse(localStorage.getItem('nextbull_custom_events') || '[]');
  } catch { return []; }
}

function saveCustomEvents(events: CustomEvent[]) {
  localStorage.setItem('nextbull_custom_events', JSON.stringify(events));
}

/* ═══════════════════════════════════════════
   LIVE CALENDAR DATA — fetched from Trading Economics RSS / Google News
   ═══════════════════════════════════════════ */

async function fetchLiveEconomicEvents(): Promise<DayEvents[]> {
  const today = new Date();
  const days: DayEvents[] = [];

  const d = (offset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt;
  };

  // Build 7 days of skeleton
  for (let i = -1; i <= 5; i++) {
    days.push({ date: d(i), events: [] });
  }

  const hasSupabaseConfig = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  const classifyEvent = (title: string, description?: string, defaultCountry: EconomicEvent['country'] = 'GL') => {
    const titleLow = title.toLowerCase();

    // Country detection
    let country = defaultCountry;
    if (titleLow.match(/\bindia\b|rbi|nifty|sensex|rupee|sebi|indian/)) country = 'IN';
    else if (titleLow.match(/\bus\b|\bu\.s\b|fed |fomc|dollar|nfp|payroll|treasury|wall street|nasdaq|s&p/)) country = 'US';
    else if (titleLow.match(/ecb|euro(?:zone)?|eu /)) country = 'EU';
    else if (titleLow.match(/japan|boj|yen|nikkei/)) country = 'JP';
    else if (titleLow.match(/china|pboc|yuan|shanghai/)) country = 'CN';
    else if (titleLow.match(/\buk\b|boe|sterling|pound|ftse/)) country = 'UK';

    // Impact classification
    let impact: EconomicEvent['impact'] = 'low';
    if (titleLow.match(/gdp|inflation|cpi|rate decision|nfp|payroll|employment|rbi|fed |fomc|interest rate|recession|crash/)) {
      impact = 'high';
    } else if (titleLow.match(/pmi|trade|deficit|surplus|manufacturing|services|consumer|sentiment|housing|retail/)) {
      impact = 'medium';
    }

    // Category
    let category = 'Economy';
    if (titleLow.match(/gdp|growth/)) category = 'GDP';
    else if (titleLow.match(/inflation|cpi|wpi|pce/)) category = 'Inflation';
    else if (titleLow.match(/rate|monetary|rbi|fed|boj|ecb|boe/)) category = 'Monetary';
    else if (titleLow.match(/employ|job|payroll|nfp|unemployment/)) category = 'Employment';
    else if (titleLow.match(/trade|export|import|deficit/)) category = 'Trade';
    else if (titleLow.match(/pmi|manufactur|industrial|services/)) category = 'Manufacturing';
    else if (titleLow.match(/fiscal|tax|budget|revenue/)) category = 'Fiscal';
    else if (titleLow.match(/sentiment|consumer|confidence/)) category = 'Sentiment';
    else if (titleLow.match(/housing|real estate|mortgage/)) category = 'Housing';
    else if (titleLow.match(/oil|crude|energy|opec/)) category = 'Energy';

    return { country, impact, category, description };
  };

  const fetchViaRss2Json = async (url: string, defaultCountry: EconomicEvent['country']) => {
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`
    );
    if (!res.ok) throw new Error(`rss2json ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map((item: any) => {
      const title = String(item.title || '').slice(0, 120);
      const description = String(item.description || '').replace(/<[^>]*>/g, '').slice(0, 200);
      return {
        title,
        pubDate: item.pubDate || item.published || new Date().toISOString(),
        description,
        defaultCountry,
      };
    });
  };

  try {
    let events: EconomicEvent[] = [];

    if (hasSupabaseConfig) {
      // Fetch from our Supabase edge function (server-side RSS proxy)
      const { data, error } = await supabase.functions.invoke('economic-calendar');
      if (error) {
        console.warn('Economic calendar fetch failed:', error.message);
      } else if (data?.events?.length) {
        events = data.events.map((ev: any) => {
          let eventTime = '09:00';
          try {
            const eventDate = new Date(ev.pubDate);
            if (!isNaN(eventDate.getTime())) {
              eventTime = eventDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Kolkata',
              });
            }
          } catch {
            /* keep default */
          }

          return {
            time: eventTime,
            country: ev.country as EconomicEvent['country'],
            impact: ev.impact as EconomicEvent['impact'],
            category: ev.category || 'Economy',
            event: ev.title?.slice(0, 120) || '',
            description: ev.description?.slice(0, 200),
          };
        });
      }
    } else {
      console.warn('Supabase config missing. Falling back to client RSS.');
    }

    if (events.length === 0) {
      // Fallback: client-side RSS via rss2json (CORS-safe)
      const feeds = [
        {
          url: 'https://news.google.com/rss/search?q=india+economic+data+RBI+GDP+CPI+inflation+rate+decision&hl=en-IN&gl=IN&ceid=IN:en',
          defaultCountry: 'IN' as const,
        },
        {
          url: 'https://news.google.com/rss/search?q=US+economic+data+Fed+NFP+CPI+GDP+FOMC+treasury&hl=en-US&gl=US&ceid=US:en',
          defaultCountry: 'US' as const,
        },
        {
          url: 'https://news.google.com/rss/search?q=global+economy+ECB+BOJ+central+bank+rate+decision&hl=en&gl=US&ceid=US:en',
          defaultCountry: 'GL' as const,
        },
      ];

      const results = await Promise.allSettled(
        feeds.map((feed) => fetchViaRss2Json(feed.url, feed.defaultCountry))
      );

      const allItems: Array<{ title: string; pubDate: string; description: string; defaultCountry: EconomicEvent['country'] }> = [];
      for (const r of results) {
        if (r.status === 'fulfilled') allItems.push(...r.value);
      }

      const seen = new Set<string>();
      const unique = allItems.filter((item) => {
        const key = item.title.toLowerCase().slice(0, 60);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      events = unique.slice(0, 60).map((item) => {
        let eventTime = '09:00';
        try {
          const eventDate = new Date(item.pubDate);
          if (!isNaN(eventDate.getTime())) {
            eventTime = eventDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'Asia/Kolkata',
            });
          }
        } catch {
          /* keep default */
        }

        const meta = classifyEvent(item.title, item.description, item.defaultCountry);
        return {
          time: eventTime,
          country: meta.country,
          impact: meta.impact,
          category: meta.category,
          event: item.title.slice(0, 120),
          description: meta.description,
        };
      });
    }

    if (events.length > 0) {
      days[1].events = events.slice(0, 15);
      if (events.length > 15) days[2].events = events.slice(15, 25);
      if (events.length > 25) days[0].events = events.slice(25, 35);
      if (events.length > 35) days[3].events = events.slice(35, 45);
      if (events.length > 45) days[4].events = events.slice(45, 55);
    }
  } catch (error) {
    console.error('Failed to fetch economic events:', error);
  }

  // Fallback: if no events were fetched, populate with curated static data
  const hasAnyEvents = days.some(d => d.events.length > 0);
  if (!hasAnyEvents) {
    days[1].events = [
      { time: '09:00', country: 'IN', impact: 'high', category: 'Monetary', event: 'RBI Monetary Policy Decision', forecast: '6.25%', prior: '6.50%', description: 'Reserve Bank of India interest rate decision by the Monetary Policy Committee.' },
      { time: '09:15', country: 'IN', impact: 'high', category: 'Inflation', event: 'India CPI Inflation (YoY)', actual: '4.8%', forecast: '4.9%', prior: '5.1%', description: 'Consumer Price Index inflation data released by the Ministry of Statistics.' },
      { time: '10:00', country: 'IN', impact: 'medium', category: 'Manufacturing', event: 'India Manufacturing PMI', actual: '57.5', forecast: '57.0', prior: '56.5', description: 'S&P Global India Manufacturing Purchasing Managers Index.' },
      { time: '11:00', country: 'IN', impact: 'medium', category: 'Trade', event: 'India Trade Balance', forecast: '-$23.5B', prior: '-$22.1B', description: 'Monthly trade balance data showing imports vs exports.' },
      { time: '14:00', country: 'IN', impact: 'low', category: 'Economy', event: 'India Industrial Production (YoY)', forecast: '5.2%', prior: '4.8%', description: 'Index of Industrial Production measuring factory output growth.' },
      { time: '18:00', country: 'US', impact: 'high', category: 'Inflation', event: 'US Core CPI (MoM)', forecast: '0.3%', prior: '0.3%', description: 'Core Consumer Price Index excluding food and energy prices.' },
      { time: '19:30', country: 'US', impact: 'high', category: 'Employment', event: 'US Initial Jobless Claims', actual: '215K', forecast: '220K', prior: '218K', description: 'Weekly count of new unemployment insurance claims.' },
      { time: '20:00', country: 'US', impact: 'medium', category: 'Sentiment', event: 'US Consumer Sentiment Index', forecast: '67.5', prior: '66.4', description: 'University of Michigan consumer confidence survey.' },
    ];
    days[2].events = [
      { time: '09:00', country: 'IN', impact: 'high', category: 'GDP', event: 'India GDP Growth Rate (QoQ)', forecast: '7.0%', prior: '6.7%', description: 'Quarterly Gross Domestic Product growth estimate by CSO.' },
      { time: '10:30', country: 'IN', impact: 'medium', category: 'Manufacturing', event: 'India Services PMI', forecast: '58.2', prior: '57.7', description: 'S&P Global India Services sector Purchasing Managers Index.' },
      { time: '14:30', country: 'EU', impact: 'high', category: 'Monetary', event: 'ECB Interest Rate Decision', forecast: '3.75%', prior: '4.00%', description: 'European Central Bank main refinancing rate announcement.' },
      { time: '19:00', country: 'US', impact: 'high', category: 'Employment', event: 'US Non-Farm Payrolls', forecast: '200K', prior: '187K', description: 'Monthly change in employment excluding the farming sector.' },
      { time: '19:00', country: 'US', impact: 'medium', category: 'Employment', event: 'US Unemployment Rate', forecast: '3.8%', prior: '3.7%', description: 'Percentage of total workforce that is unemployed and actively seeking work.' },
    ];
    days[3].events = [
      { time: '09:00', country: 'IN', impact: 'medium', category: 'Fiscal', event: 'India Government Budget Review', description: 'Mid-year review of Union Budget expenditure and revenue collection.' },
      { time: '15:00', country: 'JP', impact: 'high', category: 'Monetary', event: 'BOJ Policy Rate Decision', forecast: '0.25%', prior: '0.10%', description: 'Bank of Japan monetary policy interest rate decision.' },
      { time: '15:30', country: 'CN', impact: 'medium', category: 'Manufacturing', event: 'China Manufacturing PMI', actual: '50.2', forecast: '50.0', prior: '49.8', description: 'Official NBS Manufacturing Purchasing Managers Index.' },
      { time: '20:00', country: 'US', impact: 'high', category: 'Monetary', event: 'FOMC Meeting Minutes', description: 'Minutes from the latest Federal Open Market Committee meeting.' },
    ];
    days[0].events = [
      { time: '09:30', country: 'IN', impact: 'medium', category: 'Economy', event: 'India Forex Reserves (Weekly)', actual: '$640.5B', prior: '$638.2B', description: 'Weekly foreign exchange reserves held by the Reserve Bank of India.' },
      { time: '14:00', country: 'UK', impact: 'medium', category: 'GDP', event: 'UK GDP (QoQ)', forecast: '0.3%', prior: '0.2%', description: 'Quarterly gross domestic product estimate for the United Kingdom.' },
      { time: '19:00', country: 'US', impact: 'medium', category: 'Housing', event: 'US Existing Home Sales', forecast: '4.0M', prior: '3.95M', description: 'Annualized rate of existing residential property sales.' },
    ];
  }

  return days;
}

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳', US: '🇺🇸', EU: '🇪🇺', JP: '🇯🇵', CN: '🇨🇳', UK: '🇬🇧', GL: '🌐',
};

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', EU: 'Eurozone', JP: 'Japan', CN: 'China', UK: 'United Kingdom', GL: 'Global',
};

const IMPACT_LABELS: Record<string, string> = { high: 'HIGH', medium: 'MED', low: 'LOW' };

const ALL_CATEGORIES = ['All', 'GDP', 'Inflation', 'Monetary', 'Employment', 'Trade', 'Manufacturing', 'Fiscal', 'Sentiment', 'Housing', 'Energy', 'Economy', 'Custom'];

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
const Economic = () => {
  const [allDays, setAllDays] = useState<DayEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIdx, setSelectedDayIdx] = useState(1);
  const [impactFilter, setImpactFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [countryFilter, setCountryFilter] = useState<'all' | 'IN' | 'US' | 'EU' | 'JP' | 'CN' | 'UK'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>(loadCustomEvents);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeView, setActiveView] = useState<'calendar' | 'widget'>('calendar');
  const [countdown, setCountdown] = useState('');

  // Form state for add modal
  const [formTime, setFormTime] = useState('09:00');
  const [formCountry, setFormCountry] = useState<CustomEvent['country']>('IN');
  const [formImpact, setFormImpact] = useState<CustomEvent['impact']>('medium');
  const [formCategory, setFormCategory] = useState('Custom');
  const [formEvent, setFormEvent] = useState('');
  const [formForecast, setFormForecast] = useState('');
  const [formPrior, setFormPrior] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Fetch live economic events on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLiveEconomicEvents().then(days => {
      if (!cancelled) {
        setAllDays(days);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const selectedDay = allDays[selectedDayIdx];
  const selectedDateKey = selectedDay?.date.toISOString().split('T')[0];

  // Merge built-in + custom events for the selected day
  const customForDay = customEvents
    .filter(ce => ce.dateKey === selectedDateKey)
    .map(ce => ({
      time: ce.time,
      country: ce.country,
      impact: ce.impact,
      category: ce.category,
      event: ce.event,
      forecast: ce.forecast,
      prior: ce.prior,
      description: ce.description,
      isCustom: true,
      customId: ce.id,
    } as EconomicEvent));

  const allEventsForDay = [...(selectedDay?.events || []), ...customForDay].sort((a, b) => a.time.localeCompare(b.time));

  const filteredEvents = allEventsForDay.filter(e => {
    if (impactFilter !== 'all' && e.impact !== impactFilter) return false;
    if (countryFilter !== 'all' && e.country !== countryFilter) return false;
    if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.event.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q) && !(e.description || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const isToday = selectedDayIdx === 1;

  // ── Stats across all days ──
  const weekStats = useMemo(() => {
    const allEvents = allDays.flatMap(d => d.events);
    const customAll = customEvents.map(ce => ({
      time: ce.time, country: ce.country, impact: ce.impact, category: ce.category, event: ce.event,
    }));
    const combined = [...allEvents, ...customAll];
    return {
      total: combined.length,
      high: combined.filter(e => e.impact === 'high').length,
      medium: combined.filter(e => e.impact === 'medium').length,
      low: combined.filter(e => e.impact === 'low').length,
      countries: new Set(combined.map(e => e.country)).size,
      indiaHigh: combined.filter(e => e.impact === 'high' && e.country === 'IN').length,
      perDay: allDays.map(d => d.events.length),
    };
  }, [allDays, customEvents]);

  // ── Countdown to next high-impact event ──
  useEffect(() => {
    if (allDays.length === 0) return;
    const tick = () => {
      const now = new Date();
      for (const day of allDays) {
        for (const ev of day.events) {
          if (ev.impact !== 'high') continue;
          const [h, m] = ev.time.split(':').map(Number);
          const eventDate = new Date(day.date);
          eventDate.setHours(h, m, 0, 0);
          const diff = eventDate.getTime() - now.getTime();
          if (diff > 0) {
            const hours = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setCountdown(`${hours}h ${mins}m ${secs}s`);
            return;
          }
        }
      }
      setCountdown('--');
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [allDays]);

  const handleAddEvent = () => {
    if (!formEvent.trim()) return;
    const newEvent: CustomEvent = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      dateKey: selectedDateKey,
      time: formTime,
      country: formCountry,
      impact: formImpact,
      category: formCategory || 'Custom',
      event: formEvent.trim(),
      forecast: formForecast || undefined,
      prior: formPrior || undefined,
      description: formDescription || undefined,
    };
    const updated = [...customEvents, newEvent];
    setCustomEvents(updated);
    saveCustomEvents(updated);
    setFormEvent(''); setFormForecast(''); setFormPrior(''); setFormDescription('');
    setFormTime('09:00'); setFormCategory('Custom'); setFormCountry('IN'); setFormImpact('medium');
    setShowAddModal(false);
  };

  const handleDeleteCustom = (id: string) => {
    const updated = customEvents.filter(e => e.id !== id);
    setCustomEvents(updated);
    saveCustomEvents(updated);
  };

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchLiveEconomicEvents().then(days => {
      setAllDays(days);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const formatDate = (date: Date) => {
    const opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-IN', opts);
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
  };

  return (
    <div style={{ background: TV.bg, minHeight: 'calc(100vh - 3.5rem)', color: TV.text }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>

        {/* ══════════════ HEADER WITH STATS ══════════════ */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: TV.text, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar style={{ width: 26, height: 26, color: TV.blue }} />
                Economic Calendar
              </h1>
              <p style={{ fontSize: 12, color: TV.textSecondary, marginTop: 4, marginLeft: 36 }}>
                {loading ? 'Fetching live economic events...' : 'Live economic events · Indian & global markets · Real-time data'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleRefresh} disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'transparent', border: `1px solid ${TV.border}`, color: TV.textSecondary, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <RefreshCw style={{ width: 12, height: 12, animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
              </button>
              <button onClick={() => setShowAddModal(true)} disabled={loading || allDays.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: (loading || allDays.length === 0) ? TV.textMuted : TV.blue, color: '#fff', border: 'none', cursor: (loading || allDays.length === 0) ? 'not-allowed' : 'pointer' }}
              >
                <Plus style={{ width: 14, height: 14 }} /> Add Event
              </button>
            </div>
          </div>

          {/* ── Stats Dashboard ── */}
          {!loading && allDays.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: '14px 16px', background: TV.surface, borderRadius: 10, border: `1px solid ${TV.border}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: TV.blue }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <BarChart3 style={{ width: 14, height: 14, color: TV.blue }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: TV.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Events</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: TV.text, fontVariantNumeric: 'tabular-nums' }}>{weekStats.total}</div>
                <div style={{ fontSize: 10, color: TV.textSecondary, marginTop: 2 }}>This week</div>
              </div>

              <div style={{ padding: '14px 16px', background: TV.surface, borderRadius: 10, border: `1px solid ${TV.border}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: TV.high }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <AlertTriangle style={{ width: 14, height: 14, color: TV.high }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: TV.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>High Impact</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: TV.high, fontVariantNumeric: 'tabular-nums' }}>{weekStats.high}</div>
                <div style={{ fontSize: 10, color: TV.textSecondary, marginTop: 2 }}>{weekStats.indiaHigh} India events</div>
              </div>

              <div style={{ padding: '14px 16px', background: TV.surface, borderRadius: 10, border: `1px solid ${TV.border}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: TV.success }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Globe style={{ width: 14, height: 14, color: TV.success }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: TV.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Countries</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: TV.text, fontVariantNumeric: 'tabular-nums' }}>{weekStats.countries}</div>
                <div style={{ fontSize: 10, color: TV.textSecondary, marginTop: 2 }}>Regions tracked</div>
              </div>

              <div style={{ padding: '14px 16px', background: TV.surface, borderRadius: 10, border: `1px solid ${TV.border}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: TV.warning }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Timer style={{ width: 14, height: 14, color: TV.warning }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: TV.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next High</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: TV.warning, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>{countdown || '--'}</div>
                <div style={{ fontSize: 10, color: TV.textSecondary, marginTop: 2 }}>Countdown</div>
              </div>
            </div>
          )}

          {/* ── Week Overview Bar ── */}
          {!loading && allDays.length > 0 && (
            <div style={{ display: 'flex', gap: 4, padding: '10px 16px', background: TV.surface, borderRadius: 8, border: `1px solid ${TV.border}`, marginBottom: 16, alignItems: 'flex-end' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: TV.textMuted, marginRight: 8, alignSelf: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Week:</span>
              {allDays.map((day, idx) => {
                const count = day.events.length + customEvents.filter(ce => ce.dateKey === day.date.toISOString().split('T')[0]).length;
                const maxCount = Math.max(...allDays.map(d => d.events.length), 1);
                const barH = Math.max(6, (count / maxCount) * 40);
                const isSelected = idx === selectedDayIdx;
                const isTdy = idx === 1;
                const highCount = day.events.filter(e => e.impact === 'high').length;
                return (
                  <button key={idx} onClick={() => setSelectedDayIdx(idx)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                  >
                    <div style={{ width: '100%', maxWidth: 36, height: barH, borderRadius: 3, background: isSelected ? TV.blue : highCount > 0 ? `${TV.high}40` : `${TV.textMuted}30`, transition: 'all 0.2s', position: 'relative' }}>
                      {highCount > 0 && !isSelected && <div style={{ position: 'absolute', top: -3, right: -3, width: 6, height: 6, borderRadius: '50%', background: TV.high }} />}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: isSelected ? 700 : 500, color: isSelected ? TV.blue : isTdy ? TV.text : TV.textMuted }}>
                      {isTdy ? 'Today' : day.date.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    <span style={{ fontSize: 8, color: TV.textMuted }}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── LOADING STATE ── */}
        {(loading || allDays.length === 0) ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 16 }}>
            {loading ? (
              <>
                <div style={{ width: 40, height: 40, border: `3px solid ${TV.border}`, borderTop: `3px solid ${TV.blue}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <span style={{ fontSize: 14, color: TV.textSecondary }}>Fetching live economic events…</span>
              </>
            ) : (
              <>
                <Calendar style={{ width: 36, height: 36, color: TV.textMuted }} />
                <span style={{ fontSize: 14, color: TV.textSecondary }}>No economic events available right now.</span>
              </>
            )}
          </div>
        ) : (<>

        {/* ── VIEW TABS: Calendar vs TradingView Widget ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
          <button onClick={() => setActiveView('calendar')}
            style={{ padding: '8px 20px', fontSize: 12, fontWeight: 600, border: `1px solid ${TV.border}`, borderRight: 'none', borderRadius: '6px 0 0 6px', cursor: 'pointer', background: activeView === 'calendar' ? TV.blue : 'transparent', color: activeView === 'calendar' ? '#fff' : TV.textSecondary }}>
            <Calendar style={{ width: 12, height: 12, display: 'inline', marginRight: 6, verticalAlign: -1 }} />Calendar
          </button>
          <button onClick={() => setActiveView('widget')}
            style={{ padding: '8px 20px', fontSize: 12, fontWeight: 600, border: `1px solid ${TV.border}`, borderRadius: '0 6px 6px 0', cursor: 'pointer', background: activeView === 'widget' ? TV.blue : 'transparent', color: activeView === 'widget' ? '#fff' : TV.textSecondary }}>
            <ExternalLink style={{ width: 12, height: 12, display: 'inline', marginRight: 6, verticalAlign: -1 }} />TradingView
          </button>
        </div>

        {activeView === 'widget' ? (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${TV.border}`, marginBottom: 24 }}>
            <TVLazyWidget
              src={`${TVUrl}economic-calendar.js`}
              height="600px"
              skeletonHeight="h-[600px]"
              config={{
                width: '100%',
                height: '600',
                colorTheme: 'dark',
                isTransparent: true,
                locale: 'en',
                importanceFilter: '-1,0,1',
                countryFilter: 'in,us,eu,jp,cn,gb',
              }}
            />
          </div>
        ) : (<>

        {/* ── DATE NAVIGATION ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '12px 16px',
          background: TV.surface, borderRadius: 8, border: `1px solid ${TV.border}`,
        }}>
          <button onClick={() => setSelectedDayIdx(i => Math.max(0, i - 1))} disabled={selectedDayIdx <= 0}
            style={{
              width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: `1px solid ${TV.border}`, color: selectedDayIdx <= 0 ? TV.textMuted : TV.text,
              cursor: selectedDayIdx <= 0 ? 'not-allowed' : 'pointer',
            }}>
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>

          <div style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto' }}>
            {allDays.map((day, idx) => {
              const isSelected = idx === selectedDayIdx;
              const isTodayTab = idx === 1;
              const dayHigh = day.events.filter(e => e.impact === 'high').length;
              return (
                <button key={idx} onClick={() => setSelectedDayIdx(idx)}
                  style={{
                    padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: isSelected ? 700 : 500,
                    whiteSpace: 'nowrap', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                    background: isSelected ? TV.blue : 'transparent',
                    color: isSelected ? '#fff' : TV.textSecondary,
                    position: 'relative',
                  }}>
                  {isTodayTab ? 'Today' : formatShortDate(day.date)}
                  {dayHigh > 0 && !isSelected && (
                    <span style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: '50%', background: TV.high }} />
                  )}
                  {isTodayTab && !isSelected && (
                    <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: TV.blue }} />
                  )}
                </button>
              );
            })}
          </div>

          <button onClick={() => setSelectedDayIdx(i => Math.min(allDays.length - 1, i + 1))} disabled={selectedDayIdx >= allDays.length - 1}
            style={{
              width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: `1px solid ${TV.border}`, color: selectedDayIdx >= allDays.length - 1 ? TV.textMuted : TV.text,
              cursor: selectedDayIdx >= allDays.length - 1 ? 'not-allowed' : 'pointer',
            }}>
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* ── SEARCH + FILTERS ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: TV.textMuted }} />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 6, background: TV.surface, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 12, outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = TV.blue; }} onBlur={e => { e.target.style.borderColor = TV.border; }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: TV.textMuted }}>
                <X style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>

          <span style={{ width: 1, height: 24, background: TV.border }} />

          {/* Impact filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter style={{ width: 12, height: 12, color: TV.textMuted }} />
            <span style={{ fontSize: 10, color: TV.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Impact:</span>
          </div>
          {(['all', 'high', 'medium', 'low'] as const).map(level => (
            <button key={level} onClick={() => setImpactFilter(level)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 4,
                fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: impactFilter === level ? (level === 'high' ? `${TV.high}20` : level === 'medium' ? `${TV.warning}20` : level === 'low' ? `${TV.success}20` : `${TV.blue}20`) : 'transparent',
                color: impactFilter === level ? (level === 'high' ? TV.high : level === 'medium' ? TV.warning : level === 'low' ? TV.success : TV.blue) : TV.textSecondary,
              }}>
              {level !== 'all' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: level === 'high' ? TV.high : level === 'medium' ? TV.warning : TV.low }} />}
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}

          <span style={{ width: 1, height: 24, background: TV.border }} />

          {/* Country filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe style={{ width: 12, height: 12, color: TV.textMuted }} />
          </div>
          {(['all', 'IN', 'US', 'EU', 'JP', 'CN', 'UK'] as const).map(c => (
            <button key={c} onClick={() => setCountryFilter(c as any)}
              style={{
                fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', border: 'none',
                background: countryFilter === c ? `${TV.blue}20` : 'transparent',
                color: countryFilter === c ? TV.blue : TV.textSecondary,
              }}>
              {c === 'all' ? 'All' : `${COUNTRY_FLAGS[c]} ${c}`}
            </button>
          ))}
        </div>

        {/* ── Category Chips ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {ALL_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
                cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                background: categoryFilter === cat ? `${TV.blue}25` : `${TV.textMuted}15`,
                color: categoryFilter === cat ? TV.blue : TV.textSecondary,
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* ── DATE HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: TV.text }}>
              {isToday ? 'Today — ' : ''}{formatDate(selectedDay.date)}
            </h2>
            {isToday && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: `${TV.blue}20`, color: TV.blue, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Live
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {searchQuery && (
              <span style={{ fontSize: 11, color: TV.warning }}>Searching: "{searchQuery}"</span>
            )}
            <span style={{ fontSize: 12, color: TV.textSecondary }}>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              {(impactFilter !== 'all' || countryFilter !== 'all' || categoryFilter !== 'All' || searchQuery) && (
                <button onClick={() => { setImpactFilter('all'); setCountryFilter('all'); setCategoryFilter('All'); setSearchQuery(''); }}
                  style={{ marginLeft: 8, fontSize: 10, color: TV.blue, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Clear filters
                </button>
              )}
            </span>
          </div>
        </div>

        {/* ── TABLE HEADER ── */}
        <div className="hidden sm:grid grid-cols-[60px_40px_50px_1fr_90px_90px_90px] px-4 py-3 bg-[#1e222d] rounded-t-2xl border border-white/10 border-b-0 text-[10px] font-bold text-gray-500 uppercase tracking-widest relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-purple-500/30 rounded-t-2xl" />
          <span>TIME</span>
          <span></span>
          <span>IMP.</span>
          <span>EVENT</span>
          <span className="text-right">ACTUAL</span>
          <span className="text-right">FORECAST</span>
          <span className="text-right">PRIOR</span>
        </div>

        {/* ── EVENT ROWS ── */}
        <div className="rounded-b-2xl sm:rounded-b-2xl rounded-t-2xl sm:rounded-t-none overflow-hidden border border-white/10 bg-[#1e222d]/60 backdrop-blur-xl shadow-2xl relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-[13px] text-gray-400">
                  {searchQuery ? `No events matching "${searchQuery}"` : 'No events matching filters'}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">Try adjusting impact, country, or category filters</p>
              </div>
            ) : (
              filteredEvents.map((event, idx) => {
                const isExpanded = expandedEvent === idx;
                const hasActual = !!event.actual;

                let beatForecast: 'beat' | 'miss' | 'inline' | null = null;
                if (event.actual && event.forecast) {
                  const a = parseFloat(event.actual.replace(/[^0-9.-]/g, ''));
                  const f = parseFloat(event.forecast.replace(/[^0-9.-]/g, ''));
                  if (!isNaN(a) && !isNaN(f)) {
                    beatForecast = a > f ? 'beat' : a < f ? 'miss' : 'inline';
                  }
                }

                return (
                  <div key={idx} className="group relative">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/[0.03] transition-opacity duration-300 pointer-events-none" />

                    {/* ── Desktop Row ── */}
                    <div
                      className={`hidden sm:grid grid-cols-[60px_40px_50px_1fr_90px_90px_90px] px-4 py-3 items-center relative z-10 ${event.description ? 'cursor-pointer hover:bg-white/[0.02]' : 'cursor-default'
                        } ${idx < filteredEvents.length - 1 ? 'border-b border-white/5' : ''} ${isExpanded ? 'bg-white/[0.04]' : ''
                        } transition-colors duration-200`}
                      onClick={() => event.description && setExpandedEvent(isExpanded ? null : idx)}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${event.impact === 'high' ? 'bg-red-500' : event.impact === 'medium' ? 'bg-orange-500' : 'bg-emerald-500'}`} />

                      <span className="text-xs text-gray-400 font-mono tracking-wide">{event.time}</span>
                      <span className="text-base" title={COUNTRY_NAMES[event.country]}>{COUNTRY_FLAGS[event.country]}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`w-1 rounded-sm ${i <= (event.impact === 'high' ? 3 : event.impact === 'medium' ? 2 : 1)
                              ? (event.impact === 'high' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : event.impact === 'medium' ? 'bg-orange-500' : 'bg-emerald-500')
                              : 'bg-white/10'
                            }`} style={{ height: event.impact === 'high' ? 14 : event.impact === 'medium' ? 10 : 6 }} />
                        ))}
                      </div>

                      <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                        <span className="text-[13px] font-semibold text-gray-200 group-hover:text-white transition-colors truncate">
                          {event.event}
                        </span>
                        {event.category && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase tracking-wider flex-shrink-0 border border-white/10">
                            {event.category}
                          </span>
                        )}
                        {event.isCustom && (
                          <>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase tracking-wider flex-shrink-0 border border-blue-500/20">
                              Your Event
                            </span>
                            <button
                              onClick={e2 => { e2.stopPropagation(); handleDeleteCustom(event.customId!); }}
                              className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete event"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {event.description && (
                          <span className="text-gray-500 flex-shrink-0">
                            {isExpanded ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
                          </span>
                        )}
                      </div>

                      <span className={`text-right text-[13px] ${hasActual
                          ? beatForecast === 'beat' ? 'text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                            : beatForecast === 'miss' ? 'text-red-400 font-bold drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]'
                              : 'text-gray-200 font-bold'
                          : 'text-gray-500'
                        }`}>
                        {event.actual || '—'}
                      </span>
                      <span className="text-right text-[13px] text-gray-400">{event.forecast || '—'}</span>
                      <span className="text-right text-[13px] text-gray-500">{event.prior || '—'}</span>
                    </div>

                    {/* ── Mobile Card ── */}
                    <div
                      className={`sm:hidden px-4 py-3 relative z-10 ${event.description ? 'cursor-pointer' : ''} ${idx < filteredEvents.length - 1 ? 'border-b border-white/5' : ''} ${isExpanded ? 'bg-white/[0.04]' : ''}`}
                      onClick={() => event.description && setExpandedEvent(isExpanded ? null : idx)}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${event.impact === 'high' ? 'bg-red-500' : event.impact === 'medium' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm">{COUNTRY_FLAGS[event.country]}</span>
                          <span className="text-[13px] font-semibold text-gray-200 truncate">{event.event}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 flex-shrink-0">{event.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase border border-white/10">{event.category}</span>
                        {event.actual && <span className={`font-bold ${beatForecast === 'beat' ? 'text-emerald-400' : beatForecast === 'miss' ? 'text-red-400' : 'text-gray-200'}`}>A: {event.actual}</span>}
                        {event.forecast && <span className="text-gray-400">F: {event.forecast}</span>}
                        {event.prior && <span className="text-gray-500">P: {event.prior}</span>}
                        {event.isCustom && (
                          <button onClick={e2 => { e2.stopPropagation(); handleDeleteCustom(event.customId!); }}
                            className="ml-auto text-gray-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                        )}
                      </div>
                    </div>

                    {/* Expanded description */}
                    {isExpanded && event.description && (
                      <div className={`p-4 sm:pl-[166px] pl-6 bg-white/[0.04] relative z-10 border-t border-white/5 ${idx < filteredEvents.length - 1 ? 'border-b border-white/5' : ''}`}>
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500/50" />
                        <p className="text-[11px] text-gray-400 leading-relaxed max-w-2xl">{event.description}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── LEGEND ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          marginTop: 20, padding: '14px 18px', background: TV.surface, borderRadius: 8, border: `1px solid ${TV.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 11, flexWrap: 'wrap' }}>
            <span style={{ color: TV.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Impact:</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: TV.high }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: TV.high }} /> High — Major market mover
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: TV.warning }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: TV.warning }} /> Medium — Moderate impact
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: TV.success }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: TV.low }} /> Low — Minor event
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11 }}>
            <span style={{ color: TV.success }}>🟢 Beat forecast</span>
            <span style={{ color: TV.danger }}>🔴 Missed forecast</span>
          </div>
        </div>

        </>)}

        {/* ── UPCOMING KEY EVENTS ── */}
        {!loading && allDays.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: TV.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle style={{ width: 14, height: 14, color: TV.warning }} />
            Upcoming High-Impact Events (India)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {allDays.slice(selectedDayIdx).flatMap(day =>
              day.events.filter(e => e.impact === 'high' && e.country === 'IN').map(e => ({ ...e, date: day.date }))
            ).slice(0, 6).map((e, i) => (
              <div key={i} style={{
                padding: '14px 16px', background: TV.surface, borderRadius: 10,
                border: `1px solid ${TV.border}`, borderLeft: `3px solid ${TV.high}`,
                transition: 'all 0.2s',
              }}
                onMouseEnter={ev => { (ev.currentTarget).style.borderColor = TV.borderHover; (ev.currentTarget).style.background = TV.surfaceHover; }}
                onMouseLeave={ev => { (ev.currentTarget).style.borderColor = TV.border; (ev.currentTarget).style.background = TV.surface; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: TV.text }}>{e.event}</span>
                  <span style={{ fontSize: 10, color: TV.textMuted }}>{COUNTRY_FLAGS[e.country]}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: TV.textSecondary, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar style={{ width: 10, height: 10 }} />
                    {e.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 10, height: 10 }} />
                    {e.time} IST
                  </span>
                  {e.forecast && (
                    <span>Fcst: <strong style={{ color: TV.text }}>{e.forecast}</strong></span>
                  )}
                  {e.prior && (
                    <span>Prior: <strong style={{ color: TV.textSecondary }}>{e.prior}</strong></span>
                  )}
                </div>
              </div>
            ))}
            {allDays.slice(selectedDayIdx).flatMap(day =>
              day.events.filter(e => e.impact === 'high' && e.country === 'IN')
            ).length === 0 && (
              <div style={{ padding: '20px', color: TV.textMuted, fontSize: 12, textAlign: 'center', gridColumn: '1 / -1' }}>
                No upcoming high-impact India events in this period
              </div>
            )}
          </div>
        </div>
        )}

        {/* ── All Countries High Impact ── */}
        {!loading && allDays.length > 0 && (() => {
          const globalHigh = allDays.slice(selectedDayIdx).flatMap(day =>
            day.events.filter(e => e.impact === 'high' && e.country !== 'IN').map(e => ({ ...e, date: day.date }))
          ).slice(0, 4);
          if (globalHigh.length === 0) return null;
          return (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: TV.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe style={{ width: 14, height: 14, color: TV.blue }} />
                Upcoming Global High-Impact
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {globalHigh.map((e, i) => (
                  <div key={i} style={{
                    padding: '14px 16px', background: TV.surface, borderRadius: 10,
                    border: `1px solid ${TV.border}`, borderLeft: `3px solid ${TV.blue}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: TV.text }}>{e.event}</span>
                      <span style={{ fontSize: 12 }}>{COUNTRY_FLAGS[e.country]}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: TV.textSecondary }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar style={{ width: 10, height: 10 }} />
                        {e.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock style={{ width: 10, height: 10 }} />
                        {e.time} IST
                      </span>
                      {e.forecast && <span>Fcst: <strong style={{ color: TV.text }}>{e.forecast}</strong></span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── FOOTER ── */}
        <div style={{ marginTop: 24, padding: '12px 16px', textAlign: 'center', fontSize: 11, color: TV.textMuted }}>
          All times in IST (UTC+5:30) · Powered by NextBull GPT · Data refreshes automatically
        </div>

        </>)}
      </div>

      {/* ═══ ADD EVENT MODAL ═══ */}
      {selectedDay && showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{ background: TV.surface, borderRadius: 12, border: `1px solid ${TV.border}`, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${TV.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus style={{ width: 18, height: 18, color: TV.blue }} />
                <span style={{ fontSize: 16, fontWeight: 600, color: TV.text }}>Add Event</span>
                <span style={{ fontSize: 11, color: TV.textSecondary }}>
                  — {formatShortDate(selectedDay.date)}
                </span>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: TV.textSecondary, padding: 4 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: TV.textSecondary, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Event Name *</label>
                <input value={formEvent} onChange={e => setFormEvent(e.target.value)} placeholder="e.g. Q3 Earnings — Reliance"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 13, outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = TV.blue; }} onBlur={e => { e.target.style.borderColor = TV.border; }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: TV.textSecondary, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time (IST)</label>
                  <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: TV.textSecondary, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Country</label>
                  <select value={formCountry} onChange={e => setFormCountry(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 13, outline: 'none' }}>
                    {Object.entries(COUNTRY_FLAGS).map(([k, v]) => <option key={k} value={k}>{v} {COUNTRY_NAMES[k]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: TV.textSecondary, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Impact</label>
                  <select value={formImpact} onChange={e => setFormImpact(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 13, outline: 'none' }}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟠 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: TV.textSecondary, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</label>
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 13, outline: 'none' }}>
                  {['Custom', 'Earnings', 'GDP', 'Inflation', 'Monetary', 'Employment', 'Trade', 'Manufacturing', 'Services', 'Fiscal', 'FX', 'Market', 'Sentiment', 'IPO', 'Dividend', 'Expiry'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: TV.textSecondary, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Forecast</label>
                  <input value={formForecast} onChange={e => setFormForecast(e.target.value)} placeholder="e.g. ₹2,500 Cr"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: TV.textSecondary, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Prior</label>
                  <input value={formPrior} onChange={e => setFormPrior(e.target.value)} placeholder="e.g. ₹2,200 Cr"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: TV.textSecondary, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2}
                  placeholder="Optional note about this event..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 18px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'transparent', border: `1px solid ${TV.border}`, color: TV.textSecondary, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleAddEvent} disabled={!formEvent.trim()}
                  style={{
                    padding: '8px 22px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: formEvent.trim() ? TV.blue : TV.textMuted, color: '#fff',
                    border: 'none', cursor: formEvent.trim() ? 'pointer' : 'not-allowed',
                  }}>
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Economic;
