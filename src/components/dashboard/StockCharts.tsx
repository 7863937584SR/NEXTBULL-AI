import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: string;
  isError?: boolean;
}

interface StockChartsProps {
  stocks: StockData[];
}

const chartConfig = {
  changePercent: { label: '% Change' },
  price: { label: 'Price (₹)' },
  range: { label: 'Day Range (₹)' },
};

const StockCharts = ({ stocks }: StockChartsProps) => {
  const validStocks = stocks.filter(s => !s.isError);

  const changeData = validStocks.map(s => ({
    symbol: s.symbol,
    changePercent: s.changePercent,
    fill: s.changePercent >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
  }));

  const rangeData = validStocks.map(s => ({
    symbol: s.symbol,
    high: s.high,
    low: s.low,
    price: s.price,
    range: s.high - s.low,
  }));

  const gainers = validStocks.filter(s => s.change > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = validStocks.filter(s => s.change < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* % Change Bar Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Stock Performance (% Change)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={changeData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="category" dataKey="symbol" width={80} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`${value >= 0 ? '+' : ''}${value.toFixed(2)}%`, '% Change']}
              />
              <Bar dataKey="changePercent" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {changeData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Gainers & Losers */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Movers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gainers */}
          <div>
            <p className="text-sm font-medium text-success flex items-center gap-1 mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Top Gainers
            </p>
            <div className="space-y-2">
              {gainers.map(s => (
                <div key={s.symbol} className="flex items-center justify-between p-2 rounded-lg bg-success/5 border border-success/10">
                  <div>
                    <span className="font-semibold text-sm text-foreground">{s.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2">₹{s.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <span className="text-sm font-medium text-success">+{s.changePercent.toFixed(2)}%</span>
                </div>
              ))}
              {gainers.length === 0 && <p className="text-xs text-muted-foreground">No gainers</p>}
            </div>
          </div>

          {/* Losers */}
          <div>
            <p className="text-sm font-medium text-destructive flex items-center gap-1 mb-2">
              <TrendingDown className="w-3.5 h-3.5" /> Top Losers
            </p>
            <div className="space-y-2">
              {losers.map(s => (
                <div key={s.symbol} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div>
                    <span className="font-semibold text-sm text-foreground">{s.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-2">₹{s.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <span className="text-sm font-medium text-destructive">{s.changePercent.toFixed(2)}%</span>
                </div>
              ))}
              {losers.length === 0 && <p className="text-xs text-muted-foreground">No losers</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Range Chart */}
      <Card className="bg-card border-border lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Day Price Range (High - Low)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={rangeData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="symbol" stroke="hsl(var(--muted-foreground))" fontSize={11} angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `₹${v}`} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, name === 'range' ? 'Day Range' : 'Price']}
              />
              <Bar dataKey="range" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockCharts;
