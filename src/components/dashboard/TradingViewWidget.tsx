import { useEffect, useRef, useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Maximize2, TrendingUp, CandlestickChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TradingViewWidgetProps {
  symbol?: string;
}

const POPULAR_SYMBOLS = [
  { label: 'NIFTY 50', value: 'NSE:NIFTY' },
  { label: 'BANK NIFTY', value: 'NSE:BANKNIFTY' },
  { label: 'RELIANCE', value: 'NSE:RELIANCE' },
  { label: 'TCS', value: 'NSE:TCS' },
  { label: 'HDFCBANK', value: 'NSE:HDFCBANK' },
  { label: 'INFY', value: 'NSE:INFY' },
];

const TradingViewWidget = memo(({ symbol: initialSymbol = 'NSE:NIFTY' }: TradingViewWidgetProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const [activeSymbol, setActiveSymbol] = useState(initialSymbol);

  // Main advanced chart
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = '';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.height = 'calc(100% - 32px)';
    widget.style.width = '100%';
    chartRef.current.appendChild(widget);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: activeSymbol,
      interval: '5',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(10, 10, 14, 1)',
      gridColor: 'rgba(42, 42, 52, 0.25)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies', 'VWAP@tv-basicstudies'],
      withdateranges: true,
      details: true,
      hotlist: true,
    });

    chartRef.current.appendChild(script);
  }, [activeSymbol]);

  // Ticker tape widget
  useEffect(() => {
    if (!tickerRef.current) return;
    tickerRef.current.innerHTML = '';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    tickerRef.current.appendChild(widget);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        // Indian Market
        { proName: 'NSE:NIFTY', title: 'NIFTY 50' },
        { proName: 'NSE:BANKNIFTY', title: 'BANK NIFTY' },
        { proName: 'BSE:SENSEX', title: 'SENSEX' },
        { proName: 'NSE:RELIANCE', title: 'RELIANCE' },
        { proName: 'NSE:TCS', title: 'TCS' },
        { proName: 'NSE:HDFCBANK', title: 'HDFC BANK' },
        { proName: 'NSE:INFY', title: 'INFOSYS' },
        { proName: 'NSE:ITC', title: 'ITC' },
        { proName: 'NSE:SBIN', title: 'SBI' },
        { proName: 'NSE:BHARTIARTL', title: 'AIRTEL' },
        { proName: 'NSE:TATAMOTORS', title: 'TATA MOTORS' },
        // Global Indices
        { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
        { proName: 'FOREXCOM:NSXUSD', title: 'NASDAQ 100' },
        { proName: 'FOREXCOM:DJI', title: 'DOW JONES' },
        { proName: 'CAPITALCOM:UK100', title: 'FTSE 100' },
        { proName: 'CAPITALCOM:DAX', title: 'DAX' },
        { proName: 'INDEX:NKY', title: 'NIKKEI 225' },
        { proName: 'INDEX:HSI', title: 'HANG SENG' },
        // Forex & Commodities
        { proName: 'FX:USDINR', title: 'USD/INR' },
        { proName: 'FX:EURUSD', title: 'EUR/USD' },
        { proName: 'FX:GBPUSD', title: 'GBP/USD' },
        { proName: 'TVC:GOLD', title: 'GOLD' },
        { proName: 'TVC:SILVER', title: 'SILVER' },
        { proName: 'NYMEX:CL1!', title: 'CRUDE OIL' },
        // Crypto
        { proName: 'BITSTAMP:BTCUSD', title: 'BITCOIN' },
        { proName: 'BITSTAMP:ETHUSD', title: 'ETHEREUM' },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'en',
    });

    tickerRef.current.appendChild(script);
  }, []);

  return (
    <div className="space-y-4">
      {/* ── TICKER TAPE ── */}
      <Card className="bg-card/60 border-border/40 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div ref={tickerRef} className="tradingview-widget-container" />
        </CardContent>
      </Card>

      {/* ── MAIN CHART ── */}
      <Card className="bg-card/80 border-border/50 backdrop-blur-sm overflow-hidden relative">
        {/* Decorative top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <CardHeader className="pb-3 pt-5 px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/25 to-amber-600/15 ring-1 ring-primary/20">
                <CandlestickChart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  Advanced Chart
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Real-time · {activeSymbol.replace('NSE:', '')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Symbol quick-switch pills */}
              <div className="flex items-center gap-1 flex-wrap">
                {POPULAR_SYMBOLS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setActiveSymbol(s.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 ${activeSymbol === s.value
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-border/50 hidden sm:block" />

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
                onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(activeSymbol)}`, '_blank')}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Full Screen
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div
            className="tradingview-widget-container"
            ref={chartRef}
            style={{ height: '700px', width: '100%' }}
          />
        </CardContent>
      </Card>
    </div>
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';

export default TradingViewWidget;
