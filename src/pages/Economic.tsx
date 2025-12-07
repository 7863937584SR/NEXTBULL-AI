import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EconomicEvent {
  time: string;
  impact: 'high' | 'medium' | 'low';
  event: string;
  actual?: string;
  forecast?: string;
  prior?: string;
}

const economicEvents: EconomicEvent[] = [
  { time: '13:30', impact: 'high', event: 'FX Reserves (Monthly)', actual: '3.346 Tln $', forecast: '3.359 Tln $', prior: '3.343 Tln $' },
  { time: '05:00', impact: 'high', event: 'Overall Lab Cash Earnings', prior: '2.1%' },
  { time: '05:00', impact: 'medium', event: 'Overtime Pay', prior: '1%' },
  { time: '05:20', impact: 'high', event: 'Bank Lending YY', prior: '4.1%' },
  { time: '05:20', impact: 'medium', event: 'Current Account Bal SA', prior: '43,475.72 h. MJPY' },
  { time: '05:20', impact: 'medium', event: 'Current Account NSA JPY', forecast: '3,039.9 BJPY', prior: '4,483.3 BJPY' },
  { time: '05:20', impact: 'low', event: 'Current Account, Goods', prior: '236.038 BJPY' },
];

const Economic = () => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-primary text-center mb-8">Economic Events</h1>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm font-medium bg-secondary px-3 py-1 rounded-full">G20</span>
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              December {today.getDate()}
            </h2>
            <div className="space-y-2">
              {economicEvents.slice(0, 1).map((event, index) => (
                <Card key={index} className="bg-card border-border p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-muted-foreground text-sm">{event.time}</div>
                    <div className="col-span-1 flex justify-center">
                      <span className={`w-3 h-3 rounded-full ${getImpactColor(event.impact)}`} />
                    </div>
                    <div className="col-span-1">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="col-span-4 text-foreground">{event.event}</div>
                    <div className="col-span-2 text-right text-foreground">{event.actual || '-'}</div>
                    <div className="col-span-2 text-right text-muted-foreground">{event.forecast || '-'}</div>
                    <div className="col-span-1 text-right text-muted-foreground">{event.prior || '-'}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                December {tomorrow.getDate()}
              </h2>
              <div className="grid grid-cols-3 gap-8 text-sm text-muted-foreground">
                <span>Actual</span>
                <span>Forecast</span>
                <span>Prior</span>
              </div>
            </div>
            <div className="space-y-2">
              {economicEvents.slice(1).map((event, index) => (
                <Card key={index} className="bg-card border-border p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-muted-foreground text-sm">{event.time}</div>
                    <div className="col-span-1 flex justify-center">
                      <span className={`w-3 h-3 rounded-full ${getImpactColor(event.impact)}`} />
                    </div>
                    <div className="col-span-1">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="col-span-4 text-foreground">{event.event}</div>
                    <div className="col-span-2 text-right text-foreground">{event.actual || '-'}</div>
                    <div className="col-span-2 text-right text-muted-foreground">{event.forecast || '-'}</div>
                    <div className="col-span-1 text-right text-muted-foreground">{event.prior || '-'}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Economic;
