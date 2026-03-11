import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Globe, DollarSign, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchDetailedForexRates, DetailedForexRate } from '@/services/forexService';
import { fetchTopCryptoMovers, CryptoTicker } from '@/services/cryptoService';
import { fetchYahooQuotes } from '@/services/yahooClient';
import { TerminalClock } from '@/components/ui/TerminalClock';

interface CurrencyRate {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  volume: string;
}

interface CommodityPrice {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
}

const EnhancedCurrencyDashboard = () => {

  // Live forex data
  const { data: forexData, isLoading: forexLoading, refetch: refetchForex } = useQuery({
    queryKey: ['detailed-forex'],
    queryFn: fetchDetailedForexRates,
    refetchInterval: 30000,
    staleTime: 8000,
  });

  // Live crypto data
  const { data: cryptoData, isLoading: cryptoLoading, refetch: refetchCrypto } = useQuery({
    queryKey: ['live-crypto'],
    queryFn: fetchTopCryptoMovers,
    refetchInterval: 30000,
    staleTime: 12000,
  });

  // Live commodities data from Yahoo Finance
  const { data: commoditiesData, isLoading: commoditiesLoading } = useQuery({
    queryKey: ['live-commodities'],
    queryFn: async (): Promise<CommodityPrice[]> => {
      const commoditySymbols = [
        { name: 'Gold', symbol: 'XAU/USD', yahooSymbol: 'GC=F', unit: '/oz' },
        { name: 'Silver', symbol: 'XAG/USD', yahooSymbol: 'SI=F', unit: '/oz' },
        { name: 'Crude Oil', symbol: 'WTI', yahooSymbol: 'CL=F', unit: '/bbl' },
        { name: 'Brent Oil', symbol: 'BRENT', yahooSymbol: 'BZ=F', unit: '/bbl' },
        { name: 'Natural Gas', symbol: 'NG', yahooSymbol: 'NG=F', unit: '/MMBtu' },
        { name: 'Copper', symbol: 'XCU/USD', yahooSymbol: 'HG=F', unit: '/MT' },
      ];

      const yahooSymbols = commoditySymbols.map(c => c.yahooSymbol);
      const quotes = await fetchYahooQuotes(yahooSymbols);
      const results: CommodityPrice[] = [];

      for (const c of commoditySymbols) {
        const q = quotes[c.yahooSymbol];
        if (q) {
          results.push({
            name: c.name,
            symbol: c.symbol,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            unit: c.unit,
          });
        }
      }
      return results;
    },
    refetchInterval: 60000,
    staleTime: 15000,
  });

  const handleRefresh = useCallback(() => {
    refetchForex();
    refetchCrypto();
  }, [refetchForex, refetchCrypto]);

  const isLive = !forexLoading && !cryptoLoading && !commoditiesLoading;

  const majorPairs = useMemo(() => 
    forexData?.filter(pair => ['USD/INR', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'].includes(pair.pair)) || [],
    [forexData]
  );

  const exoticPairs = useMemo(() => 
    forexData?.filter(pair => ['USD/SGD', 'USD/HKD', 'USD/CHF'].includes(pair.pair)) || [],
    [forexData]
  );

  const commodities = commoditiesData || [];

  const cryptoCommodities = useMemo((): CommodityPrice[] => 
    cryptoData?.slice(0, 3).map(crypto => ({
      name: crypto.name,
      symbol: crypto.symbol,
      price: crypto.currentPriceUsd,
      change: crypto.changePct24h ? (crypto.currentPriceUsd * crypto.changePct24h / 100) : 0,
      changePercent: crypto.changePct24h || 0,
      unit: ' USD'
    })) || [],
    [cryptoData]
  );

  const allCommodities = useMemo(() => 
    [...commodities, ...cryptoCommodities],
    [commodities, cryptoCommodities]
  );

  const renderCurrencyCard = (currency: DetailedForexRate, isMainPair: boolean = true) => {
    const isPositive = currency.change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <Card key={currency.pair} className={`bg-black border-green-500/30 hover:border-green-500/50 transition-colors ${isMainPair ? 'h-40' : 'h-32'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono text-amber-400">{currency.pair}</CardTitle>
            <Badge className={`text-xs font-mono ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isPositive ? '+' : ''}{currency.changePercent.toFixed(2)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono text-white">{currency.rate.toFixed(4)}</span>
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <Icon className="w-4 h-4" />
              <span className="text-sm font-mono">{isPositive ? '+' : ''}{currency.change.toFixed(4)}</span>
            </div>
          </div>
          {isMainPair && (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="text-gray-400">BID: <span className="text-cyan-400">{currency.bid.toFixed(4)}</span></div>
                <div className="text-gray-400">ASK: <span className="text-cyan-400">{currency.ask.toFixed(4)}</span></div>
                <div className="text-gray-400">HIGH: <span className="text-emerald-400">{currency.high.toFixed(4)}</span></div>
                <div className="text-gray-400">LOW: <span className="text-red-400">{currency.low.toFixed(4)}</span></div>
              </div>
              <div className="text-xs font-mono text-gray-400 text-center border-t border-green-500/20 pt-1">
                VOL: <span className="text-purple-400">{currency.volume}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCommodityCard = (commodity: CommodityPrice) => {
    const isPositive = commodity.change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <Card key={commodity.symbol} className="bg-black border-amber-500/30 hover:border-amber-500/50 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono text-amber-400">{commodity.name}</CardTitle>
            <Badge className={`text-xs font-mono ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isPositive ? '+' : ''}{commodity.changePercent.toFixed(2)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-mono text-white">{commodity.price.toFixed(2)}</span>
              <span className="text-xs text-gray-400 ml-1">{commodity.unit}</span>
            </div>
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <Icon className="w-4 h-4" />
              <span className="text-sm font-mono">{isPositive ? '+' : ''}{commodity.change.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 font-mono">
      {/* Terminal Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-amber-400">CURRENCY & COMMODITIES TERMINAL</h1>
            <div className={`flex items-center gap-2 px-3 py-1 rounded border ${isLive ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className={`text-xs font-bold ${isLive ? 'text-green-400' : 'text-red-400'}`}>
                {isLive ? 'LIVE FEED' : 'OFFLINE'}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30"
              onClick={handleRefresh}
              disabled={forexLoading || cryptoLoading || commoditiesLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(forexLoading || cryptoLoading || commoditiesLoading) ? 'animate-spin' : ''}`} />
              {(forexLoading || cryptoLoading || commoditiesLoading) ? 'UPDATING...' : 'REFRESH'}
            </Button>
          </div>
          <div className="text-right">
            <TerminalClock
              className="text-cyan-400 text-lg block"
              showDate
              dateClassName="text-green-400 text-sm block"
              dateOptions={{ weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }}
            />
          </div>
        </div>
        
        {/* Market Status Banner */}
        <div className="grid grid-cols-4 gap-4 text-xs mb-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-center">
            <div className="text-gray-400">FOREX SESSION</div>
            <div className="text-green-400 font-bold">LONDON OPEN</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 text-center">
            <div className="text-gray-400">VOLATILITY</div>
            <div className="text-blue-400 font-bold">MODERATE</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-center">
            <div className="text-gray-400">SPREAD STATUS</div>
            <div className="text-yellow-400 font-bold">NORMAL</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 text-center">
            <div className="text-gray-400">DATA FEED</div>
            <div className="text-purple-400 font-bold">REAL-TIME</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="major" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-black border border-green-500/30">
          <TabsTrigger value="major" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            <Globe className="w-4 h-4 mr-2" />
            MAJOR PAIRS
          </TabsTrigger>
          <TabsTrigger value="exotic" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <DollarSign className="w-4 h-4 mr-2" />
            EXOTIC PAIRS
          </TabsTrigger>
          <TabsTrigger value="commodities" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Zap className="w-4 h-4 mr-2" />
            COMMODITIES
          </TabsTrigger>
        </TabsList>

        <TabsContent value="major">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-green-500/30 pb-2">
              <Activity className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold text-green-400">MAJOR CURRENCY PAIRS</h2>
              <div className="text-xs text-gray-400">LIVE QUOTES</div>
            </div>
            {forexLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-40 bg-green-500/10 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {majorPairs.map(currency => renderCurrencyCard(currency, true))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="exotic">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-cyan-500/30 pb-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-cyan-400">EXOTIC & CROSS PAIRS</h2>
              <div className="text-xs text-gray-400">LIVE COVERAGE</div>
            </div>
            {forexLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-cyan-500/10 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {exoticPairs.map(currency => renderCurrencyCard(currency, false))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="commodities">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-amber-500/30 pb-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-amber-400">COMMODITIES & CRYPTO</h2>
              <div className="text-xs text-gray-400">LIVE PRICES</div>
            </div>
            {commoditiesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 bg-amber-500/10 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCommodities.map(renderCommodityCard)}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Market Summary & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="bg-black border border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              MARKET MOVERS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-green-500/20">
                <span className="text-gray-400">STRONGEST CURRENCY</span>
                <span className="text-green-400">USD (+0.28%)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-green-500/20">
                <span className="text-gray-400">WEAKEST CURRENCY</span>
                <span className="text-red-400">CHF (-0.20%)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-green-500/20">
                <span className="text-gray-400">MOST VOLATILE</span>
                <span className="text-yellow-400">GBP/USD</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400">BEST PERFORMER</span>
                <span className="text-emerald-400">NATURAL GAS (+2.48%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              ECONOMIC CALENDAR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-blue-500/20">
                <span className="text-gray-400">16:30 USD</span>
                <span className="text-amber-400">Core PCE (High Impact)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-blue-500/20">
                <span className="text-gray-400">18:00 USD</span>
                <span className="text-yellow-400">Fed Speech (Medium)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-blue-500/20">
                <span className="text-gray-400">Tomorrow</span>
                <span className="text-cyan-400">RBI Policy Decision</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400">Thursday</span>
                <span className="text-green-400">US Employment Data</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedCurrencyDashboard;