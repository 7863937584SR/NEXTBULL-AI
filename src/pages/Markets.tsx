import { Activity, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
            <h2 className="text-lg font-semibold text-foreground/90 tracking-tight">Market Overview (30m & 1h)</h2>
          </div>
          <Card className="bg-card/40 border-border/50 overflow-hidden h-[600px] shadow-sm relative">
            <TVLazyWidget
              src={`${TVUrl}advanced-chart.js`}
              height="100%"
              skeletonHeight="h-[600px]"
              config={{
                autosize: true,
                symbol: "NSE:NIFTY",
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
                container_id: "tradingview_advanced_chart",
                show_popup_button: true,
                popup_width: "1000",
                popup_height: "650"
              }}
            />
          </Card>
        </div>

        {/* ═══════════════ MAIN TWO-COLUMN LAYOUT ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN: Market Summary (News Timeline) */}
          <div className="lg:col-span-2 space-y-4">
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

          {/* RIGHT COLUMN: Watchlist */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground/90 tracking-tight">Trending Watchlist</h2>
            <Card className="bg-card/40 border-border/50 overflow-hidden h-[700px] shadow-sm relative">
              <TVLazyWidget
                src={`${TVUrl}market-overview.js`}
                height="100%"
                skeletonHeight="h-[700px]"
                config={{
                  colorTheme: "dark",
                  dateRange: "12M",
                  showChart: true,
                  locale: "in",
                  width: "100%",
                  height: "100%",
                  largeChartUrl: "",
                  isTransparent: true,
                  showSymbolLogo: true,
                  showFloatingTooltip: true,
                  tabs: [
                    {
                      title: "Indian Equities",
                      symbols: [
                        { s: "BSE:RELIANCE", d: "Reliance Industries" },
                        { s: "BSE:HDFCBANK", d: "HDFC Bank" },
                        { s: "BSE:INFY", d: "Infosys" },
                        { s: "BSE:TCS", d: "TCS" },
                        { s: "BSE:ICICIBANK", d: "ICICI Bank" },
                        { s: "BSE:SBIN", d: "State Bank of India" },
                        { s: "BSE:BHARTIARTL", d: "Bharti Airtel" }
                      ]
                    },
                    {
                      title: "Global Tech",
                      symbols: [
                        { s: "NASDAQ:NVDA", d: "NVIDIA Corp" },
                        { s: "NASDAQ:AAPL", d: "Apple Inc." },
                        { s: "NASDAQ:MSFT", d: "Microsoft Corp" },
                        { s: "NASDAQ:TSLA", d: "Tesla Inc." },
                        { s: "CRYPTO:BTCUSD", d: "Bitcoin" }
                      ]
                    }
                  ]
                }}
              />
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
