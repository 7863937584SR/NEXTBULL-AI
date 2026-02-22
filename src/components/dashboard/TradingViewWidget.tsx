import { useEffect, useRef, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface TradingViewWidgetProps {
  symbol?: string;
}

const TradingViewWidget = memo(({ symbol = 'NSE:NIFTY' }: TradingViewWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: '5',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(14, 14, 16, 1)',
      gridColor: 'rgba(42, 42, 52, 0.5)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'],
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          TradingView Advanced Chart
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="tradingview-widget-container" ref={containerRef} style={{ height: '500px', width: '100%' }} />
      </CardContent>
    </Card>
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';

export default TradingViewWidget;
