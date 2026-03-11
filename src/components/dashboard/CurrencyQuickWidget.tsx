import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchDetailedForexRates, DetailedForexRate } from '@/services/forexService';
import { fetchTopCryptoMovers, CryptoTicker } from '@/services/cryptoService';

interface ForexRate {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
  symbol?: string;
  session?: string;
}

export default function CurrencyQuickWidget() {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch detailed forex data — same query key as other components to share cache
  const { data: forexData, isLoading: forexLoading, refetch: refetchForex } = useQuery({
    queryKey: ['detailed-forex'],
    queryFn: fetchDetailedForexRates,
    refetchInterval: 30000,
    staleTime: 12000,
  });

  // Fetch crypto data
  const { data: cryptoData, isLoading: cryptoLoading, refetch: refetchCrypto } = useQuery({
    queryKey: ['quick-crypto'],
    queryFn: fetchTopCryptoMovers,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const handleRefresh = () => {
    setLastUpdate(new Date());
    refetchForex();
    refetchCrypto();
  };

  // Convert crypto data to forex format for display (memoized)
  const cryptoAsForex: ForexRate[] = useMemo(() => 
    cryptoData?.slice(0, 2).map(crypto => ({
      pair: `${crypto.symbol}/USD`,
      rate: crypto.currentPriceUsd,
      change: crypto.changePct24h ? (crypto.currentPriceUsd * crypto.changePct24h / 100) : 0,
      changePercent: crypto.changePct24h || 0,
    })) || [],
    [cryptoData]
  );

  // Combine forex and crypto data for display (memoized)
  const majorPairs = useMemo(() => forexData?.slice(0, 3) || [], [forexData]);
  const allCurrencies = useMemo(() => [...majorPairs, ...cryptoAsForex].slice(0, 5), [majorPairs, cryptoAsForex]);

  const renderCurrencyPair = (currency: ForexRate | DetailedForexRate, index: number) => {
    const isPositive = currency.change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <div 
        key={`${currency.pair}-${index}`}
        className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:border-green-500/50 ${
          index % 2 === 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-black border-green-500/30'
        }`}
      >
        <div className="flex flex-col">
          <span className="font-mono text-sm text-amber-400 font-bold">{currency.pair}</span>
          <span className="font-mono text-xs text-gray-400">
            {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        <div className="text-right">
          <div className="font-mono text-white font-bold">
            {typeof currency.rate === 'number' ? currency.rate.toFixed(4) : currency.rate}
          </div>
          <div className={`flex items-center gap-1 justify-end text-xs font-mono ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            <Icon className="w-3 h-3" />
            <span>{isPositive ? '+' : ''}{currency.changePercent?.toFixed(2) || '0.00'}%</span>
          </div>
        </div>
      </div>
    );
  };

  if (forexLoading || cryptoLoading) {
    return (
      <Card className="bg-black border-green-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-400 text-sm font-mono flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            CURRENCY PAIRS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-green-500/10 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black border-green-500/30 hover:border-green-500/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-400 text-sm font-mono flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            CURRENCY PAIRS
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-mono">LIVE</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-3">
          {allCurrencies.map((currency, index) => 
            renderCurrencyPair(currency, index)
          )}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-green-500/20">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 text-xs font-mono">
              LIVE MARKETS
            </Badge>
            <span className="text-xs text-gray-400 font-mono">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-cyan-400 hover:bg-cyan-500/20 h-6 px-2"
            disabled={forexLoading || cryptoLoading}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${(forexLoading || cryptoLoading) ? 'animate-spin' : ''}`} />
            <span className="text-xs font-mono">{(forexLoading || cryptoLoading) ? 'UPDATING...' : 'REFRESH'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}