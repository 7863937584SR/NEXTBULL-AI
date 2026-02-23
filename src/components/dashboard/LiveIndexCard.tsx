import { useQuery } from '@tanstack/react-query';
import { fetchMarketIndices } from '@/services/nseService';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveIndexCardProps {
    indexName: string;
    refreshInterval?: number; // ms
}

export function LiveIndexCard({ indexName, refreshInterval = 5000 }: LiveIndexCardProps) {
    const { data: indices, isLoading, isError } = useQuery({
        queryKey: ['nse-indices', 'live-card'],
        queryFn: fetchMarketIndices,
        refetchInterval: refreshInterval,
        retry: 3,
    });

    if (isLoading) {
        return (
            <Card className="bg-card/40 border-border/50 h-[140px] p-5 flex flex-col justify-between overflow-hidden relative">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <div>
                    <Skeleton className="h-8 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </Card>
        );
    }

    if (isError || !indices) {
        return (
            <Card className="bg-destructive/10 border-destructive/20 h-[140px] p-5 flex flex-col justify-center items-center text-center">
                <p className="text-sm font-medium text-destructive mb-1">Failed to Load Live Data</p>
                <p className="text-xs text-muted-foreground">{indexName}</p>
            </Card>
        );
    }

    const indexData = indices.find((idx: any) => idx.index === indexName);

    if (!indexData) {
        return (
            <Card className="bg-card/40 border-border/50 h-[140px] p-5 flex flex-col justify-center items-center text-center">
                <p className="text-sm font-medium text-muted-foreground">Index Not Found</p>
                <p className="text-xs text-muted-foreground">{indexName}</p>
            </Card>
        );
    }

    const isPositive = indexData.percentChange >= 0;

    return (
        <Card className={cn(
            "h-[140px] p-5 flex flex-col justify-between overflow-hidden relative group transition-all duration-300",
            "bg-card/60 border-border/50 hover:bg-card/80 hover:border-border/80",
            // Subtle glowing border effect based on market direction
            isPositive ? "hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)] hover:border-emerald-500/30"
                : "hover:shadow-[0_0_15px_-3px_rgba(239,68,68,0.15)] hover:border-red-500/30"
        )}>
            {/* Background Grain/Texture (subtle) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="flex justify-between items-start relative z-10">
                <h3 className="text-sm font-bold tracking-tight text-foreground/90 uppercase">{indexData.index}</h3>
                <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                    isPositive ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20"
                        : "bg-red-500/10 text-red-500 group-hover:bg-red-500/20"
                )}>
                    <Activity className="w-4 h-4" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black tracking-tighter tabular-nums drop-shadow-sm">
                        {indexData.last.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                <div className={cn(
                    "flex items-center text-xs font-bold font-mono tracking-tight",
                    isPositive ? "text-emerald-500" : "text-red-500"
                )}>
                    {isPositive ? <ArrowUpIcon className="w-3.5 h-3.5 mr-1" strokeWidth={3} /> : <ArrowDownIcon className="w-3.5 h-3.5 mr-1" strokeWidth={3} />}
                    <span className="tabular-nums drop-shadow-sm">
                        {Math.abs(indexData.variation).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="mx-1.5 opacity-50 font-sans">•</span>
                    <span className="tabular-nums drop-shadow-sm bg-background/50 px-1.5 py-0.5 rounded-md border border-current/10">
                        {Math.abs(indexData.percentChange).toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Live Indicator Dot */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500/80">Live</span>
            </div>
        </Card>
    );
}
