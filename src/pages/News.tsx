import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface NewsItem {
  title: string;
  source: string;
  time: string;
  category: string;
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');

  useEffect(() => {
    // Simulating live news feed - in production, connect to a real news API
    const fetchNews = async () => {
      setLoading(true);
      // Mock data for demonstration
      const mockNews: NewsItem[] = [
        {
          title: "US dollar bears see possibility of record slide resuming after a recent pause in depreciation.",
          source: "Reuters",
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          category: "live"
        },
        {
          title: "U.S. stock markets hit record highs as Fed rate-cut expectations grow amid mixed inflation signals.",
          source: "Reuters",
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          category: "live"
        },
        {
          title: "Wall Street braces for quarter-end liquidity stress in money markets as trading volumes thin out toward month-end.",
          source: "Bloomberg",
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          category: "live"
        },
        {
          title: "Asian markets rally on China stimulus hopes, Nikkei touches new highs.",
          source: "Financial Times",
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          category: "global"
        },
        {
          title: "European Central Bank signals potential rate cuts in early 2025.",
          source: "Reuters",
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          category: "global"
        },
        {
          title: "RBI keeps repo rate unchanged at 6.5%, maintains growth forecast.",
          source: "Economic Times",
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          category: "indian"
        },
        {
          title: "Sensex and Nifty hit fresh all-time highs on strong FII inflows.",
          source: "Moneycontrol",
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          category: "indian"
        },
        {
          title: "IT sector leads gains as rupee strengthens against dollar.",
          source: "Business Standard",
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          category: "indian"
        },
      ];
      
      setNews(mockNews);
      setLoading(false);
    };

    fetchNews();
    
    // Refresh news every 30 seconds
    const interval = setInterval(fetchNews, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredNews = news.filter(item => {
    if (activeTab === 'live') return item.category === 'live';
    if (activeTab === 'global') return item.category === 'global';
    if (activeTab === 'indian') return item.category === 'indian';
    return true;
  });

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-foreground mb-8">News</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="live">Live Markets</TabsTrigger>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="indian">Indian News</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card className="bg-card border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Live News Intel</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNews.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 border-l-4 border-primary bg-secondary/30 rounded-r-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-foreground font-medium leading-relaxed">{item.title}</p>
                      <p className="text-primary text-sm mt-1">{item.source}</p>
                    </div>
                    <span className="text-muted-foreground text-sm whitespace-nowrap">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default News;
