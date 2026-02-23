import { useQuery } from '@tanstack/react-query';
import { fetchMarketIndices } from '@/services/nseService';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const LiveMarketTicker = () => {
    const { data: indices, isLoading, isError } = useQuery({
        queryKey: ['nse-indices'],
        queryFn: fetchMarketIndices,
        refetchInterval: 5000,
        retry: 1,
    });

    if (isLoading) {
        return (
            <div className="w-full h-10 bg-secondary/30 border-y border-border/40 flex items-center px-4 overflow-hidden">
                <Skeleton className="h-4 w-32 mr-8" />
                <Skeleton className="h-4 w-32 mr-8" />
                <Skeleton className="h-4 w-32" />
            </div>
        );
    }

    if (isError || !indices || indices.length === 0) {
        // Fail silently or show subtle error; ticker should not disrupt UI heavily
        return null;
    }

    // Filter specific key indices we want to highlight. NSE returns many.
    const keyIndices = ['NIFTY 50', 'NIFTY BANK', 'NIFTY IT', 'NIFTY FIN SERVICE', 'NIFTY AUTO'];
    const filteredIndices = indices.filter((idx: any) => keyIndices.includes(idx.index));

    return (
        <div className="w-full bg-secondary/20 border-y border-border/40 overflow-hidden flex items-center group/ticker">
            <div className="flex animate-marquee group-hover/ticker:[animation-play-state:paused] whitespace-nowrap py-2 min-w-full">
                {filteredIndices.map((idx: any, i) => {
                    const isPositive = idx.percentChange >= 0;
                    return (
                        <div key={`${idx.index}-${i}`} className="flex items-center mx-6 gap-2">
                            <span className="text-xs font-bold text-foreground opacity-90">{idx.index}</span>
                            <span className="text-xs font-mono font-medium">{idx.last.toLocaleString('en-IN')}</span>
                            <span className={`flex items-center text-xs font-mono font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                                {isPositive ? <ArrowUpIcon className="w-3 h-3 mr-0.5" /> : <ArrowDownIcon className="w-3 h-3 mr-0.5" />}
                                {Math.abs(idx.percentChange).toFixed(2)}%
                            </span>
                        </div>
                    );
                })}
                {/* Duplicate for seamless scrolling */}
                {filteredIndices.map((idx: any, i) => {
                    const isPositive = idx.percentChange >= 0;
                    return (
                        <div key={`${idx.index}-copy-${i}`} className="flex items-center mx-6 gap-2">
                            <span className="text-xs font-bold text-foreground opacity-90">{idx.index}</span>
                            <span className="text-xs font-mono font-medium">{idx.last.toLocaleString('en-IN')}</span>
                            <span className={`flex items-center text-xs font-mono font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                                {isPositive ? <ArrowUpIcon className="w-3 h-3 mr-0.5" /> : <ArrowDownIcon className="w-3 h-3 mr-0.5" />}
                                {Math.abs(idx.percentChange).toFixed(2)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
