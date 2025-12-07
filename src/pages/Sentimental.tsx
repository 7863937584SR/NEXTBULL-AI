import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const sentimentData = [
  { name: 'NIFTY 50', sentiment: 72, trend: 'bullish', change: '+2.3%' },
  { name: 'SENSEX', sentiment: 68, trend: 'bullish', change: '+1.8%' },
  { name: 'BANK NIFTY', sentiment: 45, trend: 'neutral', change: '-0.2%' },
  { name: 'IT NIFTY', sentiment: 81, trend: 'bullish', change: '+4.1%' },
  { name: 'RELIANCE', sentiment: 65, trend: 'bullish', change: '+1.2%' },
  { name: 'TCS', sentiment: 78, trend: 'bullish', change: '+2.8%' },
  { name: 'HDFC BANK', sentiment: 38, trend: 'bearish', change: '-1.5%' },
  { name: 'INFOSYS', sentiment: 85, trend: 'bullish', change: '+3.2%' },
];

const Sentimental = () => {
  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 60) return 'text-success';
    if (sentiment <= 40) return 'text-destructive';
    return 'text-warning';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'bearish':
        return <TrendingDown className="w-5 h-5 text-destructive" />;
      default:
        return <Minus className="w-5 h-5 text-warning" />;
    }
  };

  const overallSentiment = Math.round(
    sentimentData.reduce((acc, item) => acc + item.sentiment, 0) / sentimentData.length
  );

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-foreground mb-8">Market Sentiment</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Overall Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-bold ${getSentimentColor(overallSentiment)}`}>
                {overallSentiment}%
              </span>
              <span className="text-success text-sm">Bullish</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Fear & Greed Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-warning">58</span>
              <span className="text-warning text-sm">Neutral</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Market Volatility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-success">Low</span>
              <span className="text-muted-foreground text-sm">VIX: 12.5</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Stock Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sentimentData.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-28 font-medium text-foreground">{item.name}</div>
                <div className="flex-1">
                  <Progress 
                    value={item.sentiment} 
                    className="h-3"
                  />
                </div>
                <div className={`w-16 text-right font-semibold ${getSentimentColor(item.sentiment)}`}>
                  {item.sentiment}%
                </div>
                <div className="w-16 flex items-center justify-center">
                  {getTrendIcon(item.trend)}
                </div>
                <div className={`w-16 text-right text-sm ${
                  item.change.startsWith('+') ? 'text-success' : 'text-destructive'
                }`}>
                  {item.change}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sentimental;
