import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useQuery } from '@tanstack/react-query';
import { fetchLiveMarketStatus, fetchLiveRates, LiveMarketStatus, LiveRates } from '@/services/liveMarketService';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch live market status and rates
  const { data: marketStatus } = useQuery({
    queryKey: ['market-status'],
    queryFn: fetchLiveMarketStatus,
    refetchInterval: false,
    staleTime: 50000,
  });

  const { data: liveRates } = useQuery({
    queryKey: ['live-rates'],
    queryFn: fetchLiveRates,
    refetchInterval: false,
    staleTime: 8000,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatChange = (value: number, isPercent: boolean = false) => {
    const prefix = value >= 0 ? '▲' : '▼';
    const color = value >= 0 ? 'text-emerald-400' : 'text-red-400';
    const formatted = isPercent ? `${Math.abs(value).toFixed(2)}%` : Math.abs(value).toFixed(4);
    return <span className={color}>{prefix}{formatted}</span>;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-emerald-400 font-mono flex flex-col">
      {/* Bloomberg Terminal Top Ticker */}
      <div className="bg-[#0a0a0a] border-b border-emerald-500/10 px-4 py-1.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
              <span className="text-emerald-400 font-bold text-[11px] tracking-wider">LIVE FEED</span>
            </div>
            <div className="text-cyan-400/80 text-[11px]">
              {currentTime.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </div>
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 text-[10px]">
                {marketStatus?.sessionStatus || 'CHECKING...'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-[11px]">
            <span className="text-amber-400/90">
              USD/INR <span className="text-white/80">{liveRates?.usdInr.rate.toFixed(2) || '—'}</span> {liveRates ? formatChange(liveRates.usdInr.changePercent, true) : <span className="text-gray-600">—</span>}
            </span>
            <span className="text-emerald-400/90">
              NIFTY <span className="text-white/80">{liveRates?.nifty.value.toFixed(0) || '—'}</span> {liveRates ? formatChange(liveRates.nifty.change) : <span className="text-gray-600">—</span>}
            </span>
            <span className="text-cyan-400/90">
              BTC <span className="text-white/80">{liveRates?.btcUsd.rate.toFixed(0) || '—'}</span> {liveRates ? formatChange(liveRates.btcUsd.changePercent, true) : <span className="text-gray-600">—</span>}
            </span>
            <span className="text-purple-400/90">
              ETH <span className="text-white/80">{liveRates?.ethUsd.rate.toFixed(0) || '—'}</span> {liveRates ? formatChange(liveRates.ethUsd.changePercent, true) : <span className="text-gray-600">—</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Scrolling Stock Ticker */}
      <div className="bg-[#050505] border-b border-emerald-500/8 py-1 overflow-hidden">
        <div className="animate-scroll flex gap-10 text-[11px]">
          <span className="text-cyan-400">RELIANCE <span className="text-white/70">2856.75</span> <span className="text-emerald-400">▲23.40</span></span>
          <span className="text-cyan-400">TCS <span className="text-white/70">3890.20</span> <span className="text-red-400">▼15.60</span></span>
          <span className="text-cyan-400">INFY <span className="text-white/70">1567.85</span> <span className="text-emerald-400">▲28.90</span></span>
          <span className="text-cyan-400">HDFC BANK <span className="text-white/70">1678.30</span> <span className="text-emerald-400">▲12.45</span></span>
          <span className="text-cyan-400">ICICI BANK <span className="text-white/70">1089.50</span> <span className="text-red-400">▼8.20</span></span>
          <span className="text-cyan-400">ITC <span className="text-white/70">456.75</span> <span className="text-emerald-400">▲5.60</span></span>
          <span className="text-cyan-400">BHARTI AIRTEL <span className="text-white/70">1245.30</span> <span className="text-emerald-400">▲18.75</span></span>
          <span className="text-cyan-400">WIPRO <span className="text-white/70">467.20</span> <span className="text-red-400">▼3.10</span></span>
        </div>
      </div>

      <div className="flex flex-1">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
          <AppHeader onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
          <main className="flex-1 overflow-auto bg-[#050505] p-2">
            <div className="grid grid-cols-12 gap-2 h-full">
              {/* Main Content Area */}
              <div className="col-span-12 lg:col-span-9 bg-[#0a0a0a] border border-emerald-500/10 rounded-lg overflow-hidden">
                <Outlet />
              </div>
              
              {/* Right Panel - Trading Widgets */}
              <div className="hidden lg:flex lg:flex-col col-span-3 gap-2">
                {/* Market Summary Widget */}
                <div className="card-terminal rounded-lg p-3 text-xs border border-amber-500/15 bg-[#0a0a0a]">
                  <div className="text-amber-400 font-bold mb-2.5 pb-1.5 border-b border-amber-500/15 flex items-center gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                    MARKET SUMMARY
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">NIFTY 50</span>
                      <span className="text-emerald-400">{liveRates?.nifty.value.toFixed(0) || '22,350'} {liveRates ? formatChange(liveRates.nifty.changePercent, true) : '▲0.83%'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">SENSEX</span>
                      <span className="text-emerald-400">73,745 ▲0.91%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">BANK NIFTY</span>
                      <span className="text-red-400">47,890 ▼0.24%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">VIX</span>
                      <span className="text-yellow-400">14.25 ▲2.15%</span>
                    </div>
                  </div>
                </div>

                {/* FX Rates Widget */}
                <div className="card-terminal rounded-lg p-3 text-xs border border-cyan-500/15 bg-[#0a0a0a]">
                  <div className="text-cyan-400 font-bold mb-2.5 pb-1.5 border-b border-cyan-500/15 flex items-center gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                    FX RATES
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">USD/INR</span>
                      <span>{liveRates?.usdInr.rate.toFixed(4) || '—'} {liveRates ? formatChange(liveRates.usdInr.changePercent, true) : <span className="text-gray-600">—</span>}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">EUR/USD</span>
                      <span>{liveRates?.eurUsd.rate.toFixed(4) || '—'} {liveRates ? formatChange(liveRates.eurUsd.changePercent, true) : <span className="text-gray-600">—</span>}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">GBP/USD</span>
                      <span>{liveRates?.gbpUsd.rate.toFixed(4) || '—'} {liveRates ? formatChange(liveRates.gbpUsd.changePercent, true) : <span className="text-gray-600">—</span>}</span>
                    </div>
                  </div>
                </div>

                {/* Crypto Widget */}
                <div className="card-terminal rounded-lg p-3 text-xs border border-purple-500/15 bg-[#0a0a0a]">
                  <div className="text-purple-400 font-bold mb-2.5 pb-1.5 border-b border-purple-500/15 flex items-center gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                    CRYPTO
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">BTC/USD</span>
                      <span>{liveRates?.btcUsd.rate.toFixed(0) || '—'} {liveRates ? formatChange(liveRates.btcUsd.changePercent, true) : <span className="text-gray-600">—</span>}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">ETH/USD</span>
                      <span>{liveRates?.ethUsd.rate.toFixed(0) || '—'} {liveRates ? formatChange(liveRates.ethUsd.changePercent, true) : <span className="text-gray-600">—</span>}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">SOL/USD</span>
                      <span className="text-emerald-400">145.67 ▲3.24%</span>
                    </div>
                  </div>
                </div>

                {/* News Widget */}
                <div className="card-terminal rounded-lg p-3 text-xs border border-red-500/15 bg-[#0a0a0a]">
                  <div className="text-red-400 font-bold mb-2.5 pb-1.5 border-b border-red-500/15 flex items-center gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]" />
                    BREAKING NEWS
                  </div>
                  <div className="space-y-2 text-gray-400">
                    <div className="text-[10px] leading-relaxed">
                      <span className="text-cyan-400/70 mr-1">15:30</span> RBI keeps repo rate unchanged at 6.50%
                    </div>
                    <div className="text-[10px] leading-relaxed">
                      <span className="text-cyan-400/70 mr-1">14:45</span> IT stocks surge on Q4 guidance
                    </div>
                    <div className="text-[10px] leading-relaxed">
                      <span className="text-cyan-400/70 mr-1">13:20</span> FII inflows ▲₹2,500 crores
                    </div>
                  </div>
                </div>

                {/* System Status */}
                <div className="card-terminal rounded-lg p-3 text-xs border border-emerald-500/15 bg-[#0a0a0a]">
                  <div className="text-emerald-400 font-bold mb-2.5 pb-1.5 border-b border-emerald-500/15 flex items-center gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                    SYSTEM STATUS
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Data Feed</span>
                      <span className="text-emerald-400 flex items-center gap-1"><span className="w-1 h-1 bg-emerald-400 rounded-full inline-block" /> LIVE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Latency</span>
                      <span className="text-emerald-400">12ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">CPU Usage</span>
                      <span className="text-yellow-400">45%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Memory</span>
                      <span className="text-amber-400">2.1GB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-[#0a0a0a] border-t border-emerald-500/10 px-4 py-1 text-[10px]">
        <div className="flex items-center justify-between text-gray-500">
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
              CONNECTED
            </span>
            <span className="text-cyan-400/60">FEED: 1,247/sec</span>
            <span className="text-yellow-400/60">CPU: 45%</span>
            <span className="text-purple-400/60">MEM: 68%</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-amber-400/70">TERMINAL v2026.03</span>
            <span className="text-cyan-400/60">USER: TRADER_01</span>
            <span className="text-emerald-400/70">SESSION: ACTIVE</span>
            <span className="text-red-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> REC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
