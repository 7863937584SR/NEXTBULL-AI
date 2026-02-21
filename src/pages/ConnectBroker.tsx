import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Shield, CheckCircle2, AlertCircle, Loader2, Unplug } from 'lucide-react';

interface BrokerConnection {
  broker: string;
  is_active: boolean;
  broker_user_id: string | null;
  user_name: string | null;
  email: string | null;
  token_expiry: string | null;
}

const ConnectBroker = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to connect your broker account.",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [user, loading, navigate, toast]);

  // Fetch existing connections
  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase.functions.invoke('upstox-auth', {
        body: { action: 'get_status' },
      });
      setConnections(data?.connections || []);
    } catch (err) {
      console.error('Failed to fetch broker status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle OAuth callback with auth code
  useEffect(() => {
    const code = searchParams.get('code');
    if (!code || !user) return;

    const storedApiKey = localStorage.getItem('upstox_api_key');
    const storedApiSecret = localStorage.getItem('upstox_api_secret');

    if (!storedApiKey || !storedApiSecret) {
      toast({
        title: "Missing credentials",
        description: "API credentials not found. Please try connecting again.",
        variant: "destructive",
      });
      navigate('/connect-broker', { replace: true });
      return;
    }

    const exchangeToken = async () => {
      setIsConnecting(true);
      try {
        const redirectUri = `${window.location.origin}/connect-broker`;
        const { data, error } = await supabase.functions.invoke('upstox-auth', {
          body: {
            action: 'exchange_token',
            code,
            api_key: storedApiKey,
            api_secret: storedApiSecret,
            redirect_uri: redirectUri,
          },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        // Clean up stored credentials
        localStorage.removeItem('upstox_api_key');
        localStorage.removeItem('upstox_api_secret');

        toast({
          title: "Upstox connected!",
          description: `Welcome, ${data.user_name || 'trader'}! Your account is now linked.`,
        });

        await fetchStatus();
        navigate('/connect-broker', { replace: true });
      } catch (err) {
        console.error('Token exchange error:', err);
        toast({
          title: "Connection failed",
          description: err instanceof Error ? err.message : "Failed to connect Upstox",
          variant: "destructive",
        });
      } finally {
        setIsConnecting(false);
      }
    };

    exchangeToken();
  }, [searchParams, user]);

  const handleUpstoxLogin = async () => {
    if (!apiKey || !apiSecret) {
      toast({
        title: "Missing credentials",
        description: "Please enter your Upstox API Key and API Secret.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/connect-broker`;

      // Store credentials temporarily for the OAuth callback
      localStorage.setItem('upstox_api_key', apiKey);
      localStorage.setItem('upstox_api_secret', apiSecret);

      const { data, error } = await supabase.functions.invoke('upstox-auth', {
        body: { action: 'get_login_url', api_key: apiKey, redirect_uri: redirectUri },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      // Redirect to Upstox login
      window.location.href = data.login_url;
    } catch (err) {
      console.error('Login URL error:', err);
      localStorage.removeItem('upstox_api_key');
      localStorage.removeItem('upstox_api_secret');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to start login",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (broker: string) => {
    try {
      await supabase.functions.invoke('upstox-auth', {
        body: { action: 'disconnect', broker },
      });
      toast({ title: "Disconnected", description: `${broker} account has been disconnected.` });
      await fetchStatus();
    } catch (err) {
      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isUpstoxConnected = connections.some(c => c.broker === 'upstox' && c.is_active);
  const upstoxConnection = connections.find(c => c.broker === 'upstox' && c.is_active);

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Connect Broker</h1>
          <p className="text-muted-foreground">
            Link your Upstox trading account via OAuth for live trading and portfolio tracking
          </p>
        </div>

        {/* Processing OAuth callback */}
        {searchParams.get('code') && isConnecting && (
          <Card className="border-primary mb-6">
            <CardContent className="p-6 flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div>
                <p className="font-semibold text-foreground">Connecting your Upstox account...</p>
                <p className="text-sm text-muted-foreground">Please wait while we verify your credentials.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connected broker card */}
        {isUpstoxConnected && upstoxConnection && (
          <Card className="border-success bg-success/5 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔵</span>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Upstox
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </CardTitle>
                    <CardDescription>
                      Connected as {upstoxConnection.user_name || upstoxConnection.email || upstoxConnection.broker_user_id || 'trader'}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDisconnect('upstox')}>
                  <Unplug className="w-4 h-4 mr-1" />
                  Disconnect
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['Equity', 'F&O', 'Commodity', 'Currency'].map(type => (
                  <span key={type} className="px-2 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
                    {type}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connect form */}
        {!isUpstoxConnected && !searchParams.get('code') && (
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔵</span>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Connect Upstox
                  </CardTitle>
                  <CardDescription>
                    Enter your Upstox API credentials to link your live trading account via OAuth
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Setup Instructions</p>
                  <ol className="text-muted-foreground list-decimal list-inside space-y-1 mt-1">
                    <li>Go to <a href="https://account.upstox.com/developer/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">Upstox Developer Console</a></li>
                    <li>Create a new app with redirect URL: <code className="text-xs bg-secondary px-1 py-0.5 rounded">{window.location.origin}/connect-broker</code></li>
                    <li>Copy the API Key and API Secret below</li>
                  </ol>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key (Client ID)</Label>
                  <Input
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Upstox API key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Enter your Upstox API secret"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button onClick={handleUpstoxLogin} disabled={isConnecting || !apiKey || !apiSecret}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    'Connect via Upstox OAuth'
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                <ExternalLink className="w-4 h-4" />
                <a href="https://upstox.com/developer/api-documentation/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Upstox API Documentation
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConnectBroker;
