import { Activity, TrendingUp, Globe, BarChart3, Terminal, Zap, Database, Clock, Wifi, WifiOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LiveMarketTicker } from '@/components/dashboard/LiveMarketTicker';
import { TVLazyWidget } from '@/components/dashboard/TVLazyWidget';
import { LiveIndexCard } from '@/components/dashboard/LiveIndexCard';
import GlobalMarketsWidget from '@/components/dashboard/GlobalMarketsWidget';
import DeltaPromptTrade from '@/components/trading/DeltaPromptTrade';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { NextBullLogo } from '@/components/NextBullLogo';
import { getAllMarketStatuses, type MarketStatusInfo } from '@/services/marketStatusService';
import { useQuery } from '@tanstack/react-query';
import { fetchLiveRates } from '@/services/liveMarketService';
import { TerminalClock } from '@/components/ui/TerminalClock';

const TVUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

/** Status badge color mapping (Tailwind classes don't work with dynamic template literals) */
const STATUS_STYLES: Record<string, { border: string; text: string; dot: string }> = {
  emerald: {
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]',
  },
  red: {
    border: 'border-red-500/20',
    text: 'text-red-400',
    dot: 'bg-red-400/50',
  },
  amber: {
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
  },
  purple: {
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    dot: 'bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]',
  },
  cyan: {
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    dot: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]',
  },
};

export default function Markets() {
  const [marketStatuses, setMarketStatuses] = useState<MarketStatusInfo[]>(() => getAllMarketStatuses());
  const [latency, setLatency] = useState<number | null>(null);

  // Shared query key with AppLayout to avoid duplicate API calls
  const { data: liveRates, dataUpdatedAt, isFetching } = useQuery({
    queryKey: ['live-rates'],
    queryFn: async () => {
      const start = performance.now();
      const result = await fetchLiveRates();
      setLatency(Math.round(performance.now() - start));
      return result;
    },
    refetchInterval: 30000,
    retry: 2,
  });

  // Update market status every 30 seconds (not every second — it only changes at market open/close)
  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatuses(getAllMarketStatuses(new Date()));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const btcChartConfig = useMemo(() => ({
    autosize: true,
    symbol: "BINANCE:BTCUSDT",
    interval: "D",
    timezone: "Asia/Kolkata",
    theme: "dark",
    style: "1",
    locale: "en",
    toolbar_bg: "#000000",
    enable_publishing: false,
    backgroundColor: "#000000",
    gridColor: "#1a4f3f",
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    container_id: "tradingview_chart"
  }), []);

  // Count how many markets are currently trading
  const activeCount = marketStatuses.filter(m => m.isTrading).length;
  const feedStatus = liveRates ? 'LIVE' : isFetching ? 'CONNECTING' : 'OFFLINE';

  return (
    <div className="flex-1 overflow-auto bg-[#050505] custom-scrollbar">
      {/* Terminal Header */}
      <div className="sticky top-0 z-50 w-full bg-[#0a0a0a] border-b border-emerald-500/10 p-4">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <NextBullLogo size="sm" glow animated showText={false} />
              <div>
                <h1 className="text-xl font-bold text-emerald-400 font-mono tracking-wider drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">GLOBAL MARKETS TERMINAL</h1>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                {/* Live feed status — reflects actual data */}
                <div className={`flex items-center gap-1.5 px-2 py-1 border rounded-full ${
                  feedStatus === 'LIVE'
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : feedStatus === 'CONNECTING'
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    feedStatus === 'LIVE'
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)] animate-pulse'
                      : feedStatus === 'CONNECTING'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-red-400'
                  }`} />
                  <span className={`font-bold text-[10px] ${
                    feedStatus === 'LIVE' ? 'text-emerald-400' : feedStatus === 'CONNECTING' ? 'text-amber-400' : 'text-red-400'
                  }`}>{feedStatus === 'LIVE' ? 'LIVE FEED' : feedStatus === 'CONNECTING' ? 'CONNECTING...' : 'OFFLINE'}</span>
                </div>
                {/* Active markets count */}
                <div className="flex items-center gap-1 text-cyan-400/60 text-[10px]">
                  {liveRates ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{activeCount}/5 ACTIVE</span>
                </div>
                {/* Real latency measurement */}
                {latency !== null && (
                  <div className={`flex items-center gap-1 text-[10px] ${
                    latency < 500 ? 'text-emerald-400/60' : latency < 2000 ? 'text-amber-400/60' : 'text-red-400/60'
                  }`}>
                    <Zap className="w-3 h-3" />
                    <span>{latency}ms</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right font-mono">
              <TerminalClock
                className="text-cyan-400 text-base font-bold tracking-wider drop-shadow-[0_0_6px_rgba(34,211,238,0.3)] block"
                showDate
                dateClassName="text-emerald-400/60 text-xs block"
                dateOptions={{ weekday: 'short', month: 'short', day: '2-digit' }}
              />
            </div>
          </div>

          {/* Market Status Indicators — Real-time calculated */}
          <div className="grid grid-cols-5 gap-2 text-xs font-mono">
            {marketStatuses.map((m) => {
              const styles = STATUS_STYLES[m.color] || STATUS_STYLES.red;
              return (
                <div key={m.label} className={`rounded-lg p-2 text-center bg-[#0d0d0d] border ${styles.border} transition-all`}>
                  <div className="text-gray-500 text-[10px] mb-0.5">{m.label}</div>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${styles.dot} ${m.isTrading ? 'animate-pulse' : ''}`} />
                    <span className={`${styles.text} font-bold text-[11px]`}>{m.status}</span>
                  </div>
                  <div className="text-gray-600 text-[9px] mt-0.5 truncate" title={m.nextEvent}>{m.nextEvent}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Market Ticker */}
      <div className="bg-[#050505] border-b border-emerald-500/8">
        <LiveMarketTicker />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto bg-[#050505]">
        
        {/* Live Terminal Status — real data */}
        <div className="card-terminal border border-emerald-500/10 rounded-lg p-4 font-mono text-sm bg-[#0a0a0a]">
          <div className="text-emerald-400/80 mb-2">
            <span className="text-amber-400/80">user@nextbull:~$</span> markets --live --feed=real-time
          </div>
          <div className="text-gray-600 text-xs space-y-0.5">
            <div>➤ {feedStatus === 'LIVE' ? (
              <span className="text-emerald-400/60">Data feed connected — last update {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour12: false }) : '...'}</span>
            ) : (
              <span className="text-amber-400/60">Connecting to market data feeds...</span>
            )}</div>
            <div>➤ Markets active: {marketStatuses.filter(m => m.isTrading).map(m => m.label).join(', ') || 'None (all closed)'}</div>
            <div>➤ Markets closed: {marketStatuses.filter(m => !m.isTrading).map(m => m.label).join(', ') || 'None (all open)'}</div>
            {latency !== null && <div>➤ API latency: <span className={latency < 500 ? 'text-emerald-400/60' : 'text-amber-400/60'}>{latency}ms</span></div>}
            {liveRates && <div>➤ NIFTY: {liveRates.nifty.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })} | SENSEX: {liveRates.sensex.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })} | BTC: ${liveRates.btcUsd.rate.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>}
            <div>➤ <span className="text-emerald-400/60">Ready for trading operations</span></div>
          </div>
        </div>

        {/* Market Overview Grid */}
        <section>
          <div className="flex items-center gap-3 mb-5 pb-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-emerald-400 font-mono tracking-wider">INDEX OVERVIEW</h2>
            <span className="text-[10px] text-gray-600 font-mono">LIVE QUOTES</span>
            <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent ml-3" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="card-terminal border border-emerald-500/15 rounded-lg p-4 bg-[#0a0a0a] hover:border-emerald-500/30 transition-colors">
              <LiveIndexCard indexName="NIFTY 50" />
            </div>
            <div className="card-terminal border border-cyan-500/15 rounded-lg p-4 bg-[#0a0a0a] hover:border-cyan-500/30 transition-colors">
              <LiveIndexCard indexName="NIFTY BANK" />
            </div>
            <div className="card-terminal border border-purple-500/15 rounded-lg p-4 bg-[#0a0a0a] hover:border-purple-500/30 transition-colors">
              <LiveIndexCard indexName="NIFTY IT" />
            </div>
            <div className="card-terminal border border-amber-500/15 rounded-lg p-4 bg-[#0a0a0a] hover:border-amber-500/30 transition-colors">
              <LiveIndexCard indexName="NIFTY FIN SERVICE" />
            </div>
            <div className="card-terminal border border-rose-500/15 rounded-lg p-4 bg-[#0a0a0a] hover:border-rose-500/30 transition-colors col-span-2 md:col-span-1">
              <LiveIndexCard indexName="NIFTY AUTO" />
            </div>
          </div>
        </section>

        {/* Global Markets Terminal */}
        <section>
          <div className="flex items-center gap-3 mb-5 pb-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-cyan-400 font-mono tracking-wider">GLOBAL MARKETS CONSOLE</h2>
            <span className="text-[10px] text-gray-600 font-mono">REAL-TIME DATA</span>
            <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent ml-3" />
          </div>
          <div className="card-terminal border border-cyan-500/15 rounded-lg bg-[#0a0a0a]">
            <GlobalMarketsWidget />
          </div>
          <div className="mt-3 card-terminal border border-amber-500/15 rounded-lg bg-[#0a0a0a]">
            <DeltaPromptTrade />
          </div>
        </section>

        {/* Trading Charts Terminal */}
        <section>
          <div className="flex items-center gap-3 mb-5 pb-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-purple-400 font-mono tracking-wider">TRADING CHARTS</h2>
            <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.4)]" />
              <span className="text-[10px] font-bold text-amber-400 font-mono">BTC/USDT</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent ml-3" />
          </div>
          <div className="card-terminal border border-purple-500/15 rounded-lg overflow-hidden bg-[#0a0a0a]">
            <TVLazyWidget 
              src={`${TVUrl}advanced-chart.js`}
              config={btcChartConfig} 
              height="500px"
            />
          </div>
        </section>

      </div>
    </div>
  );
}
