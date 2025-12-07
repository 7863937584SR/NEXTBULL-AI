import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface Broker {
  id: string;
  name: string;
  logo: string;
  description: string;
  accountTypes: string[];
}

const indianBrokers: Broker[] = [
  {
    id: 'zerodha',
    name: 'Zerodha',
    logo: '🟢',
    description: "India's largest retail stockbroker with low brokerage fees",
    accountTypes: ['Equity', 'F&O', 'Commodity', 'Currency'],
  },
  {
    id: 'upstox',
    name: 'Upstox',
    logo: '🔵',
    description: 'Fast and reliable trading platform with advanced charting',
    accountTypes: ['Equity', 'F&O', 'Commodity', 'Currency'],
  },
  {
    id: 'groww',
    name: 'Groww',
    logo: '🟣',
    description: 'Easy-to-use platform for stocks and mutual funds',
    accountTypes: ['Equity', 'Mutual Funds', 'F&O'],
  },
  {
    id: 'angelone',
    name: 'Angel One',
    logo: '🔴',
    description: 'Full-service broker with research and advisory',
    accountTypes: ['Equity', 'F&O', 'Commodity', 'Currency', 'IPO'],
  },
  {
    id: '5paisa',
    name: '5Paisa',
    logo: '🟠',
    description: 'Discount broker with flat fee structure',
    accountTypes: ['Equity', 'F&O', 'Mutual Funds', 'Insurance'],
  },
  {
    id: 'icici',
    name: 'ICICI Direct',
    logo: '🏦',
    description: 'Bank-backed broker with integrated 3-in-1 account',
    accountTypes: ['Equity', 'F&O', 'Commodity', 'Currency', 'Bonds'],
  },
];

const ConnectBroker = () => {
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [clientId, setClientId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedBrokers, setConnectedBrokers] = useState<string[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleConnect = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to connect a broker.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!selectedBroker || !apiKey || !apiSecret || !clientId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    // Simulate API connection
    await new Promise(resolve => setTimeout(resolve, 2000));

    setConnectedBrokers(prev => [...prev, selectedBroker]);
    setApiKey('');
    setApiSecret('');
    setClientId('');
    setSelectedBroker(null);
    
    toast({
      title: "Broker connected!",
      description: `Your ${indianBrokers.find(b => b.id === selectedBroker)?.name} account has been connected successfully.`,
    });

    setIsConnecting(false);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Connect Broker</h1>
          <p className="text-muted-foreground">
            Connect your trading account to enable live trading and portfolio tracking
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {indianBrokers.map((broker) => {
            const isConnected = connectedBrokers.includes(broker.id);
            const isSelected = selectedBroker === broker.id;
            
            return (
              <Card
                key={broker.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : isConnected
                    ? 'border-success bg-success/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => !isConnected && setSelectedBroker(broker.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{broker.logo}</span>
                      <div>
                        <CardTitle className="text-lg">{broker.name}</CardTitle>
                        <CardDescription>{broker.description}</CardDescription>
                      </div>
                    </div>
                    {isConnected && (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {broker.accountTypes.map((type) => (
                      <span
                        key={type}
                        className="px-2 py-1 text-xs bg-secondary rounded-md text-muted-foreground"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedBroker && !connectedBrokers.includes(selectedBroker) && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Connect {indianBrokers.find(b => b.id === selectedBroker)?.name}
              </CardTitle>
              <CardDescription>
                Enter your API credentials to connect your live trading account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Live Account Connection</p>
                  <p className="text-muted-foreground">
                    This will connect your real trading account. Ensure you have the correct API permissions enabled.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID / User ID</Label>
                  <Input
                    id="clientId"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Enter your client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Enter your API secret"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting ? 'Connecting...' : 'Connect Live Account'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedBroker(null)}
                >
                  Cancel
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                <ExternalLink className="w-4 h-4" />
                <span>
                  Need help? Visit your broker's API documentation for setup instructions.
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConnectBroker;
