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
            "h-[150px] p-5 flex flex-col justify-between overflow-hidden relative group transition-all duration-500 cursor-default",
            "bg-gradient-to-br from-[#121622] to-[#0A0D15] border-border/40 hover:-translate-y-1",
            isPositive
                ? "hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] hover:border-emerald-500/50 ring-1 ring-inset ring-transparent hover:ring-emerald-500/20"
                : "hover:shadow-[0_10px_40px_-10px_rgba(239,68,68,0.3)] hover:border-red-500/50 ring-1 ring-inset ring-transparent hover:ring-red-500/20"
        )}>
            {/* Background Animated Gradient Glow */}
            <div className={cn(
                "absolute -top-12 -right-12 w-40 h-40 rounded-full blur-[40px] opacity-10 transition-opacity duration-700 group-hover:opacity-30",
                isPositive ? "bg-emerald-500" : "bg-red-500"
            )} />

            {/* Background Grain/Texture (subtle) */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="flex justify-between items-start relative z-10">
                <h3 className="text-[13px] font-black tracking-wider text-foreground/80 uppercase">
                    {indexData.index}
                </h3>
                <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm",
                    isPositive
                        ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-red-500/10 text-red-500 group-hover:bg-red-500/20 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                )}>
                    <Activity className="w-4 h-4" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col gap-1.5 mt-2">
                <div className="flex items-baseline gap-2">
                    <span className={cn(
                        "text-3xl font-black tracking-tighter tabular-nums drop-shadow-md transition-colors",
                        isPositive ? "text-emerald-400 group-hover:text-emerald-400" : "text-red-400 group-hover:text-red-400"
                    )}>
                        {indexData.last.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                <div className={cn(
                    "flex items-center text-[13px] font-bold font-mono tracking-tight",
                    isPositive ? "text-emerald-500" : "text-red-500"
                )}>
                    {isPositive ? <ArrowUpIcon className="w-4 h-4 mr-0.5" strokeWidth={3.5} /> : <ArrowDownIcon className="w-4 h-4 mr-0.5" strokeWidth={3.5} />}
                    <span className="tabular-nums drop-shadow-sm">
                        {Math.abs(indexData.variation).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="mx-2 opacity-30 font-sans">•</span>
                    <span className={cn(
                        "tabular-nums px-2 py-0.5 rounded-md border shadow-sm transition-colors",
                        isPositive
                            ? "bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30"
                            : "bg-red-500/10 border-red-500/20 group-hover:bg-red-500/20 group-hover:border-red-500/30"
                    )}>
                        {Math.abs(indexData.percentChange).toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Live Indicator Dot */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="relative flex h-2 w-2">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isPositive ? "bg-emerald-400" : "bg-red-400")}></span>
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", isPositive ? "bg-emerald-500" : "bg-red-500")}></span>
                </span>
                <span className={cn("text-[9px] font-black uppercase tracking-widest", isPositive ? "text-emerald-500/80" : "text-red-500/80")}>Live</span>
            </div>
        </Card>
    );
}
