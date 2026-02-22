import { useEffect, useRef, useState, memo } from 'react';
import { Button } from '@/components/ui/button';

interface TradingViewWidgetProps {
  symbol?: string;
}

const POPULAR_SYMBOLS = [
  { label: 'NIFTY 50', value: 'NASDAQ:NIFTY_50' },
  { label: 'SENSEX', value: 'BSE:SENSEX' },
  { label: 'RELIANCE', value: 'BSE:RELIANCE' },
  { label: 'TCS', value: 'BSE:TCS' },
  { label: 'INFY', value: 'BSE:INFY' },
  { label: 'HDFCBANK', value: 'BSE:HDFCBANK' },
  { label: 'ICICIBANK', value: 'BSE:ICICIBANK' },
  { label: 'SBIN', value: 'BSE:SBIN' },
  { label: 'ITC', value: 'BSE:ITC' },
  { label: 'TATAMOTORS', value: 'BSE:TATAMOTORS' },
];

const TradingViewWidget = memo(({ symbol: initialSymbol = 'NSE:NIFTY' }: TradingViewWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSymbol, setActiveSymbol] = useState(initialSymbol);

  useEffect(() => {
    if (!containerRef.current) return;

    // TradingView requires a specific DOM structure
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: activeSymbol,
      interval: 'D',
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
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      studies: ['RSI@tv-basicstudies'],
    });

    containerRef.current.appendChild(script);
  }, [activeSymbol]);

  return (
    <div className="flex flex-col h-full">
      {/* Symbol quick-switch */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-card overflow-x-auto shrink-0 scrollbar-none">
        {POPULAR_SYMBOLS.map(s => (
          <Button
            key={s.value}
            variant={activeSymbol === s.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSymbol(s.value)}
            className="text-xs h-7 px-3 whitespace-nowrap shrink-0"
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* Chart fills remaining space */}
      <div
        className="tradingview-widget-container flex-1 min-h-0"
        ref={containerRef}
        style={{ width: '100%' }}
      />
    </div>
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';

export default TradingViewWidget;
