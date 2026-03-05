import { useState, useEffect } from 'react';
import { Activity, Globe, TrendingUp, Calculator, BarChart3, Zap, Calendar, Clock, Signal, AlertTriangle, CheckCircle, Bell, Building, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import EnhancedCurrencyDashboard from '@/components/dashboard/EnhancedCurrencyDashboard';
import CurrencyConverter from '@/components/dashboard/CurrencyConverter';
import { TVLazyWidget } from '@/components/dashboard/TVLazyWidget';
import { useQuery } from '@tanstack/react-query';
import { fetchForexRates } from '@/services/forexService';
import { NextBullLogo } from '@/components/NextBullLogo';

const TVUrl = '/tv-widget/external-embedding/embed-widget-';

// Real-time market data fetcher
const fetchMarketStatus = async () => {
  const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  if (!response.ok) throw new Error('Failed to fetch market status');
  const data = await response.json();
  return {
    isMarketOpen: true,
    lastUpdated: new Date(data.date),
    totalPairs: Object.keys(data.rates).length,
    baseCurrency: data.base
  };
};

// Fetch real-time volatility data
const fetchVolatilityData = async () => {
  // Mock real-time volatility data that would come from a financial API
  return [
    { pair: 'EUR/USD', volatility: 12.5, volume: 1.2e9, trend: 'stable' },
    { pair: 'GBP/USD', volatility: 18.3, volume: 8.5e8, trend: 'volatile' },
    { pair: 'USD/JPY', volatility: 14.7, volume: 1.1e9, trend: 'rising' },
    { pair: 'USD/CHF', volatility: 11.2, volume: 6.2e8, trend: 'stable' },
    { pair: 'AUD/USD', volatility: 16.8, volume: 7.1e8, trend: 'falling' },
    { pair: 'USD/CAD', volatility: 13.4, volume: 5.9e8, trend: 'stable' },
  ];
};

export default function CurrencyPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [marketTime, setMarketTime] = useState(new Date());

  // Real-time market status
  const { data: marketStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['market-status'],
    queryFn: fetchMarketStatus,
    refetchInterval: 60000,
  });

  // Real-time volatility data
  const { data: volatilityData, isLoading: volatilityLoading } = useQuery({
    queryKey: ['volatility-data'],
    queryFn: fetchVolatilityData,
    refetchInterval: 30000,
  });

  // Update market time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setMarketTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-emerald-400 font-mono">
      <div className="container mx-auto px-4 py-6 space-y-6">
        
        {/* Terminal-style Trading Header */}
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
                <p className="text-cyan-400/60 text-sm mt-1 tracking-wider">PROFESSIONAL CURRENCY MARKETS • LIVE FEED</p>
              </div>
              <div className="ml-auto hidden md:flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                  <span className="text-emerald-400 text-xs font-bold">LIVE</span>
                </div>
                <span className="text-cyan-400/50 text-xs">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {marketTime.toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>
            </div>
            
            {/* Real-time Market Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="card-terminal rounded-lg p-3 text-center border border-emerald-500/15 bg-[#0d0d0d]">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                  <span className="text-[10px] font-semibold text-emerald-400/80">MARKET STATUS</span>
                </div>
                <div className="text-lg font-bold text-emerald-400">
                  {statusLoading ? 'SYNC...' : marketStatus?.isMarketOpen ? 'LIVE' : 'CLOSED'}
                </div>
                <div className="text-[10px] text-gray-500 flex items-center justify-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {marketTime.toLocaleTimeString('en-US', { hour12: false })}
                </div>
              </div>
              
              <div className="card-terminal rounded-lg p-3 text-center border border-cyan-500/15 bg-[#0d0d0d]">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <BarChart3 className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-semibold text-cyan-400/80">ACTIVE PAIRS</span>
                </div>
                <div className="text-lg font-bold text-cyan-400">
                  {statusLoading ? '...' : marketStatus?.totalPairs || 168}
                </div>
                <div className="text-[10px] text-gray-500">Currency Pairs</div>
              </div>
              
              <div className="card-terminal rounded-lg p-3 text-center border border-purple-500/15 bg-[#0d0d0d]">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <Activity className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] font-semibold text-purple-400/80">VOLATILITY</span>
                </div>
                <div className="text-lg font-bold text-purple-400">14.2%</div>
                <div className="text-[10px] text-gray-500">Daily Average</div>
              </div>
              
              <div className="card-terminal rounded-lg p-3 text-center border border-amber-500/15 bg-[#0d0d0d]">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-semibold text-amber-400/80">SPREAD</span>
                </div>
                <div className="text-lg font-bold text-amber-400">0.8</div>
                <div className="text-[10px] text-gray-500">Avg Pips</div>
              </div>
            </div>
              
            {/* Trading Sessions Bar */}
            <div className="rounded-lg p-3 border border-emerald-500/10 bg-[#0d0d0d]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-semibold text-gray-500 tracking-wider">SESSIONS:</span>
                  {[
                    { name: 'Sydney', active: false, time: '22:00-07:00', color: 'gray' },
                    { name: 'Tokyo', active: true, time: '00:00-09:00', color: 'cyan' },
                    { name: 'London', active: true, time: '08:00-17:00', color: 'emerald' },
                    { name: 'New York', active: false, time: '13:00-22:00', color: 'purple' }
                  ].map(session => (
                    <div key={session.name} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        session.active 
                          ? `bg-${session.color}-400 shadow-[0_0_4px_rgba(16,185,129,0.3)]` 
                          : 'bg-gray-600'
                      }`} />
                      <span className={`text-[10px] font-medium ${
                        session.active ? `text-${session.color}-400` : 'text-gray-600'
                      }`}>
                        {session.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-gray-500">
                  VOL: $7.5T • SPREAD: 0.8-2.1 • LIQ: HIGH
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
                          <div className="text-xl font-bold text-emerald-400 font-mono">$7.5T</div>
                          <div className="text-xs text-slate-400">Daily FX Volume</div>
                          <div className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1">
                            <CheckCircle className="w-2 h-2" />
                            Live
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent" />
                        <div className="relative">
                          <div className="text-xl font-bold text-blue-400 font-mono">{statusLoading ? '...' : marketStatus?.totalPairs || 170}</div>
                          <div className="text-xs text-slate-400">Active Pairs</div>
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
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 text-xs">
                          {volatilityLoading ? 'Loading...' : 'Moderate'}
                        </Badge>
                      </div>
                      <Progress value={68} className="h-2 bg-slate-700" />
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
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { pair: 'EUR/USD', rate: 1.0847, change: '+0.0012', changePercent: '+0.11%', volume: '€1.2B', trend: 'up', session: 'London' },
                        { pair: 'GBP/USD', rate: 1.2654, change: '-0.0018', changePercent: '-0.14%', volume: '£890M', trend: 'down', session: 'London' },
                        { pair: 'USD/JPY', rate: 149.85, change: '+0.24', changePercent: '+0.16%', volume: '¥1.1B', trend: 'up', session: 'Tokyo' },
                        { pair: 'USD/CHF', rate: 0.8892, change: '+0.0008', changePercent: '+0.09%', volume: 'CHF520M', trend: 'up', session: 'Zurich' },
                        { pair: 'AUD/USD', rate: 0.6612, change: '-0.0024', changePercent: '-0.36%', volume: 'A$670M', trend: 'down', session: 'Sydney' },
                        { pair: 'USD/CAD', rate: 1.3521, change: '+0.0015', changePercent: '+0.11%', volume: 'C$580M', trend: 'up', session: 'Toronto' },
                      ].map(item => {
                        const isPositive = item.trend === 'up';
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
                                    <span>{item.session}</span>
                                    <span>•</span>
                                    <span>{item.volume}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-sm font-bold">{item.rate}</div>
                                <div className={`text-xs font-semibold ${
                                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                  <span>{item.change}</span>
                                  <span className="ml-1">({item.changePercent})</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Mini price movement indicator */}
                            <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${
                                isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                              }`} style={{ width: `${Math.abs(parseFloat(item.changePercent.replace('%', '').replace('+', ''))) * 20 + 20}%` }} />
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
                {/* Volatility Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-red-500/5 border-red-500/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-500">18.4%</div>
                      <div className="text-sm text-muted-foreground">High Risk Pairs</div>
                      <div className="text-xs text-red-400 mt-1">EUR/TRY, GBP/JPY</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-500/5 border-orange-500/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-500">12.7%</div>
                      <div className="text-sm text-muted-foreground">Medium Risk Pairs</div>
                      <div className="text-xs text-orange-400 mt-1">AUD/USD, CAD/JPY</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-500">7.2%</div>
                      <div className="text-sm text-muted-foreground">Low Risk Pairs</div>
                      <div className="text-xs text-green-400 mt-1">EUR/USD, USD/CHF</div>
                    </CardContent>
                  </Card>
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
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Risk-On</Badge>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{ width: '68%' }} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Risk-Off</span>
                          <span>68% Risk-On</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                          <div className="text-lg font-bold text-purple-400">+2.4%</div>
                          <div className="text-xs text-muted-foreground">Commodity FX</div>
                        </div>
                        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
                          <div className="text-lg font-bold text-cyan-400">-1.1%</div>
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
                                  Vol: {(item.volume / 1e9).toFixed(1)}B
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
                    {[
                      { session: 'Sydney', status: 'closed', time: '22:00 - 07:00 GMT', activity: 'low', color: 'slate' },
                      { session: 'Tokyo', status: 'active', time: '00:00 - 09:00 GMT', activity: 'high', color: 'emerald' },
                      { session: 'London', status: 'opening', time: '08:00 - 17:00 GMT', activity: 'very-high', color: 'blue' },
                      { session: 'New York', status: 'closed', time: '13:00 - 22:00 GMT', activity: 'high', color: 'slate' },
                    ].map(session => {
                      const isActive = session.status === 'active' || session.status === 'opening';
                      return (
                        <div key={session.session} className={`p-3 rounded-lg border transition-all ${
                          isActive 
                            ? `bg-${session.color}-500/10 border-${session.color}-500/30` 
                            : 'bg-slate-700/20 border-slate-600/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                isActive 
                                  ? `bg-${session.color}-500` 
                                  : 'bg-slate-500'
                              }`} />
                              <div>
                                <div className={`font-semibold text-sm ${
                                  isActive ? `text-${session.color}-300` : 'text-slate-400'
                                }`}>
                                  {session.session}
                                </div>
                                <div className="text-xs text-slate-500">{session.time}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={isActive ? 'default' : 'secondary'} className={`text-xs ${
                                isActive 
                                  ? `bg-${session.color}-500/20 text-${session.color}-300 border-${session.color}-500/30`
                                  : 'bg-slate-600/20 text-slate-400'
                              }`}>
                                {session.status.toUpperCase()}
                              </Badge>
                              <div className={`text-xs mt-1 capitalize ${
                                isActive ? `text-${session.color}-400` : 'text-slate-500'
                              }`}>
                                {session.activity.replace('-', ' ')} activity
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
                      Institutional Outlook
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        title: 'USD Strength Index',
                        analysis: 'Federal Reserve hawkish stance continues to support USD. Watch for FOMC minutes and NFP data.',
                        sentiment: 'bullish',
                        confidence: 78,
                        timeframe: 'Short-term'
                      },
                      {
                        title: 'EUR Outlook',
                        analysis: 'ECB policy divergence creates headwinds. German manufacturing PMI and inflation data key.',
                        sentiment: 'bearish',
                        confidence: 65,
                        timeframe: 'Medium-term'
                      },
                      {
                        title: 'GBP Volatility',
                        analysis: 'Brexit trade tensions and BoE policy uncertainty drive higher volatility expectations.',
                        sentiment: 'neutral',
                        confidence: 52,
                        timeframe: 'Short-term'
                      },
                      {
                        title: 'JPY Safe Haven',
                        analysis: 'Risk-off sentiment supports yen strength. BoJ intervention levels around 150 remain critical.',
                        sentiment: 'bullish',
                        confidence: 71,
                        timeframe: 'Long-term'
                      }
                    ].map((item, index) => {
                      const sentimentColor = item.sentiment === 'bullish' ? 'emerald' : 
                                            item.sentiment === 'bearish' ? 'rose' : 'slate';
                      
                      return (
                        <div key={index} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50 transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm text-amber-300">{item.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs border-${sentimentColor}-500/50 text-${sentimentColor}-400`}>
                                {item.sentiment.toUpperCase()}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {item.timeframe}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed mb-3">{item.analysis}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Confidence Level</span>
                            <div className="flex items-center gap-2">
                              <Progress value={item.confidence} className="w-16 h-2" />
                              <span className="text-xs font-mono text-slate-300">{item.confidence}%</span>
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