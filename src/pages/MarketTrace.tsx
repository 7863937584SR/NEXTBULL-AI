import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const MarketTrace = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-foreground mb-8">Market Trace: Live Shipping Map</h1>

      <Card className="bg-card border-border overflow-hidden">
        <div className="relative">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search MarineTraffic"
                className="pl-10 w-80 bg-background/80 backdrop-blur-sm"
              />
            </div>
          </div>
          
          <iframe
            src="https://www.marinetraffic.com/en/ais/embed/zoom:2/centery:20/centerx:0/maptype:0/shownames:false/mmsi:0/shipid:0/fleet:/fleet_id:/vtypes:/showmenu:false/remember:false"
            width="100%"
            height="600"
            className="border-0"
            title="Marine Traffic Live Map"
          />
        </div>
      </Card>
    </div>
  );
};

export default MarketTrace;
