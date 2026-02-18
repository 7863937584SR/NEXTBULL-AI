import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const generatePrice = (base: number, volatility: number) => {
  const delta = (Math.random() - 0.48) * volatility;
  return +(base + delta).toFixed(2);
};

const initialIndices: IndexData[] = [
  { name: 'NIFTY 50', value: 24680.50, change: 127.35, changePercent: 0.52 },
  { name: 'SENSEX', value: 81245.80, change: 412.60, changePercent: 0.51 },
  { name: 'NIFTY BANK', value: 52340.15, change: -89.20, changePercent: -0.17 },
  { name: 'NIFTY IT', value: 38920.70, change: 245.80, changePercent: 0.64 },
];

const initialStocks: StockData[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2945.30, change: 32.50, changePercent: 1.12, high: 2968.00, low: 2910.50, volume: '12.4M' },
  { symbol: 'TCS', name: 'Tata Consultancy', price: 3892.45, change: -18.70, changePercent: -0.48, high: 3920.00, low: 3880.15, volume: '4.2M' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1678.90, change: 14.25, changePercent: 0.86, high: 1685.00, low: 1660.30, volume: '8.7M' },
  { symbol: 'INFY', name: 'Infosys', price: 1845.60, change: 22.80, changePercent: 1.25, high: 1858.00, low: 1820.40, volume: '6.1M' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1234.75, change: -5.40, changePercent: -0.44, high: 1245.00, low: 1228.90, volume: '9.3M' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: 2567.80, change: 8.90, changePercent: 0.35, high: 2575.00, low: 2555.20, volume: '2.8M' },
  { symbol: 'ITC', name: 'ITC Limited', price: 468.35, change: 6.15, changePercent: 1.33, high: 472.00, low: 461.50, volume: '15.6M' },
  { symbol: 'SBIN', name: 'State Bank of India', price: 842.50, change: -12.30, changePercent: -1.44, high: 858.00, low: 839.70, volume: '11.2M' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1567.20, change: 28.40, changePercent: 1.85, high: 1578.00, low: 1535.60, volume: '5.4M' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 978.65, change: -8.75, changePercent: -0.89, high: 992.00, low: 975.30, volume: '7.8M' },
  { symbol: 'WIPRO', name: 'Wipro Limited', price: 542.30, change: 4.60, changePercent: 0.86, high: 548.00, low: 536.80, volume: '3.9M' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', price: 3245.80, change: 56.90, changePercent: 1.78, high: 3268.00, low: 3185.40, volume: '4.5M' },
];

const Dashboard = () => {
  const [indices, setIndices] = useState(initialIndices);
  const [stocks, setStocks] = useState(initialStocks);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setIndices(prev =>
        prev.map(idx => {
          const newValue = generatePrice(idx.value, idx.value * 0.001);
          const change = +(newValue - (idx.value - idx.change)).toFixed(2);
          return { ...idx, value: newValue, change, changePercent: +((change / (newValue - change)) * 100).toFixed(2) };
        })
      );
      setStocks(prev =>
        prev.map(stock => {
          const newPrice = generatePrice(stock.price, stock.price * 0.002);
          const basePrice = stock.price - stock.change;
          const change = +(newPrice - basePrice).toFixed(2);
          return {
            ...stock,
            price: newPrice,
            change,
            changePercent: +((change / basePrice) * 100).toFixed(2),
            high: Math.max(stock.high, newPrice),
            low: Math.min(stock.low, newPrice),
          };
        })
      );
      setLastUpdated(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive]);

  const marketUp = indices[0].change >= 0;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isLive ? 'default' : 'secondary'} className={isLive ? 'bg-success text-success-foreground animate-pulse-glow' : ''}>
            {isLive ? '● LIVE' : '● PAUSED'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setIsLive(!isLive)}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLive ? 'animate-spin' : ''}`} style={isLive ? { animationDuration: '3s' } : {}} />
            {isLive ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Market Indices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map((idx) => {
          const up = idx.change >= 0;
          return (
            <Card key={idx.name} className="bg-card border-border hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">{idx.name}</span>
                  {up ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${up ? 'text-success' : 'text-destructive'}`}>
                  {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{up ? '+' : ''}{idx.change.toFixed(2)}</span>
                  <span>({up ? '+' : ''}{idx.changePercent.toFixed(2)}%)</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Market Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Market Status</p>
              <p className={`text-lg font-bold ${marketUp ? 'text-success' : 'text-destructive'}`}>
                {marketUp ? 'Bullish' : 'Bearish'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gainers</p>
              <p className="text-lg font-bold text-success">
                {stocks.filter(s => s.change > 0).length} stocks
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Losers</p>
              <p className="text-lg font-bold text-destructive">
                {stocks.filter(s => s.change < 0).length} stocks
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stocks Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Top NSE Stocks
            </CardTitle>
            <span className="text-xs text-muted-foreground">Simulated live data • Refresh every 3s</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Symbol</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Company</th>
                  <th className="text-right px-4 py-3 font-medium">Price (₹)</th>
                  <th className="text-right px-4 py-3 font-medium">Change</th>
                  <th className="text-right px-4 py-3 font-medium">% Change</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">High</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Low</th>
                  <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Volume</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const up = stock.change >= 0;
                  return (
                    <tr key={stock.symbol} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary">{stock.symbol}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{stock.name}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">
                        ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium tabular-nums ${up ? 'text-success' : 'text-destructive'}`}>
                        {up ? '+' : ''}{stock.change.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums ${up ? 'text-success' : 'text-destructive'}`}>
                        <span className="inline-flex items-center gap-1">
                          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {up ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums hidden md:table-cell">
                        ₹{stock.high.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums hidden md:table-cell">
                        ₹{stock.low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{stock.volume}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
