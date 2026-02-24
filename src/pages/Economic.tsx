import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

/* ═══════════════════════════════════════════
   TradingView Colors
   ═══════════════════════════════════════════ */
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
   MOCK CALENDAR DATA (Real Indian + Global Events)
   ═══════════════════════════════════════════ */
function generateEvents(): DayEvents[] {
  const today = new Date();
  const days: DayEvents[] = [];

  // Helper to create date
  const d = (offset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt;
  };

  days.push({
    date: d(-1),
    events: [
      { time: '09:00', country: 'IN', impact: 'high', category: 'Monetary', event: 'RBI Interest Rate Decision', actual: '6.50%', forecast: '6.50%', prior: '6.50%', description: 'Reserve Bank of India benchmark repo rate decision' },
      { time: '09:00', country: 'IN', impact: 'high', category: 'Monetary', event: 'RBI Monetary Policy Statement', description: 'Monetary policy stance and forward guidance' },
      { time: '09:15', country: 'IN', impact: 'medium', category: 'Monetary', event: 'RBI Press Conference', description: 'Governor press conference post-policy' },
      { time: '14:00', country: 'US', impact: 'medium', category: 'Employment', event: 'Initial Jobless Claims', actual: '219K', forecast: '215K', prior: '213K' },
      { time: '19:30', country: 'US', impact: 'high', category: 'Inflation', event: 'Core PCE Price Index (MoM)', actual: '0.3%', forecast: '0.2%', prior: '0.2%' },
    ],
  });

  days.push({
    date: d(0),
    events: [
      { time: '09:00', country: 'IN', impact: 'high', category: 'GDP', event: 'India GDP Growth Rate (Q3)', forecast: '6.5%', prior: '5.4%', description: 'Quarterly gross domestic product growth rate' },
      { time: '09:00', country: 'IN', impact: 'high', category: 'Trade', event: 'India Trade Balance', forecast: '-$22.5B', prior: '-$21.9B', description: 'Difference between exports and imports' },
      { time: '09:00', country: 'IN', impact: 'medium', category: 'Manufacturing', event: 'India Manufacturing PMI', forecast: '57.5', prior: '56.5', description: 'S&P Global India Manufacturing PMI' },
      { time: '10:00', country: 'IN', impact: 'medium', category: 'Fiscal', event: 'Fiscal Deficit (YTD)', forecast: '-₹12.5 Lakh Cr', prior: '-₹11.8 Lakh Cr' },
      { time: '12:00', country: 'IN', impact: 'low', category: 'FX', event: 'Forex Reserves', forecast: '$625.5B', prior: '$623.2B', description: 'Weekly foreign exchange reserves' },
      { time: '14:00', country: 'IN', impact: 'high', category: 'Market', event: 'FII/DII Net Investment', description: 'Foreign & Domestic institutional flows in equity' },
      { time: '15:30', country: 'IN', impact: 'medium', category: 'Market', event: 'India VIX', description: 'NSE volatility index reading at market close' },
      { time: '19:30', country: 'US', impact: 'high', category: 'Employment', event: 'Non-Farm Payrolls', forecast: '185K', prior: '256K', description: 'Monthly change in US jobs' },
      { time: '19:30', country: 'US', impact: 'high', category: 'Employment', event: 'US Unemployment Rate', forecast: '4.1%', prior: '4.1%' },
      { time: '20:00', country: 'US', impact: 'medium', category: 'Sentiment', event: 'Michigan Consumer Sentiment', forecast: '68.8', prior: '71.1' },
    ],
  });

  days.push({
    date: d(1),
    events: [
      { time: '09:00', country: 'IN', impact: 'high', category: 'Inflation', event: 'India CPI Inflation (YoY)', forecast: '4.8%', prior: '5.22%', description: 'Consumer Price Index annual change' },
      { time: '09:00', country: 'IN', impact: 'medium', category: 'Inflation', event: 'India WPI Inflation (YoY)', forecast: '2.1%', prior: '2.37%', description: 'Wholesale Price Index annual change' },
      { time: '09:00', country: 'IN', impact: 'medium', category: 'Manufacturing', event: 'Industrial Production (YoY)', forecast: '4.2%', prior: '3.5%' },
      { time: '14:00', country: 'IN', impact: 'low', category: 'Trade', event: 'India Exports (YoY)', forecast: '5.8%', prior: '10.9%' },
      { time: '22:00', country: 'US', impact: 'high', category: 'Inflation', event: 'US CPI (YoY)', forecast: '2.9%', prior: '2.9%' },
    ],
  });

  days.push({
    date: d(2),
    events: [
      { time: '09:00', country: 'IN', impact: 'medium', category: 'Services', event: 'India Services PMI', forecast: '58.0', prior: '56.5', description: 'S&P Global India Services PMI' },
      { time: '09:00', country: 'IN', impact: 'medium', category: 'Manufacturing', event: 'India Composite PMI', forecast: '57.8', prior: '57.7' },
      { time: '15:00', country: 'UK', impact: 'medium', category: 'GDP', event: 'UK GDP (QoQ)', forecast: '0.2%', prior: '-0.1%' },
      { time: '19:30', country: 'US', impact: 'medium', category: 'Inflation', event: 'US PPI (MoM)', forecast: '0.3%', prior: '0.2%' },
    ],
  });

  days.push({
    date: d(3),
    events: [
      { time: '09:00', country: 'IN', impact: 'high', category: 'Monetary', event: 'RBI MPC Meeting Minutes', description: 'Detailed minutes of the latest RBI MPC meeting' },
      { time: '12:00', country: 'IN', impact: 'medium', category: 'Fiscal', event: 'Government Revenue Collection', description: 'Monthly GST and direct tax collection data' },
      { time: '15:30', country: 'EU', impact: 'high', category: 'Monetary', event: 'ECB Interest Rate Decision', forecast: '2.75%', prior: '2.90%' },
      { time: '19:30', country: 'US', impact: 'medium', category: 'Employment', event: 'US Initial Jobless Claims', forecast: '220K', prior: '219K' },
    ],
  });

  days.push({
    date: d(4),
    events: [
      { time: '09:00', country: 'IN', impact: 'medium', category: 'Market', event: 'F&O Monthly Expiry', description: 'NIFTY/Bank NIFTY monthly derivatives expiry' },
      { time: '09:00', country: 'IN', impact: 'low', category: 'Trade', event: 'India Balance of Payments', forecast: '$8.5B', prior: '$10.2B' },
      { time: '10:00', country: 'CN', impact: 'medium', category: 'Manufacturing', event: 'China Manufacturing PMI', forecast: '50.1', prior: '49.1' },
      { time: '19:30', country: 'US', impact: 'medium', category: 'GDP', event: 'US GDP (QoQ)', forecast: '2.6%', prior: '3.1%' },
    ],
  });

  days.push({
    date: d(5),
    events: [
      { time: '09:00', country: 'IN', impact: 'high', category: 'GDP', event: 'India GDP Annual Estimate', forecast: '6.8%', prior: '8.2%', description: 'CSO advance estimate of annual GDP growth' },
      { time: '09:00', country: 'IN', impact: 'medium', category: 'FX', event: 'RBI Forex Intervention', description: 'Weekly net USD buy/sell by RBI' },
      { time: '15:00', country: 'JP', impact: 'medium', category: 'Monetary', event: 'BOJ Rate Decision', forecast: '0.50%', prior: '0.50%' },
    ],
  });

  return days;
}

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳', US: '🇺🇸', EU: '🇪🇺', JP: '🇯🇵', CN: '🇨🇳', UK: '🇬🇧', GL: '🌐',
};

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', EU: 'Eurozone', JP: 'Japan', CN: 'China', UK: 'United Kingdom', GL: 'Global',
};

const IMPACT_LABELS: Record<string, string> = { high: 'HIGH', medium: 'MED', low: 'LOW' };

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
const Economic = () => {
  const [allDays] = useState<DayEvents[]>(generateEvents);
  const [selectedDayIdx, setSelectedDayIdx] = useState(1);
  const [impactFilter, setImpactFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [countryFilter, setCountryFilter] = useState<'all' | 'IN' | 'US' | 'EU' | 'JP' | 'CN' | 'UK'>('all');
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>(loadCustomEvents);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for add modal
  const [formTime, setFormTime] = useState('09:00');
  const [formCountry, setFormCountry] = useState<CustomEvent['country']>('IN');
  const [formImpact, setFormImpact] = useState<CustomEvent['impact']>('medium');
  const [formCategory, setFormCategory] = useState('Custom');
  const [formEvent, setFormEvent] = useState('');
  const [formForecast, setFormForecast] = useState('');
  const [formPrior, setFormPrior] = useState('');
  const [formDescription, setFormDescription] = useState('');

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
    return true;
  });

  const isToday = selectedDayIdx === 1;

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
    // Reset form
    setFormEvent(''); setFormForecast(''); setFormPrior(''); setFormDescription('');
    setFormTime('09:00'); setFormCategory('Custom'); setFormCountry('IN'); setFormImpact('medium');
    setShowAddModal(false);
  };

  const handleDeleteCustom = (id: string) => {
    const updated = customEvents.filter(e => e.id !== id);
    setCustomEvents(updated);
    saveCustomEvents(updated);
  };

  const formatDate = (date: Date) => {
    const opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-IN', opts);
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
  };

  return (
    <div style={{ background: TV.bg, minHeight: 'calc(100vh - 3.5rem)', color: TV.text }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: TV.text, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calendar style={{ width: 24, height: 24, color: TV.blue }} />
              Economic Calendar
            </h1>
            <p style={{ fontSize: 12, color: TV.textSecondary, marginTop: 4, marginLeft: 34 }}>
              Track key economic events that impact Indian & global markets
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: TV.blue, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget).style.background = TV.blueHover; }}
              onMouseLeave={e => { (e.currentTarget).style.background = TV.blue; }}
            >
              <Plus style={{ width: 14, height: 14 }} /> Add Event
            </button>
            <span style={{ fontSize: 10, color: TV.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>IST</span>
            <Clock style={{ width: 14, height: 14, color: TV.textMuted }} />
          </div>
        </div>

        {/* ── DATE NAVIGATION ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '12px 16px',
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

        {/* ── FILTERS ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter style={{ width: 12, height: 12, color: TV.textMuted }} />
            <span style={{ fontSize: 11, color: TV.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Impact:</span>
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

          <span style={{ width: 1, height: 20, background: TV.border }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe style={{ width: 12, height: 12, color: TV.textMuted }} />
            <span style={{ fontSize: 11, color: TV.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Country:</span>
          </div>
          {(['all', 'IN', 'US', 'EU'] as const).map(c => (
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
          <span style={{ fontSize: 12, color: TV.textSecondary }}>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── TABLE HEADER ── */}
        <div className="grid grid-cols-[60px_40px_50px_1fr_90px_90px_90px] px-4 py-3 bg-[#1e222d] rounded-t-2xl border border-white/10 border-b-0 text-[10px] font-bold text-gray-500 uppercase tracking-widest relative">
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
        <div className="rounded-b-2xl overflow-hidden border border-white/10 bg-[#1e222d]/60 backdrop-blur-xl shadow-2xl relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-[13px] text-gray-400">No events matching filters</p>
                <p className="text-[11px] text-gray-500 mt-1">Try adjusting impact or country filters</p>
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
                    {/* Hover Glow Background */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/[0.03] transition-opacity duration-300 pointer-events-none" />

                    <div
                      className={`grid grid-cols-[60px_40px_50px_1fr_90px_90px_90px] px-4 py-3 items-center relative z-10 ${event.description ? 'cursor-pointer hover:bg-white/[0.02]' : 'cursor-default'
                        } ${idx < filteredEvents.length - 1 ? 'border-b border-white/5' : ''} ${isExpanded ? 'bg-white/[0.04]' : ''
                        } transition-colors duration-200`}
                      onClick={() => event.description && setExpandedEvent(isExpanded ? null : idx)}
                    >
                      {/* Left accent color for impact on hover */}
                      <div className={`absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${event.impact === 'high' ? 'bg-red-500' : event.impact === 'medium' ? 'bg-orange-500' : 'bg-emerald-500'
                        }`} />

                      {/* Time */}
                      <span className="text-xs text-gray-400 font-mono tracking-wide">{event.time}</span>

                      {/* Country flag */}
                      <span className="text-base" title={COUNTRY_NAMES[event.country]}>{COUNTRY_FLAGS[event.country]}</span>

                      {/* Impact */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`w-1 rounded-sm ${i <= (event.impact === 'high' ? 3 : event.impact === 'medium' ? 2 : 1)
                              ? (event.impact === 'high' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : event.impact === 'medium' ? 'bg-orange-500' : 'bg-emerald-500')
                              : 'bg-white/10'
                            }`} style={{ height: event.impact === 'high' ? 14 : event.impact === 'medium' ? 10 : 6 }} />
                        ))}
                      </div>

                      {/* Event name */}
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
                      </div>

                      {/* Actual */}
                      <span className={`text-right text-[13px] ${hasActual
                          ? beatForecast === 'beat' ? 'text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                            : beatForecast === 'miss' ? 'text-red-400 font-bold drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]'
                              : 'text-gray-200 font-bold'
                          : 'text-gray-500'
                        }`}>
                        {event.actual || '—'}
                      </span>

                      {/* Forecast */}
                      <span className="text-right text-[13px] text-gray-400">{event.forecast || '—'}</span>

                      {/* Prior */}
                      <span className="text-right text-[13px] text-gray-500">{event.prior || '—'}</span>
                    </div>

                    {/* Expanded description */}
                    {isExpanded && event.description && (
                      <div className={`p-4 pl-[166px] bg-white/[0.04] relative z-10 border-t border-white/5 ${idx < filteredEvents.length - 1 ? 'border-b border-white/5' : ''
                        }`}>
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
          marginTop: 20, padding: '14px 18px', background: TV.surface, borderRadius: 8, border: `1px solid ${TV.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 11 }}>
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
            <span style={{ color: TV.success }}>🟢 Actual beat forecast</span>
            <span style={{ color: TV.danger }}>🔴 Actual missed forecast</span>
          </div>
        </div>

        {/* ── UPCOMING KEY EVENTS ── */}
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: TV.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle style={{ width: 14, height: 14, color: TV.warning }} />
            Upcoming High-Impact Events (India)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {allDays.slice(selectedDayIdx).flatMap(day =>
              day.events.filter(e => e.impact === 'high' && e.country === 'IN').map(e => ({ ...e, date: day.date }))
            ).slice(0, 4).map((e, i) => (
              <div key={i} style={{
                padding: '14px 16px', background: TV.surface, borderRadius: 8,
                border: `1px solid ${TV.border}`, borderLeft: `3px solid ${TV.high}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: TV.text }}>{e.event}</span>
                  <span style={{ fontSize: 10, color: TV.textMuted }}>{COUNTRY_FLAGS[e.country]}</span>
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
                  {e.forecast && (
                    <span>Fcst: <strong style={{ color: TV.text }}>{e.forecast}</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ marginTop: 24, padding: '12px 16px', textAlign: 'center', fontSize: 11, color: TV.textMuted }}>
          All times in IST (UTC+5:30) · Powered by NextBull GPT · Data refreshes automatically
        </div>
      </div>

      {/* ═══ ADD EVENT MODAL ═══ */}
      {showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{ background: TV.surface, borderRadius: 12, border: `1px solid ${TV.border}`, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
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

            {/* Modal Body */}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Event Name (required) */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: TV.textSecondary, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Event Name *</label>
                <input value={formEvent} onChange={e => setFormEvent(e.target.value)} placeholder="e.g. Q3 Earnings — Reliance"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 13, outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = TV.blue; }} onBlur={e => { e.target.style.borderColor = TV.border; }}
                />
              </div>

              {/* Row: Time + Country + Impact */}
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

              {/* Category */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: TV.textSecondary, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</label>
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 13, outline: 'none' }}>
                  {['Custom', 'Earnings', 'GDP', 'Inflation', 'Monetary', 'Employment', 'Trade', 'Manufacturing', 'Services', 'Fiscal', 'FX', 'Market', 'Sentiment', 'IPO', 'Dividend', 'Expiry'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Row: Forecast + Prior */}
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

              {/* Description */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: TV.textSecondary, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2}
                  placeholder="Optional note about this event..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Actions */}
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
