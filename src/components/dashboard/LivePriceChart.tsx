import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
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

interface PricePoint {
  time: string;
  price: number;
}

interface LivePriceChartProps {
  stocks: StockData[];
}

const LivePriceChart = memo(({ stocks }: LivePriceChartProps) => {
  const [selectedStock, setSelectedStock] = useState<string>(stocks[0]?.symbol || '');
  const [priceHistory, setPriceHistory] = useState<Record<string, PricePoint[]>>({});

  // Build price history from live refreshes
  useEffect(() => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setPriceHistory(prev => {
      const updated = { ...prev };
      stocks.forEach(stock => {
        const existing = updated[stock.symbol] || [];
        // Keep last 30 data points
        const newPoints = [...existing, { time: now, price: stock.price }].slice(-30);
        updated[stock.symbol] = newPoints;
      });
      return updated;
    });
  }, [stocks]);

  const currentStock = stocks.find(s => s.symbol === selectedStock);
  const chartData = priceHistory[selectedStock] || [];
  const up = currentStock ? currentStock.change >= 0 : true;
  const lineColor = up ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)';

  // Memoize Y-axis domain calculations
  const { minPrice, maxPrice, padding } = useMemo(() => {
    const prices = chartData.map(p => p.price);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const pad = (max - min) * 0.2 || max * 0.002;
    return { minPrice: min, maxPrice: max, padding: pad };
  }, [chartData]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {up ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
            Live Price Chart
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
        {/* Stock selector pills */}
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

        {/* Chart */}
        <div className="h-[300px]">
          {chartData.length < 2 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Collecting live data points... Chart will appear after the next refresh.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis
                  dataKey="time"
                  tick={{ fill: 'hsl(240, 5%, 65%)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(240, 5%, 18%)' }}
                />
                <YAxis
                  domain={[minPrice - padding, maxPrice + padding]}
                  tick={{ fill: 'hsl(240, 5%, 65%)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(240, 10%, 6%)',
                    border: '1px solid hsl(240, 5%, 18%)',
                    borderRadius: '8px',
                    color: 'hsl(0, 0%, 98%)',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Price']}
                />
                {chartData.length > 0 && (
                  <ReferenceLine
                    y={chartData[0].price}
                    stroke="hsl(240, 5%, 30%)"
                    strokeDasharray="3 3"
                    label={{ value: 'Open', fill: 'hsl(240, 5%, 50%)', fontSize: 10 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: lineColor }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

LivePriceChart.displayName = 'LivePriceChart';

export default LivePriceChart;
