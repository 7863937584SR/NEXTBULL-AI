import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, KeyRound, Sparkles } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ParsedPrompt = {
  side: 'buy' | 'sell';
  asset: 'BTC' | 'ETH';
  quantity: number | null;
  isLot: boolean;
};

const getDeltaEdgeConfig = () => {
  const url = import.meta.env.VITE_DELTA_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_DELTA_SUPABASE_ANON_KEY as string | undefined;
  return { url, anon };
};

const DELTA_TRADE_URLS: Record<ParsedPrompt['asset'], string> = {
  BTC: 'https://india.delta.exchange/app/futures/trade/BTC/BTCINR.html',
  ETH: 'https://india.delta.exchange/app/futures/trade/ETH/ETHINR.html',
};

const DELTA_PRODUCT_SYMBOLS: Record<ParsedPrompt['asset'], string> = {
  BTC: 'BTCINR',
  ETH: 'ETHINR',
};

const parsePrompt = (raw: string): ParsedPrompt | null => {
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  const side: ParsedPrompt['side'] | null = s.includes('sell') || s.includes('short') ? 'sell' : s.includes('buy') || s.includes('long') ? 'buy' : null;
  if (!side) return null;

  const asset: ParsedPrompt['asset'] | null = s.includes('btc') || s.includes('bitcoin') ? 'BTC' : s.includes('eth') || s.includes('ethereum') ? 'ETH' : null;
  if (!asset) return null;

  const isLot = /\blot(s)?\b/.test(s);
  const qtyMatch = s.match(/(\d+(?:\.\d+)?)/);
  const quantity = qtyMatch ? Number(qtyMatch[1]) : null;

  return { side, asset, quantity: Number.isFinite(quantity as number) ? quantity : null, isLot };
};

export default function DeltaPromptTrade() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [environment, setEnvironment] = useState<'global' | 'india'>('india');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  const isDeltaConnected = useMemo(() => {
    try {
      return Boolean(localStorage.getItem('delta_api_key'));
    } catch {
      return false;
    }
  }, []);

  const parsed = useMemo(() => parsePrompt(prompt), [prompt]);

  const onOpenDelta = () => {
    if (!parsed) {
      toast({
        title: 'Invalid prompt',
        description: 'Try: "buy 0.1 btc" or "buy 1 lot eth"',
        variant: 'destructive',
      });
      return;
    }

    const url = DELTA_TRADE_URLS[parsed.asset];

    toast({
      title: 'Redirecting to Delta Exchange',
      description: `Opening ${parsed.asset} market. Please confirm the order on Delta.`,
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const onPlaceOrder = async () => {
    if (!parsed) {
      toast({
        title: 'Invalid prompt',
        description: 'Try: "buy 0.1 btc" or "buy 1 lot eth"',
        variant: 'destructive',
      });
      return;
    }

    if (parsed.quantity === null || parsed.quantity <= 0) {
      toast({
        title: 'Missing quantity',
        description: 'Add a quantity like 0.1 or 1 lot.',
        variant: 'destructive',
      });
      return;
    }

    const apiKeyRaw = localStorage.getItem('delta_api_key');
    const apiSecretRaw = localStorage.getItem('delta_api_secret');
    const apiKey = apiKeyRaw?.trim();
    const apiSecret = apiSecretRaw?.trim();
    if (!apiKey || !apiSecret) {
      toast({
        title: 'Delta not connected',
        description: 'Please connect Delta API key/secret in Connect Broker.',
        variant: 'destructive',
      });
      return;
    }

    if (orderType === 'limit' && !limitPrice.trim()) {
      toast({
        title: 'Missing limit price',
        description: 'Enter a limit price or switch to Market order.',
        variant: 'destructive',
      });
      return;
    }

    setIsPlacing(true);
    try {
      const { url: edgeBaseUrl, anon } = getDeltaEdgeConfig();
      if (!edgeBaseUrl || !anon) {
        throw new Error('Missing VITE_DELTA_SUPABASE_URL / VITE_DELTA_SUPABASE_ANON_KEY for delta-trade deployment.');
      }

      const product_symbol = DELTA_PRODUCT_SYMBOLS[parsed.asset];
      const size = parsed.quantity;

      const res = await fetch(`${String(edgeBaseUrl).replace(/\/$/, '')}/functions/v1/delta-trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
        body: JSON.stringify({
          api_key: apiKey,
          api_secret: apiSecret,
          environment,
          order: {
            product_symbol,
            side: parsed.side,
            size,
            order_type: orderType === 'limit' ? 'limit_order' : 'market_order',
            limit_price: orderType === 'limit' ? String(limitPrice).trim() : undefined,
            time_in_force: 'gtc',
          },
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || (data as any)?.error) {
        const full = {
          status: res.status,
          statusText: res.statusText,
          data,
        };
        const fullStr = (() => {
          try {
            return JSON.stringify(full);
          } catch {
            return String(full);
          }
        })();

        console.error('delta-trade error response (stringified):', fullStr);

        const detailsRaw = (() => {
          try {
            return JSON.stringify(data);
          } catch {
            return '';
          }
        })();

        const details = detailsRaw ? ` | ${detailsRaw}` : '';

        const deltaCode = (data as any)?.data?.data?.error?.code;
        if (deltaCode === 'invalid_api_key') {
          throw new Error(
            'Delta rejected your API key (invalid_api_key). Re-check that you copied the API key from Delta API settings, and that you selected the correct environment (Global vs India).'
          );
        }

        const msg = (data as any)?.error
          ? `${String((data as any).error)} (HTTP ${res.status})${details}`
          : `Order failed (HTTP ${res.status})${details}`;

        throw new Error(msg);
      }

      toast({
        title: 'Order placed',
        description: `Delta order submitted for ${parsed.asset}.`,
      });
    } catch (e) {
      toast({
        title: 'Order failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <Card className="bg-[#131620] border border-white/5 overflow-hidden shadow-xl shadow-black/30 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          Trade by Prompt (Delta)
        </CardTitle>
        <p className="text-xs text-slate-400 mt-1">
          Type a command and we’ll open the matching Delta market in a new tab.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isDeltaConnected ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-amber-400 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-white">Delta not connected</div>
                <div className="text-xs text-slate-400">Connect your Delta API key/secret in Connect Broker to enable prompt trading shortcuts.</div>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => navigate('/connect-broker')}
            >
              Connect Delta
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "buy 0.1 btc" or "sell 1 lot eth"'
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              className="h-10 rounded-md bg-white/5 border border-white/10 text-white text-sm px-3"
            >
              <option value="global">Global</option>
              <option value="india">India</option>
            </select>

            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as any)}
              className="h-10 rounded-md bg-white/5 border border-white/10 text-white text-sm px-3"
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
            </select>
          </div>
        </div>

        {orderType === 'limit' ? (
          <Input
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder='Limit price (e.g. 62000)'
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onOpenDelta}
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Delta
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isPlacing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Place Order
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#131620] border border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Delta Order</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This will place a real order on Delta using your connected API keys.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="text-sm text-slate-300 space-y-1">
                <div>
                  Side: <span className="font-semibold text-white">{parsed?.side?.toUpperCase() ?? '--'}</span>
                </div>
                <div>
                  Asset: <span className="font-semibold text-white">{parsed?.asset ?? '--'}</span>
                </div>
                <div>
                  Size: <span className="font-semibold text-white">{parsed?.quantity ?? '--'}</span>
                </div>
                <div>
                  Type: <span className="font-semibold text-white">{orderType.toUpperCase()}</span>
                </div>
                {orderType === 'limit' ? (
                  <div>
                    Limit: <span className="font-semibold text-white">{limitPrice || '--'}</span>
                  </div>
                ) : null}
                <div>
                  Env: <span className="font-semibold text-white">{environment.toUpperCase()}</span>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel className="border-white/15 bg-white/5 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-emerald-600 hover:bg-emerald-500"
                  onClick={(e) => {
                    e.preventDefault();
                    void onPlaceOrder();
                  }}
                >
                  Confirm & Place
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="text-xs text-slate-500">
          {parsed ? (
            <span>
              Preview: <span className="text-slate-300 font-semibold">{parsed.side.toUpperCase()}</span>{' '}
              <span className="text-slate-300 font-semibold">
                {parsed.quantity === null ? '—' : parsed.quantity}
              </span>{' '}
              <span className="text-slate-300 font-semibold">{parsed.isLot ? 'LOT' : 'UNIT'}</span>{' '}
              <span className="text-slate-300 font-semibold">{parsed.asset}</span>
            </span>
          ) : (
            <span>Tip: include buy/sell + btc/eth + quantity/lot.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
