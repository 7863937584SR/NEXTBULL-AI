import { Activity, Clock, TrendingUp, Globe, BarChart3, PieChart, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TopMovers } from '@/components/dashboard/TopMovers';
import { CryptoTopMovers } from '@/components/dashboard/CryptoTopMovers';
import { ForexRatesCard } from '@/components/dashboard/ForexRatesCard';
import { LiveMarketTicker } from '@/components/dashboard/LiveMarketTicker';
import { TVLazyWidget } from '@/components/dashboard/TVLazyWidget';
import { LiveIndexCard } from '@/components/dashboard/LiveIndexCard';

const TVUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';


export default function Markets() {

  const miniChartConfig = (symbol: string) => ({
    symbol,
    width: "100%",
    height: "100%",
    locale: "in",
    dateRange: "1D",
    colorTheme: "dark",
    isTransparent: true,
    autosize: true,
    largeChartUrl: ""
  });

  return (
    <div className="flex-1 overflow-auto bg-[#0d0f14] custom-scrollbar">
      {/* Sticky Ticker */}
      <div className="sticky top-0 z-50 w-full border-b border-white/5">
        <LiveMarketTicker />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-10 max-w-[1600px] mx-auto">
        
        {/* ═══════════════ HERO HEADER ═══════════════ */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#131620] via-[#1a1d2a] to-[#131620] border border-white/5 p-6 sm:p-8">
          {/* Background glow effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Global Markets
                </h1>
              </div>
              <p className="text-sm text-slate-400 flex items-center gap-2 ml-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-xs border border-emerald-500/20">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
                <span className="text-slate-600">·</span>
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">NIFTY 50</span>
                <span className="text-sm font-bold text-emerald-400">+0.85%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ INDEX CARDS ═══════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Indian Indices</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <LiveIndexCard indexName="NIFTY 50" refreshInterval={5000} />
            <LiveIndexCard indexName="NIFTY BANK" refreshInterval={5000} />
            <LiveIndexCard indexName="NIFTY IT" refreshInterval={5000} />
            <LiveIndexCard indexName="NIFTY FIN SERVICE" refreshInterval={5000} />
          </div>
        </section>

        {/* ═══════════════ MARKET PLACE (WATCHLIST) ═══════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Market Place</h2>
            <span className="text-xs text-slate-500 font-medium ml-2">Top Movers</span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TopMovers />
            <CryptoTopMovers />
            <ForexRatesCard />
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white tracking-tight">Market Heatmaps</h3>
              <span className="text-xs text-slate-500 font-medium ml-2">India · Crypto · Forex</span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Indian Market (NIFTY / SENSEX) */}
              <Card className="bg-[#131620] border border-white/5 overflow-hidden h-[320px] shadow-xl shadow-black/30 relative group rounded-xl hover:border-teal-500/30 transition-all duration-300">
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-xs font-bold text-white/90 bg-teal-500/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-teal-500/30">India</span>
                </div>
                <TVLazyWidget
                  src={`${TVUrl}stock-heatmap.js`}
                  height="100%"
                  skeletonHeight="h-[320px]"
                  config={{
                    exchanges: [], dataSource: "SENSEX", grouping: "sector", blockSize: "market_cap_basic",
                    blockColor: "change", locale: "en", symbolUrl: "", colorTheme: "dark", hasTopBar: false,
                    isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false,
                    width: "100%", height: "100%"
                  }}
                />
              </Card>

              {/* Crypto Heatmap */}
              <Card className="bg-[#131620] border border-white/5 overflow-hidden h-[320px] shadow-xl shadow-black/30 relative group rounded-xl hover:border-amber-500/30 transition-all duration-300">
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-xs font-bold text-white/90 bg-amber-500/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30">Crypto</span>
                </div>
                <TVLazyWidget
                  src={`${TVUrl}crypto-coins-heatmap.js`}
                  height="100%"
                  skeletonHeight="h-[320px]"
                  config={{
                    dataSource: "Crypto", blockSize: "market_cap_calc", blockColor: "change",
                    locale: "en", symbolUrl: "", colorTheme: "dark", hasTopBar: false,
                    isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false,
                    width: "100%", height: "100%"
                  }}
                />
              </Card>

              {/* Forex Heatmap */}
              <Card className="bg-[#131620] border border-white/5 overflow-hidden h-[320px] shadow-xl shadow-black/30 relative group rounded-xl hover:border-purple-500/30 transition-all duration-300">
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-xs font-bold text-white/90 bg-purple-500/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-purple-500/30">Forex</span>
                </div>
                <TVLazyWidget
                  src={`${TVUrl}forex-heat-map.js`}
                  height="100%"
                  skeletonHeight="h-[320px]"
                  config={{
                    width: "100%", height: "100%", currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD", "CNY", "INR"],
                    isTransparent: true, colorTheme: "dark", locale: "en"
                  }}
                />
              </Card>
            </div>
          </div>
        </section>

        {/* ═══════════════ CHART SECTION ═══════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Market Overview</h2>
            <div className="flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-lg bg-[#1a1d2a] border border-white/5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-slate-300">BTC/USDT</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
          </div>
          <Card className="bg-[#131620] border border-white/5 overflow-hidden h-[500px] shadow-2xl shadow-black/50 relative rounded-xl">
            <TVLazyWidget
              src={`${TVUrl}advanced-chart.js`}
              height="100%"
              skeletonHeight="h-[500px]"
              config={{
                autosize: true,
                symbol: "BINANCE:BTCUSDT",
                interval: "30",
                timezone: "Asia/Kolkata",
                theme: "dark",
                style: "1",
                locale: "in",
                enable_publishing: false,
                backgroundColor: "rgba(19, 22, 32, 1)",
                gridColor: "rgba(255, 255, 255, 0.05)",
                hide_top_toolbar: false,
                hide_legend: false,
                save_image: false,
                container_id: "tradingview_advanced_chart_btc"
              }}
            />
          </Card>
        </section>

        {/* ═══════════════ MARKET SUMMARY ═══════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Market News & Events</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
          </div>
          <Card className="bg-[#131620] border border-white/5 overflow-hidden h-[600px] shadow-2xl shadow-black/50 relative rounded-xl">
            <TVLazyWidget
              src={`${TVUrl}timeline.js`}
              height="100%"
              skeletonHeight="h-[600px]"
              config={{
                feedMode: "market",
                market: "stock",
                isTransparent: true,
                displayMode: "regular",
                width: "100%",
                height: "100%",
                colorTheme: "dark",
                locale: "in"
              }}
            />
          </Card>
        </section>

      </div>
    </div>
  );
}
