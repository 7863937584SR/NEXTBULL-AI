import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTopCryptoMovers } from '@/services/cryptoService';
import { Bitcoin, ArrowDownIcon, ArrowUpIcon, AlertCircleIcon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const CryptoTopMovers = () => {
  const q = useQuery({
    queryKey: ['crypto-top-movers'],
    queryFn: fetchTopCryptoMovers,
    refetchInterval: 30000,
    retry: 1,
  });

  const rows = useMemo(() => q.data || [], [q.data]);

  return (
    <Card className="h-full bg-card/60 backdrop-blur-md border-border/40 overflow-hidden shadow-xl shadow-black/20 flex flex-col">
      <CardHeader className="pb-3 px-4 pt-4 border-b border-border/20 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-amber-500" />
            Crypto Movers
          </CardTitle>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${q.isFetching ? 'bg-success animate-pulse' : 'bg-muted'}`} />
            Live Data (10s)
          </p>
        </div>
        <Link to="/currency">
          <Button variant="ghost" size="sm" className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">
            <Zap className="w-3 h-3 mr-1" />
            Enhanced
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 p-2 overflow-y-auto min-h-[300px] styled-scrollbar">
          {q.isError ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircleIcon className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">API Connection Failed</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  Could not fetch crypto prices right now.
                </p>
              </div>
            </div>
          ) : q.isLoading && rows.length === 0 ? (
            <div className="space-y-2 p-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-secondary/10">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                  <div className="space-y-2 flex flex-col items-end">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 p-1">
              {rows.map((c) => {
                const pct = c.changePct24h;
                const isUp = (pct ?? 0) >= 0;

                return (
                  <div
                    key={c.id}
                    className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border/50 bg-secondary/10 hover:bg-secondary/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-7 h-7 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-foreground tracking-tight truncate">
                          {c.symbol}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                          {c.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-[15px] leading-none mb-1 tabular-nums">
                        ${c.currentPriceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div
                        className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${isUp
                          ? 'text-success bg-success/10'
                          : 'text-destructive bg-destructive/10'
                          }`}
                      >
                        {isUp ? (
                          <ArrowUpIcon className="w-3 h-3 mr-0.5" />
                        ) : (
                          <ArrowDownIcon className="w-3 h-3 mr-0.5" />
                        )}
                        {pct === null ? '--' : `${Math.abs(pct).toFixed(2)}%`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
