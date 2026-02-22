import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, LineSeries, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: string;
}

interface LightweightChartProps {
  stocks: StockData[];
}

const LightweightChart = ({ stocks }: LightweightChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>(stocks[0]?.symbol || '');
  const [priceHistory, setPriceHistory] = useState<Record<string, { time: number; value: number }[]>>({});

  const currentStock = stocks.find(s => s.symbol === selectedStock);
  const up = currentStock ? currentStock.change >= 0 : true;

  // Accumulate price data
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000) as UTCTimestamp;
    setPriceHistory(prev => {
      const updated = { ...prev };
      stocks.forEach(stock => {
        const existing = updated[stock.symbol] || [];
        const lastPoint = existing[existing.length - 1];
        // Only add if time is different
        if (!lastPoint || now > lastPoint.time) {
          updated[stock.symbol] = [...existing, { time: now, value: stock.price }].slice(-100);
        }
      });
      return updated;
    });
  }, [stocks]);

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(240, 5%, 65%)',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'hsl(240, 5%, 12%)' },
        horzLines: { color: 'hsl(240, 5%, 12%)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
      crosshair: {
        vertLine: { color: 'hsl(45, 93%, 47%)', width: 1, style: 2 },
        horzLine: { color: 'hsl(45, 93%, 47%)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'hsl(240, 5%, 18%)',
      },
      timeScale: {
        borderColor: 'hsl(240, 5%, 18%)',
        timeVisible: true,
        secondsVisible: true,
      },
    });

    chartRef.current = chart;

    const series = chart.addSeries(LineSeries, {
      color: up ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)',
      lineWidth: 2,
      crosshairMarkerRadius: 4,
      priceFormat: { type: 'custom', formatter: (price: number) => `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    });
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [selectedStock]);

  // Update data
  useEffect(() => {
    const data = priceHistory[selectedStock] || [];
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data as any);
      seriesRef.current.applyOptions({
        color: up ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)',
      });
    }
  }, [priceHistory, selectedStock, up]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {up ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
            Lightweight Chart
          </CardTitle>
          {currentStock && (
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-foreground tabular-nums">
                ₹{currentStock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <Badge variant={up ? 'default' : 'destructive'} className={up ? 'bg-success text-success-foreground' : ''}>
                {up ? '+' : ''}{currentStock.changePercent.toFixed(2)}%
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Stock selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {stocks.slice(0, 12).map(stock => {
            const isUp = stock.change >= 0;
            return (
              <Button
                key={stock.symbol}
                variant={selectedStock === stock.symbol ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStock(stock.symbol)}
                className="text-xs"
              >
                {stock.symbol}
                <span className={`ml-1 ${isUp ? 'text-success' : 'text-destructive'}`}>
                  {isUp ? '▲' : '▼'}
                </span>
              </Button>
            );
          })}
        </div>

        <div ref={chartContainerRef} className="w-full" />
      </CardContent>
    </Card>
  );
};

export default LightweightChart;
