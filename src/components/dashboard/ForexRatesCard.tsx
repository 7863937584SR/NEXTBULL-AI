import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchForexRates, ForexRateRow } from '@/services/forexService';
import { DollarSign, ArrowDownIcon, ArrowUpIcon, AlertCircleIcon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type RateWithDelta = ForexRateRow & { deltaPct: number | null };

export const ForexRatesCard = () => {
  const q = useQuery({
    queryKey: ['forex-rates-usd'],
    queryFn: fetchForexRates,
    refetchInterval: 60000,
    retry: 1,
  });

  const prevRef = useRef<Record<string, number>>({});
  const [rows, setRows] = useState<RateWithDelta[]>([]);

  useEffect(() => {
    if (!q.data) return;

    const next: RateWithDelta[] = q.data
      .slice()
      .sort((a, b) => {
        if (a.pair === 'USD/INR') return -1;
        if (b.pair === 'USD/INR') return 1;
        return a.pair.localeCompare(b.pair);
      })
      .map((r) => {
        const prev = prevRef.current[r.pair];
        const deltaPct = typeof prev === 'number' && prev !== 0 ? ((r.rate - prev) / prev) * 100 : null;
        return { ...r, deltaPct };
      });

    const nextPrev: Record<string, number> = { ...prevRef.current };
    for (const r of q.data) nextPrev[r.pair] = r.rate;
    prevRef.current = nextPrev;

    setRows(next);
  }, [q.data]);

  const showRows = useMemo(() => rows, [rows]);

  return (
    <Card className="h-full bg-card/60 backdrop-blur-md border-border/40 overflow-hidden shadow-xl shadow-black/20 flex flex-col">
      <CardHeader className="pb-3 px-4 pt-4 border-b border-border/20 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-400" />
            Forex (USD)
          </CardTitle>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${q.isFetching ? 'bg-success animate-pulse' : 'bg-muted'}`} />
            Live Data (10s)
          </p>
        </div>
        <Link to="/currency">
          <Button variant="ghost" size="sm" className="text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
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
                  Could not fetch forex rates right now.
                </p>
              </div>
            </div>
          ) : q.isLoading && showRows.length === 0 ? (
            <div className="space-y-2 p-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-secondary/10">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
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
              {showRows.map((r) => {
                const isUp = (r.deltaPct ?? 0) >= 0;
                const quote = r.pair.split('/')[1] || '';

                return (
                  <div
                    key={r.pair}
                    className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border/50 bg-secondary/10 hover:bg-secondary/30 transition-all duration-200"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-foreground tracking-tight">{r.pair}</h4>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {quote ? `Quote: ${quote}` : 'Rate'}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-[15px] leading-none mb-1 tabular-nums">
                        {r.rate.toLocaleString('en-US', { minimumFractionDigits: quote === 'JPY' ? 2 : 4, maximumFractionDigits: quote === 'JPY' ? 4 : 6 })}
                      </span>
                      <div
                        className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${isUp
                          ? 'text-success bg-success/10'
                          : 'text-destructive bg-destructive/10'
                          }`}
                      >
                        {r.deltaPct === null ? null : isUp ? (
                          <ArrowUpIcon className="w-3 h-3 mr-0.5" />
                        ) : (
                          <ArrowDownIcon className="w-3 h-3 mr-0.5" />
                        )}
                        {r.deltaPct === null ? '--' : `${Math.abs(r.deltaPct).toFixed(3)}%`}
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
