import { useEffect, useRef, useState, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TradingViewWidgetProps {
  symbol?: string;
}

const POPULAR_SYMBOLS = [
  { label: 'NIFTY 50', value: 'NSE:NIFTY' },
  { label: 'SENSEX', value: 'BSE:SENSEX' },
  { label: 'BANK NIFTY', value: 'NSE:BANKNIFTY' },
  { label: 'RELIANCE', value: 'NSE:RELIANCE' },
  { label: 'TCS', value: 'NSE:TCS' },
  { label: 'INFY', value: 'NSE:INFY' },
  { label: 'HDFCBANK', value: 'NSE:HDFCBANK' },
  { label: 'ICICIBANK', value: 'NSE:ICICIBANK' },
];

const TradingViewWidget = memo(({ symbol: initialSymbol = 'NSE:NIFTY' }: TradingViewWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSymbol, setActiveSymbol] = useState(initialSymbol);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

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
      backgroundColor: 'rgba(14, 14, 16, 1)',
      gridColor: 'rgba(42, 42, 52, 0.3)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'],
    });

    containerRef.current.appendChild(script);
  }, [activeSymbol]);

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        {/* Symbol quick-switch bar */}
        <div className="flex flex-wrap gap-1.5 p-3 border-b border-border bg-secondary/30">
          {POPULAR_SYMBOLS.map(s => (
            <Button
              key={s.value}
              variant={activeSymbol === s.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSymbol(s.value)}
              className="text-xs h-7 px-3"
            >
              {s.label}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div
          className="tradingview-widget-container"
          ref={containerRef}
          style={{ height: 'calc(100vh - 220px)', minHeight: '500px', width: '100%' }}
        />
      </CardContent>
    </Card>
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';

export default TradingViewWidget;
