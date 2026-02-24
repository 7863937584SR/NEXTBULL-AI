import { Activity, Clock, ExternalLink, RefreshCw, MessageSquare, ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface NewsItem {
  title: string;
  description?: string;
  source: string;
  url: string;
  publishedAt: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 0 || isNaN(seconds)) return 'just now';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}


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
    <div className="flex-1 overflow-auto bg-background/95 custom-scrollbar">
      <div className="sticky top-0 z-10 w-full border-b border-border/40">
        <LiveMarketTicker />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">

        {/* ═══════════════ HEADER ═══════════════ */}
        <div className="flex flex-col flex-wrap sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
              <Activity className="w-7 h-7 text-emerald-500" />
              Markets Overview
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium text-xs border border-emerald-500/20">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Data (10s)
              </span>
              <span className="text-border">·</span>
              <Clock className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* ═══════════════ TOP ROW: INDEX SPARKLINES ═══════════════ */}
        <div>
          <h2 className="text-lg font-semibold text-foreground/90 mb-4 tracking-tight">Index Movement</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <LiveIndexCard indexName="NIFTY 50" refreshInterval={5000} />
            <LiveIndexCard indexName="NIFTY BANK" refreshInterval={5000} />
            <LiveIndexCard indexName="NIFTY IT" refreshInterval={5000} />
            <LiveIndexCard indexName="NIFTY FIN SERVICE" refreshInterval={5000} />
          </div>
        </div>

        {/* ═══════════════ MARKET OVERVIEW CHART ═══════════════ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground/90 tracking-tight">Market Overview (BTC/USDT)</h2>
          </div>
          <div className="w-full">
            {/* Crypto Market Overview (Full Width) */}
            <Card className="bg-card/40 border-border/50 overflow-hidden h-[600px] shadow-sm relative">
              <TVLazyWidget
                src={`${TVUrl}advanced-chart.js`}
                height="100%"
                skeletonHeight="h-[600px]"
                config={{
                  autosize: true,
                  symbol: "BINANCE:BTCUSDT", // Bitcoin / TetherUS standard ticker
                  interval: "30",
                  timezone: "Asia/Kolkata",
                  theme: "dark",
                  style: "1",
                  locale: "in",
                  enable_publishing: false,
                  backgroundColor: "rgba(13, 15, 20, 1)",
                  gridColor: "rgba(42, 46, 57, 0.3)",
                  hide_top_toolbar: false,
                  hide_legend: false,
                  save_image: false,
                  container_id: "tradingview_advanced_chart_btc"
                }}
              />
            </Card>
          </div>
        </div>

        {/* ═══════════════ MARKET HEATMAPS ═══════════════ */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground/90 tracking-tight">Global Market Heatmaps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Indian Market (SENSEX) */}
            <Card className="bg-card/40 border-border/50 overflow-hidden h-[350px] shadow-sm relative group hover:border-teal-500/30 transition-colors">
              <div className="absolute top-2 left-3 z-10 pointer-events-none">
                <span className="text-xs font-bold text-foreground/80 bg-background/60 backdrop-blur-md px-2 py-1 rounded-md border border-border/50">Indian Market</span>
              </div>
              <TVLazyWidget
                src={`${TVUrl}stock-heatmap.js`}
                height="100%"
                skeletonHeight="h-[350px]"
                config={{
                  exchanges: [], dataSource: "SENSEX", grouping: "sector", blockSize: "market_cap_basic",
                  blockColor: "change", locale: "en", symbolUrl: "", colorTheme: "dark", hasTopBar: false,
                  isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false,
                  width: "100%", height: "100%"
                }}
              />
            </Card>

            {/* US Market (S&P 500) */}
            <Card className="bg-card/40 border-border/50 overflow-hidden h-[350px] shadow-sm relative group hover:border-blue-500/30 transition-colors">
              <div className="absolute top-2 left-3 z-10 pointer-events-none">
                <span className="text-xs font-bold text-foreground/80 bg-background/60 backdrop-blur-md px-2 py-1 rounded-md border border-border/50">US S&P 500</span>
              </div>
              <TVLazyWidget
                src={`${TVUrl}stock-heatmap.js`}
                height="100%"
                skeletonHeight="h-[350px]"
                config={{
                  exchanges: [], dataSource: "SPX500", grouping: "sector", blockSize: "market_cap_basic",
                  blockColor: "change", locale: "en", symbolUrl: "", colorTheme: "dark", hasTopBar: false,
                  isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false,
                  width: "100%", height: "100%"
                }}
              />
            </Card>

            {/* Crypto Heatmap */}
            <Card className="bg-card/40 border-border/50 overflow-hidden h-[350px] shadow-sm relative group hover:border-amber-500/30 transition-colors">
              <div className="absolute top-2 left-3 z-10 pointer-events-none">
                <span className="text-xs font-bold text-foreground/80 bg-background/60 backdrop-blur-md px-2 py-1 rounded-md border border-border/50">Crypto Coins</span>
              </div>
              <TVLazyWidget
                src={`${TVUrl}crypto-coins-heatmap.js`}
                height="100%"
                skeletonHeight="h-[350px]"
                config={{
                  dataSource: "Crypto", blockSize: "market_cap_calc", blockColor: "change",
                  locale: "en", symbolUrl: "", colorTheme: "dark", hasTopBar: false,
                  isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false,
                  width: "100%", height: "100%"
                }}
              />
            </Card>

            {/* Forex Heatmap */}
            <Card className="bg-card/40 border-border/50 overflow-hidden h-[350px] shadow-sm relative group hover:border-purple-500/30 transition-colors">
              <div className="absolute top-2 left-3 z-10 pointer-events-none">
                <span className="text-xs font-bold text-foreground/80 bg-background/60 backdrop-blur-md px-2 py-1 rounded-md border border-border/50">Forex Pairs</span>
              </div>
              <TVLazyWidget
                src={`${TVUrl}forex-heat-map.js`}
                height="100%"
                skeletonHeight="h-[350px]"
                config={{
                  width: "100%", height: "100%", currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD", "CNY", "INR"],
                  isTransparent: true, colorTheme: "dark", locale: "en"
                }}
              />
            </Card>

          </div>
        </div>

        {/* ═══════════════ MAIN ONE-COLUMN LAYOUT ═══════════════ */}
        <div className="grid grid-cols-1 gap-6">

          {/* LEFT COLUMN: Market Summary (News Timeline) */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground/90 tracking-tight">Market Summary</h2>
            <Card className="bg-card/40 border-border/50 overflow-hidden h-[700px] shadow-sm relative">
              <TVLazyWidget
                src={`${TVUrl}timeline.js`}
                height="100%"
                skeletonHeight="h-[700px]"
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
          </div>



        </div>
      </div>
    </div>
  );
}
