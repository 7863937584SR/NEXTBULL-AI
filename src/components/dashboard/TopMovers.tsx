import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTopGainers, fetchTopLosers } from '@/services/nseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpIcon, ArrowDownIcon, RefreshCwIcon, AlertCircleIcon, TrendingUpIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const TopMovers = () => {
    const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');
    const [isAutoRefresh, setIsAutoRefresh] = useState(true);

    const gainersQuery = useQuery({
        queryKey: ['nse-gainers'],
        queryFn: fetchTopGainers,
        refetchInterval: isAutoRefresh ? 5000 : false,
        retry: 1,
    });

    const losersQuery = useQuery({
        queryKey: ['nse-losers'],
        queryFn: fetchTopLosers,
        refetchInterval: isAutoRefresh ? 5000 : false,
        retry: 1,
    });

    const isLoading = gainersQuery.isLoading || losersQuery.isLoading;
    const isError = gainersQuery.isError || losersQuery.isError;
    const activeData = activeTab === 'gainers' ? gainersQuery.data : losersQuery.data;

    // Format big numbers like volume/value into something readable (Cr, L)
    const formatNumber = (num: number) => {
        if (!num) return '0';
        if (num >= 10000000) return (num / 10000000).toFixed(2) + 'Cr';
        if (num >= 100000) return (num / 100000).toFixed(2) + 'L';
        return num.toLocaleString('en-IN');
    };

    return (
        <Card className="h-full bg-card/60 backdrop-blur-md border-border/40 overflow-hidden shadow-xl shadow-black/20 flex flex-col">
            <CardHeader className="pb-3 px-4 pt-4 border-b border-border/20 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5 text-primary" />
                        NIFTY 50 Movers
                    </CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAutoRefresh ? 'bg-success animate-pulse' : 'bg-muted'}`} />
                        Live Data {isAutoRefresh ? '(5s update)' : '(paused)'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={isAutoRefresh ? 'default' : 'secondary'}
                        className={`text-[10px] px-2 py-0.5 cursor-pointer transition-colors ${isAutoRefresh ? 'bg-primary/20 text-primary hover:bg-primary/30' : ''}`}
                        onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                    >
                        Auto {isAutoRefresh ? 'ON' : 'OFF'}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        onClick={() => {
                            gainersQuery.refetch();
                            losersQuery.refetch();
                        }}
                        disabled={isLoading || isAutoRefresh}
                    >
                        <RefreshCwIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full flex-1 flex flex-col">
                    <div className="px-4 py-2 border-b border-border/20 bg-secondary/10">
                        <TabsList className="w-full grid grid-cols-2 h-9 bg-secondary/40 p-1">
                            <TabsTrigger
                                value="gainers"
                                className="text-xs font-semibold data-[state=active]:bg-success/20 data-[state=active]:text-success data-[state=active]:shadow-sm transition-all"
                            >
                                Top Gainers
                            </TabsTrigger>
                            <TabsTrigger
                                value="losers"
                                className="text-xs font-semibold data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive data-[state=active]:shadow-sm transition-all"
                            >
                                Top Losers
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 p-2 overflow-y-auto min-h-[300px] styled-scrollbar">
                        {isError ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-3">
                                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <AlertCircleIcon className="w-5 h-5 text-destructive" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">API Connection Failed</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                        Could not fetch data from NSE. Make sure CORS proxy is running.
                                    </p>
                                </div>
                            </div>
                        ) : isLoading && !activeData ? (
                            <div className="space-y-2 p-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-secondary/10">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-3 w-12" />
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
                                {activeData?.slice(0, 10).map((stock) => {
                                    const isPositive = stock.netPrice >= 0; // Or standard % change calc
                                    const percentChange = ((stock.ltp - stock.previousPrice) / stock.previousPrice) * 100;
                                    const isGainer = percentChange >= 0;

                                    return (
                                        <div
                                            key={stock.symbol}
                                            className="group flex flex-col p-3 rounded-xl border border-transparent hover:border-border/50 bg-secondary/10 hover:bg-secondary/30 transition-all duration-200"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
                                                        {stock.symbol}
                                                    </h4>
                                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                        Vol: {formatNumber(stock.tradeInfo?.tradedVolume || 0)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-mono font-bold text-[15px] leading-none mb-1">
                                                        ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    <div className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0
                            ${isGainer ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}
                                                    >
                                                        {isGainer ? <ArrowUpIcon className="w-3 h-3 mr-0.5" /> : <ArrowDownIcon className="w-3 h-3 mr-0.5" />}
                                                        {Math.abs(percentChange).toFixed(2)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
};
