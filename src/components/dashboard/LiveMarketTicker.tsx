import { useQuery } from '@tanstack/react-query';
import { fetchMarketIndices } from '@/services/nseService';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const LiveMarketTicker = () => {
    const { data: indices, isLoading, isError } = useQuery({
        queryKey: ['nse-indices'],
        queryFn: fetchMarketIndices,
        refetchInterval: false,
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
        <div className="w-full bg-[#080808] border-y border-emerald-500/10 overflow-hidden flex items-center group/ticker">
            <div className="flex animate-marquee group-hover/ticker:[animation-play-state:paused] whitespace-nowrap py-2.5 min-w-full">
                {filteredIndices.map((idx: any, i) => {
                    const isPositive = idx.percentChange >= 0;
                    return (
                        <div key={`${idx.index}-${i}`} className="flex items-center mx-6 gap-2.5">
                            <span className="text-[11px] font-bold text-gray-300 tracking-wider font-mono">{idx.index}</span>
                            <span className="text-[11px] font-mono font-semibold text-white/90 tabular-nums">
                                {idx.last.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`flex items-center text-[11px] font-mono font-bold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isPositive ? <ArrowUpIcon className="w-3 h-3 mr-0.5" strokeWidth={3} /> : <ArrowDownIcon className="w-3 h-3 mr-0.5" strokeWidth={3} />}
                                {isPositive ? '+' : '-'}{Math.abs(idx.percentChange).toFixed(2)}%
                            </span>
                            <span className="text-gray-700 text-xs">│</span>
                        </div>
                    );
                })}
                {/* Duplicate for seamless scrolling */}
                {filteredIndices.map((idx: any, i) => {
                    const isPositive = idx.percentChange >= 0;
                    return (
                        <div key={`${idx.index}-copy-${i}`} className="flex items-center mx-6 gap-2.5">
                            <span className="text-[11px] font-bold text-gray-300 tracking-wider font-mono">{idx.index}</span>
                            <span className="text-[11px] font-mono font-semibold text-white/90 tabular-nums">
                                {idx.last.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`flex items-center text-[11px] font-mono font-bold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isPositive ? <ArrowUpIcon className="w-3 h-3 mr-0.5" strokeWidth={3} /> : <ArrowDownIcon className="w-3 h-3 mr-0.5" strokeWidth={3} />}
                                {isPositive ? '+' : '-'}{Math.abs(idx.percentChange).toFixed(2)}%
                            </span>
                            <span className="text-gray-700 text-xs">│</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
