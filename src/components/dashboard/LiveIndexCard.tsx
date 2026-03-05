import { useQuery } from '@tanstack/react-query';
import { fetchMarketIndices } from '@/services/nseService';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveIndexCardProps {
    indexName: string;
    refreshInterval?: number;
}

export function LiveIndexCard({ indexName, refreshInterval = 5000 }: LiveIndexCardProps) {
    const { data: indices, isLoading, isError } = useQuery({
        queryKey: ['nse-indices', 'live-card'],
        queryFn: fetchMarketIndices,
        refetchInterval: 30000,
        retry: 3,
    });

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-20 bg-gray-800" />
                    <Skeleton className="h-5 w-5 rounded bg-gray-800" />
                </div>
                <Skeleton className="h-7 w-28 bg-gray-800" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-14 bg-gray-800" />
                    <Skeleton className="h-4 w-12 rounded bg-gray-800" />
                </div>
            </div>
        );
    }

    if (isError || !indices) {
        return (
            <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mb-2">
                    <Minus className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-[11px] font-mono text-red-400/80">OFFLINE</p>
                <p className="text-[10px] text-gray-600 font-mono mt-0.5">{indexName}</p>
            </div>
        );
    }

    const indexData = indices.find((idx: any) => idx.index === indexName);

    if (!indexData) {
        return (
            <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center mb-2">
                    <Minus className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-[11px] font-mono text-gray-500">NO DATA</p>
                <p className="text-[10px] text-gray-600 font-mono mt-0.5">{indexName}</p>
            </div>
        );
    }

    const isPositive = indexData.percentChange >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const accentColor = isPositive ? 'emerald' : 'red';

    return (
        <div className="relative group">
            {/* Subtle top accent line */}
            <div className={cn(
                "absolute top-0 left-2 right-2 h-[1px]",
                isPositive
                    ? "bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"
                    : "bg-gradient-to-r from-transparent via-red-500/40 to-transparent"
            )} />

            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold tracking-[0.15em] text-gray-300 font-mono uppercase truncate pr-2">
                    {indexData.index}
                </h3>
                <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                    isPositive
                        ? "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20"
                        : "bg-red-500/10 text-red-400 group-hover:bg-red-500/20"
                )}>
                    <TrendIcon className="w-3 h-3" />
                </div>
            </div>

            {/* Price */}
            <div className={cn(
                "text-xl sm:text-2xl font-black tabular-nums font-mono tracking-tight mb-2 transition-colors leading-none",
                isPositive ? "text-emerald-400" : "text-red-400"
            )}>
                {indexData.last.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {/* Change row */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <div className={cn(
                    "flex items-center text-[11px] font-bold font-mono",
                    isPositive ? "text-emerald-500" : "text-red-500"
                )}>
                    {isPositive
                        ? <ArrowUpIcon className="w-3 h-3 mr-0.5 flex-shrink-0" strokeWidth={3} />
                        : <ArrowDownIcon className="w-3 h-3 mr-0.5 flex-shrink-0" strokeWidth={3} />
                    }
                    <span className="tabular-nums">
                        {Math.abs(indexData.variation).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
                <span className={cn(
                    "tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded font-mono",
                    isPositive
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/15 text-red-400 border border-red-500/20"
                )}>
                    {isPositive ? '+' : '-'}{Math.abs(indexData.percentChange).toFixed(2)}%
                </span>
            </div>
        </div>
    );
}
