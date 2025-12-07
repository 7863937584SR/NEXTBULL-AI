import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';

const profitRevenueData = [
  { month: 'Feb', revenue: 32000, profit: 15000 },
  { month: 'Apr', revenue: 28000, profit: 12000 },
  { month: 'Jun', revenue: 35000, profit: 18000 },
  { month: 'Aug', revenue: 42000, profit: 22000 },
  { month: 'Oct', revenue: 38000, profit: 20000 },
  { month: 'Dec', revenue: 45000, profit: 25000 },
];

const profitLossData = [
  { month: 'Feb', profit: 3000, loss: 2000 },
  { month: 'Apr', profit: 5500, loss: 3500 },
  { month: 'Jun', profit: 9000, loss: 6000 },
  { month: 'Aug', profit: 11500, loss: 7500 },
  { month: 'Oct', profit: 8000, loss: 7000 },
  { month: 'Dec', profit: 9500, loss: 6500 },
];

const revenueMonthData = [
  { month: 'Feb', revenue: 18000 },
  { month: 'Mar', revenue: 20000 },
  { month: 'Apr', revenue: 22000 },
  { month: 'May', revenue: 19000 },
  { month: 'Jun', revenue: 24000 },
  { month: 'Jul', revenue: 21000 },
  { month: 'Aug', revenue: 26000 },
  { month: 'Sep', revenue: 23000 },
  { month: 'Oct', revenue: 25000 },
  { month: 'Nov', revenue: 22000 },
  { month: 'Dec', revenue: 28000 },
];

const trades = [
  { id: '63bf7ac9f8...', avgPrice: '$8.62', totalPrice: '$119.34' },
  { id: '63bf7ad8f1...', avgPrice: '$15.30', totalPrice: '$250.10' },
  { id: '63bf7ae2d4...', avgPrice: '$101.50', totalPrice: '$1015.00' },
];

const copiedTrades = [
  { id: '63bf7ccef0...', trader: 'Paige Allom', amount: '$153.99' },
  { id: '63bf7ce1a2...', trader: 'John Doe', amount: '$205.50' },
  { id: '63bf7cf3b3...', trader: 'Jane Smith', amount: '$99.75' },
];

const Journaling = () => {
  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Profit and Revenue</CardTitle>
            <span className="text-success text-sm font-medium">+4%</span>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">Top line revenue, bottom line profit</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={profitRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1) / 0.3)" />
                <Area type="monotone" dataKey="profit" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2) / 0.3)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Profit and Loss</CardTitle>
            <span className="text-success text-sm font-medium">+11%</span>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">Top line profit, bottom line loss</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={profitLossData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--chart-2))" strokeWidth={2} dot />
                <Line type="monotone" dataKey="loss" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Revenue Month by Month</CardTitle>
            <span className="text-success text-sm font-medium">+14%</span>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">Graph representing the revenue month by month</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueMonthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl">History of Trades taken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-3 text-sm text-muted-foreground font-medium">
                <span>ID</span>
                <span className="text-center">Avg Price</span>
                <span className="text-right">Total Price</span>
              </div>
              {trades.map((trade, index) => (
                <div key={index} className="grid grid-cols-3 text-sm py-2 border-t border-border">
                  <span className="text-foreground">{trade.id}</span>
                  <span className="text-center text-foreground">{trade.avgPrice}</span>
                  <span className="text-right text-foreground">{trade.totalPrice}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Trade Copier</CardTitle>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">50 latest transactions</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-3 text-sm text-muted-foreground font-medium">
                <span>ID</span>
                <span className="text-center">Trader</span>
                <span className="text-right">Amount</span>
              </div>
              {copiedTrades.map((trade, index) => (
                <div key={index} className="grid grid-cols-3 text-sm py-2 border-t border-border">
                  <span className="text-foreground">{trade.id}</span>
                  <span className="text-center text-foreground">{trade.trader}</span>
                  <span className="text-right text-foreground">{trade.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Expense Breakdown By Category</CardTitle>
            <span className="text-success text-sm font-medium">+4%</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8 py-8">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="hsl(var(--border))"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${75 * 2.2} ${100 * 2.2}`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">75%</span>
              </div>
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="hsl(var(--border))"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${60 * 2.2} ${100 * 2.2}`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">60%</span>
              </div>
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="hsl(var(--border))"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${85 * 2.2} ${100 * 2.2}`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">85%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Journaling;
