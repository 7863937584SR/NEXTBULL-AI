import { Activity, TrendingUp, Globe, BarChart3, Terminal, Zap, Database } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LiveMarketTicker } from '@/components/dashboard/LiveMarketTicker';
import { TVLazyWidget } from '@/components/dashboard/TVLazyWidget';
import { LiveIndexCard } from '@/components/dashboard/LiveIndexCard';
import GlobalMarketsWidget from '@/components/dashboard/GlobalMarketsWidget';
import DeltaPromptTrade from '@/components/trading/DeltaPromptTrade';
import { useState, useEffect, useMemo } from 'react';
import { NextBullLogo } from '@/components/NextBullLogo';

const TVUrl = '/tv-widget/external-embedding/embed-widget-';

export default function Markets() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
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
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.4)]"></div>
                  <span className="text-emerald-400 font-bold text-[10px]">LIVE FEED</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-400/60 text-[10px]">
                  <Database className="w-3 h-3" />
                  <span>RT DATA</span>
                </div>
                <div className="flex items-center gap-1 text-purple-400/60 text-[10px]">
                  <Zap className="w-3 h-3" />
                  <span>15ms</span>
                </div>
              </div>
            </div>
            
            <div className="text-right font-mono">
              <div className="text-cyan-400 text-base font-bold tracking-wider drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-emerald-400/60 text-xs">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'short', month: 'short', day: '2-digit' 
                })}
              </div>
            </div>
          </div>

          {/* Market Status Indicators */}
          <div className="grid grid-cols-5 gap-2 text-xs font-mono">
            {[
              { label: 'NSE', status: 'OPEN', color: 'emerald' },
              { label: 'BSE', status: 'ACTIVE', color: 'cyan' },
              { label: 'NYSE', status: 'PRE-MKT', color: 'purple' },
              { label: 'LSE', status: 'OPEN', color: 'amber' },
              { label: 'CRYPTO', status: '24/7', color: 'cyan' },
            ].map((m) => (
              <div key={m.label} className={`rounded-lg p-2 text-center bg-[#0d0d0d] border border-${m.color}-500/15`}>
                <div className="text-gray-500 text-[10px] mb-0.5">{m.label}</div>
                <div className={`text-${m.color}-400 font-bold text-[11px]`}>{m.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Market Ticker */}
      <div className="bg-[#050505] border-b border-emerald-500/8">
        <LiveMarketTicker />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto bg-[#050505]">
        
        {/* Command Line Interface */}
        <div className="card-terminal border border-emerald-500/10 rounded-lg p-4 font-mono text-sm bg-[#0a0a0a]">
          <div className="text-emerald-400/80 mb-2">
            <span className="text-amber-400/80">user@nextbull:~$</span> markets --live --feed=real-time
          </div>
          <div className="text-gray-600 text-xs">
            ➤ Initializing market data streams...<br/>
            ➤ Connected to NSE, BSE, NYSE, NASDAQ<br/>
            ➤ Real-time feed active - 15ms latency<br/>
            ➤ <span className="text-emerald-400/60">Ready for trading operations</span>
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
