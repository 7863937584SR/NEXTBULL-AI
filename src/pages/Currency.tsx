import { useState, useEffect, useMemo, useCallback } from 'react';
import { Activity, Globe, TrendingUp, Calculator, BarChart3, Zap, Clock, AlertTriangle, CheckCircle, BarChart, ArrowUp, ArrowDown, Minus, IndianRupee, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import EnhancedCurrencyDashboard from '@/components/dashboard/EnhancedCurrencyDashboard';
import CurrencyConverter from '@/components/dashboard/CurrencyConverter';
import { TVLazyWidget } from '@/components/dashboard/TVLazyWidget';
import { useQuery } from '@tanstack/react-query';
import { fetchDetailedForexRates } from '@/services/forexService';
import { NextBullLogo } from '@/components/NextBullLogo';

const TVUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

interface VolatilityItem {
  pair: string;
  volatility: number;
  trend: 'rising' | 'falling' | 'stable';
  rate: number;
  change: number;
  changePct: number;
  prevClose: number;
}

// Fetch real-time volatility data from live forex rates — expanded pairs including INR
const fetchVolatilityData = async (): Promise<VolatilityItem[]> => {
  const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  if (!response.ok) throw new Error('Failed to fetch volatility data');
  const data = await response.json();
  const rates = data.rates || {};

  // Get yesterday's rates for real change calculation
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  let histRates: Record<string, number> = {};
  try {
    const histRes = await fetch(`https://api.frankfurter.app/${yesterday.toISOString().split('T')[0]}`);
    if (histRes.ok) {
      const histData = await histRes.json();
      histRates = histData.rates || {};
    }
  } catch {}

  const pairs: { from: string; to: string }[] = [
    { from: 'EUR', to: 'USD' },
    { from: 'GBP', to: 'USD' },
    { from: 'USD', to: 'JPY' },
    { from: 'USD', to: 'CHF' },
    { from: 'AUD', to: 'USD' },
    { from: 'USD', to: 'CAD' },
    { from: 'USD', to: 'INR' },
    { from: 'EUR', to: 'INR' },
    { from: 'GBP', to: 'INR' },
    { from: 'NZD', to: 'USD' },
    { from: 'USD', to: 'SGD' },
    { from: 'USD', to: 'HKD' },
  ];

  return pairs.map(({ from, to }) => {
    let cur: number, prev: number;
    if (to === 'USD') {
      cur = 1 / (rates[from] || 1);
      prev = 1 / (histRates[from] || rates[from] || 1);
    } else if (from === 'USD') {
      cur = rates[to] || 1;
      prev = histRates[to] || rates[to] || 1;
    } else {
      // Cross pair like EUR/INR = USD/INR * (1/USD/EUR) = USD/INR / USD/EUR
      cur = (rates[to] || 1) / (rates[from] || 1);
      prev = (histRates[to] || rates[to] || 1) / (histRates[from] || rates[from] || 1);
    }
    const changePct = prev ? Math.abs(((cur - prev) / prev) * 100) : 0;
    const volatility = changePct * Math.sqrt(252);
    const trend: 'rising' | 'falling' | 'stable' = cur > prev ? 'rising' : cur < prev ? 'falling' : 'stable';
    return {
      pair: `${from}/${to}`,
      volatility: Math.round(volatility * 10) / 10,
      trend,
      rate: cur,
      change: cur - prev,
      changePct: ((cur - prev) / prev) * 100,
      prevClose: prev,
    };
  });
};

// Session color helpers — concrete class maps for Tailwind JIT
const SESSION_DOT: Record<string, string> = {
  active_sydney: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)] animate-pulse',
  active_tokyo: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)] animate-pulse',
  active_london: 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse',
  active_ny: 'bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.5)] animate-pulse',
  inactive: 'bg-gray-600',
};
const SESSION_TEXT: Record<string, string> = {
  active_sydney: 'text-cyan-400',
  active_tokyo: 'text-cyan-400',
  active_london: 'text-emerald-400',
  active_ny: 'text-purple-400',
  inactive: 'text-gray-600',
};

// Chart pair selector options
const CHART_PAIRS = [
  { symbol: 'FX_IDC:USDINR', label: 'USD/INR' },
  { symbol: 'FX_IDC:EURUSD', label: 'EUR/USD' },
  { symbol: 'FX_IDC:GBPUSD', label: 'GBP/USD' },
  { symbol: 'FX_IDC:USDJPY', label: 'USD/JPY' },
  { symbol: 'FX_IDC:AUDUSD', label: 'AUD/USD' },
  { symbol: 'FX_IDC:USDCAD', label: 'USD/CAD' },
  { symbol: 'FX_IDC:USDCHF', label: 'USD/CHF' },
  { symbol: 'FX_IDC:EURINR', label: 'EUR/INR' },
  { symbol: 'FX_IDC:GBPINR', label: 'GBP/INR' },
  { symbol: 'FX_IDC:NZDUSD', label: 'NZD/USD' },
];

export default function CurrencyPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [marketTime, setMarketTime] = useState(new Date());
  const [chartPair, setChartPair] = useState(CHART_PAIRS[0]);
  const [selectedVolPair, setSelectedVolPair] = useState<VolatilityItem | null>(null);

  // Real-time volatility data (expanded pairs including INR)
  const { data: volatilityData, isLoading: volatilityLoading } = useQuery({
    queryKey: ['volatility-data'],
    queryFn: fetchVolatilityData,
    refetchInterval: 30000,
  });

  // Live detailed forex rates for FX pairs section
  const { data: detailedRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['detailed-forex-rates'],
    queryFn: fetchDetailedForexRates,
    refetchInterval: 30000,
  });

  // Update market time every second
  useEffect(() => {
    const timer = setInterval(() => setMarketTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Derived: USD/INR from volatility data
  const usdInr = useMemo(() => volatilityData?.find(v => v.pair === 'USD/INR'), [volatilityData]);

  // Calculate real forex session statuses based on current UTC time
  const forexSessions = useMemo(() => {
    const utcH = marketTime.getUTCHours() + marketTime.getUTCMinutes() / 60;
    const isSydney = utcH >= 21 || utcH < 6;
    const isTokyo = utcH >= 0 && utcH < 9;
    const isLondon = utcH >= 7 && utcH < 16;
    const isNewYork = utcH >= 12 && utcH < 21;
    return [
      { name: 'Sydney', active: isSydney, time: '21:00-06:00 UTC', key: 'sydney' as const },
      { name: 'Tokyo', active: isTokyo, time: '00:00-09:00 UTC', key: 'tokyo' as const },
      { name: 'London', active: isLondon, time: '07:00-16:00 UTC', key: 'london' as const },
      { name: 'New York', active: isNewYork, time: '12:00-21:00 UTC', key: 'ny' as const },
    ];
  }, [marketTime]);

  const activeSessions = forexSessions.filter(s => s.active).length;

  // Avg volatility
  const avgVol = useMemo(() => {
    if (!volatilityData?.length) return 0;
    return volatilityData.reduce((a, v) => a + v.volatility, 0) / volatilityData.length;
  }, [volatilityData]);

  // Market sentiment from live data
  const sentimentPct = useMemo(() => {
    if (!volatilityData?.length) return 50;
    const positive = volatilityData.filter(v => v.changePct > 0).length;
    return Math.round((positive / volatilityData.length) * 100);
  }, [volatilityData]);

  const getSessionClasses = useCallback((session: { active: boolean; key: string }) => {
    const id = session.active ? `active_${session.key}` : 'inactive';
    return { dot: SESSION_DOT[id] || SESSION_DOT.inactive, text: SESSION_TEXT[id] || SESSION_TEXT.inactive };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-emerald-400 font-mono">
      <div className="container mx-auto px-4 py-6 space-y-6">
        
        {/* ═══ HEADER ═══ */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/15 bg-[#0a0a0a]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 50%),
                             radial-gradient(circle at 80% 50%, rgba(34, 211, 238, 0.03) 0%, transparent 50%)`
          }} />
          
          <div className="relative z-10 py-6 px-6">
            <div className="flex items-center gap-5 mb-5">
              <NextBullLogo size="md" glow animated showText={false} />
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-emerald-400 tracking-tight drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  FX TRADING HUB
                </h1>
                <p className="text-cyan-400/60 text-sm mt-1 tracking-wider">PROFESSIONAL CURRENCY MARKETS &bull; LIVE FEED</p>
              </div>
              <div className="ml-auto hidden md:flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)] animate-pulse" />
                  <span className="text-emerald-400 text-xs font-bold">LIVE</span>
                </div>
                <span className="text-cyan-400/50 text-xs">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {marketTime.toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>
            </div>
            
            {/* ═══ USD/INR HERO + Quick Stats ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
              {/* USD/INR Hero Card */}
              <div className="md:col-span-2 rounded-xl p-4 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400/80 tracking-wider">USD / INR</span>
                    <Badge className="ml-auto bg-emerald-500/15 text-emerald-300 text-[9px] border-emerald-500/20">
                      LIVE
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-emerald-400 tabular-nums drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                      {usdInr ? `₹${usdInr.rate.toFixed(4)}` : volatilityLoading ? '...' : '₹--'}
                    </span>
                    {usdInr && (
                      <span className={`text-sm font-bold flex items-center gap-0.5 ${
                        usdInr.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {usdInr.changePct >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {usdInr.changePct >= 0 ? '+' : ''}{usdInr.changePct.toFixed(3)}%
                      </span>
                    )}
                  </div>
                  {usdInr && (
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                      <span>Prev: ₹{usdInr.prevClose.toFixed(4)}</span>
                      <span>Chg: {usdInr.change >= 0 ? '+' : ''}{usdInr.change.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick stat cards */}
              <div className="rounded-lg p-3 text-center border border-emerald-500/15 bg-[#0d0d0d]">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)] animate-pulse" />
                  <span className="text-[10px] font-semibold text-emerald-400/80">MARKET</span>
                </div>
                <div className="text-lg font-bold text-emerald-400">{activeSessions > 0 ? 'OPEN' : 'LOW'}</div>
                <div className="text-[10px] text-gray-500">{activeSessions}/4 Sessions</div>
              </div>
              
              <div className="rounded-lg p-3 text-center border border-purple-500/15 bg-[#0d0d0d]">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <Activity className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] font-semibold text-purple-400/80">VOLATILITY</span>
                </div>
                <div className="text-lg font-bold text-purple-400">
                  {volatilityLoading ? '...' : `${avgVol.toFixed(1)}%`}
                </div>
                <div className="text-[10px] text-gray-500">
                  {avgVol > 15 ? 'High' : avgVol > 8 ? 'Moderate' : 'Low'}
                </div>
              </div>
              
              <div className="rounded-lg p-3 text-center border border-amber-500/15 bg-[#0d0d0d]">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-semibold text-amber-400/80">SENTIMENT</span>
                </div>
                <div className={`text-lg font-bold ${sentimentPct >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {sentimentPct}%
                </div>
                <div className="text-[10px] text-gray-500">{sentimentPct >= 50 ? 'Risk-On' : 'Risk-Off'}</div>
              </div>
            </div>
              
            {/* Sessions Bar — fixed Tailwind classes */}
            <div className="rounded-lg p-3 border border-emerald-500/10 bg-[#0d0d0d]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-semibold text-gray-500 tracking-wider">SESSIONS:</span>
                  {forexSessions.map(session => {
                    const cls = getSessionClasses(session);
                    return (
                      <div key={session.name} className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${cls.dot}`} />
                        <span className={`text-[10px] font-medium ${cls.text}`}>
                          {session.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-gray-500">
                  {activeSessions}/4 ACTIVE &bull; FX MARKET {activeSessions > 0 ? 'OPEN 24/5' : 'LOW ACTIVITY'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {/* Professional Trading Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="relative">
            <TabsList className="grid w-full grid-cols-5 bg-[#0a0a0a] border border-emerald-500/15 rounded-lg h-12">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:shadow-[inset_0_0_12px_rgba(16,185,129,0.1)] rounded-lg transition-all">
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="converter" className="flex items-center gap-2 text-xs data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-400 data-[state=active]:shadow-[inset_0_0_12px_rgba(34,211,238,0.1)] rounded-lg transition-all">
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Calculator</span>
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-2 text-xs data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-400 data-[state=active]:shadow-[inset_0_0_12px_rgba(168,85,247,0.1)] rounded-lg transition-all">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Charts</span>
              </TabsTrigger>
              <TabsTrigger value="volatility" className="flex items-center gap-2 text-xs data-[state=active]:bg-red-500/15 data-[state=active]:text-red-400 data-[state=active]:shadow-[inset_0_0_12px_rgba(248,113,113,0.1)] rounded-lg transition-all">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Risk</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2 text-xs data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 data-[state=active]:shadow-[inset_0_0_12px_rgba(245,158,11,0.1)] rounded-lg transition-all">
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Analysis</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <EnhancedCurrencyDashboard />
          </TabsContent>

          <TabsContent value="converter" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <CurrencyConverter />
              </div>
              
              <div className="space-y-4">
                {/* Real-time Market Summary */}
                <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      Live Market Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent" />
                        <div className="relative">
                          <div className="text-xl font-bold text-emerald-400 font-mono">
                            {activeSessions}/4
                          </div>
                          <div className="text-xs text-slate-400">Sessions Active</div>
                          <div className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1">
                            <CheckCircle className="w-2 h-2" />
                            Live
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent" />
                        <div className="relative">
                          <div className="text-xl font-bold text-blue-400 font-mono">{volatilityData?.length || 12}</div>
                          <div className="text-xs text-slate-400">Tracked Pairs</div>
                          <div className="text-[10px] text-blue-500 flex items-center gap-1 mt-1">
                            <Activity className="w-2 h-2" />
                            Trading
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent" />
                        <div className="relative">
                          <div className="text-xl font-bold text-purple-400 font-mono">24/7</div>
                          <div className="text-xs text-slate-400">Market Access</div>
                          <div className="text-[10px] text-purple-500 flex items-center gap-1 mt-1">
                            <Globe className="w-2 h-2" />
                            Global
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent" />
                        <div className="relative">
                          <div className="text-xl font-bold text-amber-400 font-mono">0.1-2</div>
                          <div className="text-xs text-slate-400">Pip Spreads</div>
                          <div className="text-[10px] text-amber-500 flex items-center gap-1 mt-1">
                            <Zap className="w-2 h-2" />
                            Tight
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Volatility Meter */}
                    <div className="mt-4 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-300">Market Volatility</span>
                        {(() => {
                          const avg = volatilityData ? volatilityData.reduce((a, v) => a + v.volatility, 0) / volatilityData.length : 0;
                          const label = avg > 20 ? 'High' : avg > 10 ? 'Moderate' : 'Low';
                          const color = avg > 20 ? 'bg-red-500/20 text-red-300' : avg > 10 ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300';
                          return (
                            <Badge variant="secondary" className={`${color} text-xs`}>
                              {volatilityLoading ? 'Loading...' : label}
                            </Badge>
                          );
                        })()}
                      </div>
                      <Progress value={volatilityData ? Math.min(volatilityData.reduce((a, v) => a + v.volatility, 0) / volatilityData.length * 3, 100) : 0} className="h-2 bg-slate-700" />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Major Trading Pairs with Real-time Data */}
                <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-500" />
                      Major FX Pairs
                      <Badge variant="secondary" className="ml-auto bg-emerald-500/20 text-emerald-300 text-xs">
                        {ratesLoading ? 'Loading...' : 'Live'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ratesLoading ? (
                        [...Array(6)].map((_, i) => (
                          <div key={i} className="p-3 rounded-lg border border-slate-600/30 bg-slate-700/20 animate-pulse">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2"><div className="h-4 w-20 bg-slate-600 rounded" /><div className="h-3 w-16 bg-slate-600 rounded" /></div>
                              <div className="space-y-2"><div className="h-4 w-16 bg-slate-600 rounded" /><div className="h-3 w-12 bg-slate-600 rounded" /></div>
                            </div>
                          </div>
                        ))
                      ) : detailedRates?.slice(0, 6).map(item => {
                        const isPositive = item.changePercent >= 0;
                        return (
                          <div key={item.pair} className={`p-3 rounded-lg border transition-all duration-200 hover:scale-[1.01] ${
                            isPositive 
                              ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' 
                              : 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                                }`} />
                                <div>
                                  <div className="font-bold text-sm">{item.pair}</div>
                                  <div className="text-xs text-slate-400 flex items-center gap-2">
                                    <span>Bid: {item.bid.toFixed(4)}</span>
                                    <span>•</span>
                                    <span>Ask: {item.ask.toFixed(4)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-sm font-bold">{item.rate.toFixed(item.pair.includes('JPY') ? 2 : 4)}</div>
                                <div className={`text-xs font-semibold ${
                                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                  <span>{isPositive ? '+' : ''}{item.change.toFixed(4)}</span>
                                  <span className="ml-1">({isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%)</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Mini price movement indicator */}
                            <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${
                                isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                              }`} style={{ width: `${Math.min(Math.abs(item.changePercent) * 20 + 20, 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            {/* Live Pair Chart with Selector */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Live Chart
                  <div className="ml-auto flex items-center gap-2 flex-wrap">
                    {CHART_PAIRS.map(p => (
                      <Button
                        key={p.symbol}
                        size="sm"
                        variant={chartPair.symbol === p.symbol ? 'default' : 'outline'}
                        className={`text-[10px] h-6 px-2 ${
                          chartPair.symbol === p.symbol
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'border-slate-600 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30'
                        }`}
                        onClick={() => setChartPair(p)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TVLazyWidget
                  key={chartPair.symbol}
                  src={`${TVUrl}mini-symbol-overview.js`}
                  height="400px"
                  skeletonHeight="h-[400px]"
                  config={{
                    symbol: chartPair.symbol,
                    width: '100%',
                    height: '400',
                    locale: 'en',
                    dateRange: '1M',
                    colorTheme: 'dark',
                    isTransparent: true,
                    autosize: true,
                    largeChartUrl: '',
                  }}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Forex Heat Map */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Forex Heat Map
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TVLazyWidget
                    src={`${TVUrl}forex-heat-map.js`}
                    height="400px"
                    skeletonHeight="h-[400px]"
                    config={{
                      width: '100%',
                      height: '400',
                      currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD', 'INR'],
                      isTransparent: true,
                      colorTheme: 'dark',
                      locale: 'en',
                    }}
                  />
                </CardContent>
              </Card>

              {/* Cross Rates */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-500" />
                    Cross Rates
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TVLazyWidget
                    src={`${TVUrl}forex-cross-rates.js`}
                    height="400px"
                    skeletonHeight="h-[400px]"
                    config={{
                      width: '100%',
                      height: '400',
                      isTransparent: true,
                      colorTheme: 'dark',
                      locale: 'en',
                      currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'INR', 'CNY'],
                    }}
                  />
                </CardContent>
              </Card>

              {/* Currency Ticker */}
              <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Live Currency Ticker
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TVLazyWidget
                    src={`${TVUrl}ticker-tape.js`}
                    height="120px"
                    skeletonHeight="h-[120px]"
                    config={{
                      symbols: [
                        { proName: 'FX_IDC:EURUSD', title: 'EUR/USD' },
                        { proName: 'FX_IDC:GBPUSD', title: 'GBP/USD' },
                        { proName: 'FX_IDC:USDJPY', title: 'USD/JPY' },
                        { proName: 'FX_IDC:USDCHF', title: 'USD/CHF' },
                        { proName: 'FX_IDC:AUDUSD', title: 'AUD/USD' },
                        { proName: 'FX_IDC:USDCAD', title: 'USD/CAD' },
                        { proName: 'FX_IDC:USDINR', title: 'USD/INR' },
                        { proName: 'FX_IDC:EURINR', title: 'EUR/INR' },
                      ],
                      showSymbolLogo: true,
                      colorTheme: 'dark',
                      isTransparent: true,
                      displayMode: 'adaptive',
                      locale: 'en',
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="volatility" className="space-y-8">
            {/* Volatility Analysis */}
            <Card className="bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart className="w-6 h-6 text-red-500" />
                  Market Volatility Monitor
                </CardTitle>
                <p className="text-muted-foreground">
                  Real-time volatility indicators and risk assessment
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Volatility Grid — from live data */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    const high = volatilityData?.filter(v => v.volatility > 15) || [];
                    const medium = volatilityData?.filter(v => v.volatility > 8 && v.volatility <= 15) || [];
                    const low = volatilityData?.filter(v => v.volatility <= 8) || [];
                    const avgHigh = high.length ? (high.reduce((a, v) => a + v.volatility, 0) / high.length).toFixed(1) : '--';
                    const avgMed = medium.length ? (medium.reduce((a, v) => a + v.volatility, 0) / medium.length).toFixed(1) : '--';
                    const avgLow = low.length ? (low.reduce((a, v) => a + v.volatility, 0) / low.length).toFixed(1) : '--';
                    return (
                      <>
                        <Card className="bg-red-500/5 border-red-500/20">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-500">{volatilityLoading ? '...' : `${avgHigh}%`}</div>
                            <div className="text-sm text-muted-foreground">High Risk Pairs</div>
                            <div className="text-xs text-red-400 mt-1">{high.map(v => v.pair).join(', ') || 'None'}</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-orange-500/5 border-orange-500/20">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-500">{volatilityLoading ? '...' : `${avgMed}%`}</div>
                            <div className="text-sm text-muted-foreground">Medium Risk Pairs</div>
                            <div className="text-xs text-orange-400 mt-1">{medium.map(v => v.pair).join(', ') || 'None'}</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-500/5 border-green-500/20">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-500">{volatilityLoading ? '...' : `${avgLow}%`}</div>
                            <div className="text-sm text-muted-foreground">Low Risk Pairs</div>
                            <div className="text-xs text-green-400 mt-1">{low.map(v => v.pair).join(', ') || 'None'}</div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </div>
                
                {/* Risk Factors */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Risk Factors
                    </h3>
                    <div className="space-y-3">
                      {[
                        { factor: 'NFP Release', impact: 'High', time: '13:30 GMT', pairs: 'USD pairs' },
                        { factor: 'ECB Interest Rate', impact: 'Medium', time: '12:45 GMT', pairs: 'EUR pairs' },
                        { factor: 'BOJ Intervention Risk', impact: 'High', time: 'Any time', pairs: 'JPY pairs' },
                        { factor: 'Geopolitical Tensions', impact: 'Medium', time: 'Ongoing', pairs: 'Safe havens' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
                          <div>
                            <div className="font-medium">{item.factor}</div>
                            <div className="text-sm text-muted-foreground">{item.time} • {item.pairs}</div>
                          </div>
                          <Badge 
                            variant={item.impact === 'High' ? 'destructive' : 'secondary'}
                            className={item.impact === 'High' ? 'bg-red-500/20 text-red-400' : ''}
                          >
                            {item.impact}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-500" />
                      Market Sentiment
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Overall Market Sentiment</span>
                          {(() => {
                            const avgChange = volatilityData ? volatilityData.reduce((a, v) => a + (v.changePct || 0), 0) / volatilityData.length : 0;
                            const isRiskOn = avgChange > 0;
                            return (
                              <Badge className={`${isRiskOn ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                {isRiskOn ? 'Risk-On' : 'Risk-Off'}
                              </Badge>
                            );
                          })()}
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          {(() => {
                            const positive = volatilityData ? volatilityData.filter(v => (v.changePct || 0) > 0).length : 0;
                            const total = volatilityData?.length || 1;
                            const pct = Math.round((positive / total) * 100);
                            return (
                              <>
                                <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Risk-Off</span>
                          <span>{volatilityData ? `${Math.round((volatilityData.filter(v => (v.changePct || 0) > 0).length / volatilityData.length) * 100)}%` : '--'} Risk-On</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                          <div className="text-lg font-bold text-purple-400">
                            {volatilityData ? `${volatilityData.filter(v => ['AUD/USD', 'USD/CAD'].includes(v.pair))[0]?.changePct?.toFixed(2) || '--'}%` : '...'}
                          </div>
                          <div className="text-xs text-muted-foreground">Commodity FX</div>
                        </div>
                        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
                          <div className="text-lg font-bold text-cyan-400">
                            {volatilityData ? `${volatilityData.filter(v => ['USD/JPY', 'USD/CHF'].includes(v.pair))[0]?.changePct?.toFixed(2) || '--'}%` : '...'}
                          </div>
                          <div className="text-xs text-muted-foreground">Safe Havens</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Institutional Flow Analysis */}
            <Card className="bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                  Institutional Flow Analysis
                </CardTitle>
                <p className="text-muted-foreground">
                  Smart money positioning and order flow insights
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-blue-400">Central Bank Activity</h4>
                    <div className="space-y-3">
                      {[
                        { bank: 'Federal Reserve', action: 'Dovish Pivot Expected', impact: 'USD Bearish' },
                        { bank: 'European Central Bank', action: 'Rate Hold Likely', impact: 'EUR Neutral' },
                        { bank: 'Bank of Japan', action: 'Intervention Ready', impact: 'JPY Supportive' }
                      ].map((item, index) => (
                        <div key={index} className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                          <div className="font-medium text-sm">{item.bank}</div>
                          <div className="text-xs text-muted-foreground">{item.action}</div>
                          <Badge 
                            variant="outline" 
                            className={`mt-1 text-xs ${item.impact.includes('Bearish') ? 'border-red-500/50 text-red-400' : 
                                        item.impact.includes('Supportive') ? 'border-green-500/50 text-green-400' : 
                                        'border-gray-500/50 text-gray-400'}`}
                          >
                            {item.impact}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-indigo-400">Order Flow</h4>
                    <div className="space-y-3">
                      {[
                        { pair: 'EUR/USD', flow: 'Heavy selling above 1.0850', bias: 'Bearish' },
                        { pair: 'GBP/USD', flow: 'Accumulation on dips', bias: 'Bullish' },
                        { pair: 'USD/JPY', flow: 'Option barriers at 150.00', bias: 'Range-bound' }
                      ].map((item, index) => (
                        <div key={index} className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                          <div className="font-medium text-sm">{item.pair}</div>
                          <div className="text-xs text-muted-foreground">{item.flow}</div>
                          <Badge 
                            variant="outline" 
                            className={`mt-1 text-xs ${item.bias === 'Bearish' ? 'border-red-500/50 text-red-400' : 
                                        item.bias === 'Bullish' ? 'border-green-500/50 text-green-400' : 
                                        'border-amber-500/50 text-amber-400'}`}
                          >
                            {item.bias}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-purple-400">Smart Money Indicators</h4>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">COT Positioning</span>
                          <Badge className="bg-purple-500/20 text-purple-400">Bullish USD</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Large specs increased long USD positions</div>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Options Flow</span>
                          <Badge className="bg-cyan-500/20 text-cyan-400">JPY Calls</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Unusual JPY call volume detected</div>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Cross-Asset Flow</span>
                          <Badge className="bg-emerald-500/20 text-emerald-400">Risk-On</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Equity inflows support commodity FX</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Enhanced Professional Volatility Dashboard */}
            <Card className="xl:col-span-2 bg-slate-800/50 border-slate-700/50 overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-700/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                    Volatility Monitor
                    <Badge variant="secondary" className="ml-auto bg-purple-500/20 text-purple-300">
                      {volatilityLoading ? 'Loading...' : 'Live'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {volatilityLoading ? (
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 animate-pulse">
                          <div className="w-16 h-4 bg-slate-600 rounded" />
                          <div className="w-24 h-4 bg-slate-600 rounded" />
                          <div className="w-12 h-4 bg-slate-600 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {volatilityData?.map((item, index) => {
                        const volatilityLevel = item.volatility > 15 ? 'high' : item.volatility > 10 ? 'medium' : 'low';
                        const trendColor = item.trend === 'rising' ? 'text-emerald-400' : 
                                         item.trend === 'falling' ? 'text-rose-400' : 'text-slate-400';
                        const volatilityColor = volatilityLevel === 'high' ? 'text-red-400' : 
                                               volatilityLevel === 'medium' ? 'text-yellow-400' : 'text-green-400';
                        
                        return (
                          <div key={item.pair} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200 border border-slate-600/30 hover:border-slate-600/50">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                item.trend === 'rising' ? 'bg-emerald-500' :
                                item.trend === 'falling' ? 'bg-rose-500' : 'bg-slate-500'
                              } animate-pulse`} />
                              <div>
                                <div className="font-bold text-sm">{item.pair}</div>
                                <div className="text-xs text-slate-400">
                                  Rate: {item.rate.toFixed(item.pair.includes('JPY') || item.pair.includes('INR') ? 2 : 4)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className={`text-sm font-bold ${volatilityColor}`}>
                                  {item.volatility.toFixed(1)}%
                                </div>
                                <div className={`text-xs ${trendColor} capitalize font-medium`}>
                                  {item.trend}
                                </div>
                              </div>
                              
                              {/* Volatility bar */}
                              <div className="w-16 h-2 bg-slate-600 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-1000 ${
                                    volatilityLevel === 'high' ? 'bg-red-500' :
                                    volatilityLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(item.volatility * 4, 100)}%` }}
                                />
                              </div>
                              
                              <Badge variant="outline" className={`text-xs ${
                                volatilityLevel === 'high' ? 'border-red-500/50 text-red-400' :
                                volatilityLevel === 'medium' ? 'border-yellow-500/50 text-yellow-400' :
                                'border-green-500/50 text-green-400'
                              }`}>
                                {volatilityLevel.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        );
                      }) || []}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Market Analysis */}
              <div className="space-y-4">
                {/* Trading Sessions Status */}
                <Card className="bg-gradient-to-br from-emerald-500/10 to-blue-500/5 border-emerald-500/20 overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-500" />
                      Global Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {forexSessions.map(session => {
                      const isActive = session.active;
                      const cls = getSessionClasses(session);
                      const activeBg = session.key === 'london' ? 'bg-emerald-500/10 border-emerald-500/30'
                        : session.key === 'ny' ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-cyan-500/10 border-cyan-500/30';
                      return (
                        <div key={session.name} className={`p-3 rounded-lg border transition-all ${
                          isActive ? activeBg : 'bg-slate-700/20 border-slate-600/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                isActive ? cls.dot : 'bg-slate-500'
                              }`} />
                              <div>
                                <div className={`font-semibold text-sm ${
                                  isActive ? cls.text : 'text-slate-400'
                                }`}>
                                  {session.name}
                                </div>
                                <div className="text-xs text-slate-500">{session.time}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={isActive ? 'default' : 'secondary'} className={`text-xs ${
                                isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-600/20 text-slate-400'
                              }`}>
                                {isActive ? 'ACTIVE' : 'CLOSED'}
                              </Badge>
                              <div className={`text-xs mt-1 ${isActive ? cls.text : 'text-slate-500'}`}>
                                {isActive ? 'High activity' : 'Session ended'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Professional Market Outlook */}
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      Live Pair Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {volatilityData?.map((item) => {
                      const isBullish = item.changePct > 0.05;
                      const isBearish = item.changePct < -0.05;
                      const sentimentLabel = isBullish ? 'BULLISH' : isBearish ? 'BEARISH' : 'NEUTRAL';
                      const sentimentBorder = isBullish ? 'border-emerald-500/50 text-emerald-400' 
                        : isBearish ? 'border-rose-500/50 text-rose-400' 
                        : 'border-slate-500/50 text-slate-400';
                      const confidence = Math.min(Math.round(Math.abs(item.changePct) * 40 + 40), 95);
                      
                      return (
                        <div key={item.pair} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50 transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm text-amber-300">{item.pair}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${sentimentBorder}`}>
                                {sentimentLabel}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Vol: {item.volatility.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed mb-3">
                            Rate: {item.rate.toFixed(item.pair.includes('JPY') || item.pair.includes('INR') ? 2 : 4)} &bull; 
                            Change: {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(3)}% &bull; 
                            Trend: {item.trend}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Strength</span>
                            <div className="flex items-center gap-2">
                              <Progress value={confidence} className="w-16 h-2" />
                              <span className="text-xs font-mono text-slate-300">{confidence}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}