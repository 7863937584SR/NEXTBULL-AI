import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useQuery } from '@tanstack/react-query';
import { fetchLiveMarketStatus, fetchLiveRates, fetchTickerStocks, LiveMarketStatus, LiveRates, StockTickerItem } from '@/services/liveMarketService';
import { TerminalClock } from '@/components/ui/TerminalClock';

interface NewsItem {
  title: string;
  time: string;
}

const fetchSidebarNews = async (): Promise<NewsItem[]> => {
  try {
    // Use Google News RSS via a public CORS proxy (rss2json)
    const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Dindian%2Bstock%2Bmarket%26hl%3Den-IN%26gl%3DIN%26ceid%3DIN%3Aen');
    if (!res.ok) throw new Error('RSS fetch failed');
    const data = await res.json();
    return (data.items || []).slice(0, 4).map((item: any) => ({
      title: (item.title || '').slice(0, 80),
      time: new Date(item.pubDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }));
  } catch {
    return [
      { title: 'Markets data loading...', time: '--:--' },
    ];
  }
};

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch live market status and rates
  const { data: marketStatus } = useQuery({
    queryKey: ['market-status'],
    queryFn: fetchLiveMarketStatus,
    refetchInterval: 60000,
    staleTime: 50000,
  });

  const { data: liveRates } = useQuery({
    queryKey: ['live-rates'],
    queryFn: fetchLiveRates,
    refetchInterval: 30000,
    staleTime: 8000,
  });

  const { data: tickerStocks } = useQuery({
    queryKey: ['ticker-stocks'],
    queryFn: fetchTickerStocks,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const { data: sidebarNews } = useQuery({
    queryKey: ['sidebar-news'],
    queryFn: fetchSidebarNews,
    refetchInterval: 120000,
    staleTime: 60000,
  });

  const formatChange = useCallback((value: number, isPercent: boolean = false) => {
    const prefix = value >= 0 ? '▲' : '▼';
    const color = value >= 0 ? 'text-emerald-400' : 'text-red-400';
    const formatted = isPercent ? `${Math.abs(value).toFixed(2)}%` : Math.abs(value).toFixed(4);
    return <span className={color}>{prefix}{formatted}</span>;
  }, []);

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
            <TerminalClock
              format="full"
              className="text-cyan-400/80 text-[11px]"
            />
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
              NIFTY <span className="text-white/80">{liveRates?.nifty.value.toFixed(0) || '—'}</span> {liveRates ? formatChange(liveRates.nifty.changePercent, true) : <span className="text-gray-600">—</span>}
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
          {tickerStocks && tickerStocks.length > 0 ? (
            tickerStocks.map((s) => (
              <span key={s.symbol} className="text-cyan-400 whitespace-nowrap">
                {s.symbol}{' '}
                <span className="text-white/70">{s.price.toFixed(2)}</span>{' '}
                <span className={s.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {s.change >= 0 ? '▲' : '▼'}{Math.abs(s.change).toFixed(2)}
                </span>
              </span>
            ))
          ) : (
            <>
              <span className="text-gray-500 animate-pulse">Loading live stock prices...</span>
            </>
          )}
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
                      <span>{liveRates?.sensex.value.toFixed(0) || '—'} {liveRates ? formatChange(liveRates.sensex.changePercent, true) : <span className="text-gray-600">—</span>}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">BANK NIFTY</span>
                      <span>{liveRates?.bankNifty.value.toFixed(0) || '—'} {liveRates ? formatChange(liveRates.bankNifty.changePercent, true) : <span className="text-gray-600">—</span>}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">VIX</span>
                      <span>{liveRates?.vix.value.toFixed(2) || '—'} {liveRates ? formatChange(liveRates.vix.changePercent, true) : <span className="text-gray-600">—</span>}</span>
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
                      <span>{liveRates?.solUsd.rate.toFixed(2) || '—'} {liveRates ? formatChange(liveRates.solUsd.changePercent, true) : <span className="text-gray-600">—</span>}</span>
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
                    {sidebarNews && sidebarNews.length > 0 ? (
                      sidebarNews.map((item, i) => (
                        <div key={i} className="text-[10px] leading-relaxed">
                          <span className="text-cyan-400/70 mr-1">{item.time}</span> {item.title}
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] leading-relaxed text-gray-500 animate-pulse">Loading news...</div>
                    )}
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
