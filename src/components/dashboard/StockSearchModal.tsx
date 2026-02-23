import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TVLazyWidget } from '@/components/dashboard/TVLazyWidget';
import { Loader2 } from 'lucide-react';

interface StockSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    symbol: string | null;
}

const TVUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

export function StockSearchModal({ isOpen, onClose, symbol }: StockSearchModalProps) {
    const [formattedSymbol, setFormattedSymbol] = useState<string | null>(null);

    useEffect(() => {
        if (symbol) {
            // Very basic heuristic for standardizing symbol formats if the user only typed letters.
            // If they already included a colon (e.g., "NSE:RELIANCE"), use it as is.
            // If they didn't, we can default to NSE or let TradingView's smart search handle it.
            // TradingView advanced chart usually handles raw text like "RELIANCE" well enough.
            const cleanSymbol = symbol.trim().toUpperCase();
            setFormattedSymbol(cleanSymbol);
        } else {
            setFormattedSymbol(null);
        }
    }, [symbol]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[1200px] w-[95vw] h-[85vh] p-0 bg-background/95 border-border/50 backdrop-blur-xl overflow-hidden shadow-2xl">
                {/* Custom Header for the Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card/40">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <span className="text-emerald-500 font-bold text-xs tabular-nums">TV</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-foreground">
                                Advanced Analysis: <span className="text-emerald-400">{formattedSymbol || 'Loading...'}</span>
                            </h2>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Interactive Technical Chart
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="w-full h-[calc(100%-80px)] p-4 relative bg-card/20">
                    {formattedSymbol ? (
                        <TVLazyWidget
                            // Crucial: use key to force unmount/remount when symbol changes while modal is open
                            key={formattedSymbol}
                            src={`${TVUrl}advanced-chart.js`}
                            height="100%"
                            skeletonHeight="h-[100%]"
                            config={{
                                autosize: true,
                                symbol: formattedSymbol,
                                interval: "D",
                                timezone: "Asia/Kolkata",
                                theme: "dark",
                                style: "1",
                                locale: "in",
                                enable_publishing: false,
                                backgroundColor: "rgba(13, 15, 20, 0)", // Transparent background
                                gridColor: "rgba(42, 46, 57, 0.3)",
                                hide_top_toolbar: false,
                                hide_legend: false,
                                save_image: true,
                                hide_volume: false,
                                allow_symbol_change: true,
                                studies: [
                                    "Volume@tv-basicstudies",
                                    "MASimple@tv-basicstudies"
                                ],
                            }}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
