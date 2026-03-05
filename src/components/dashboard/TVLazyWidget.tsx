import { useEffect, useRef, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface TVLazyWidgetProps {
    src: string;
    config: object;
    height?: number | string;
    className?: string;
    skeletonHeight?: string;
}

// Resolve script URL: if relative /tv-widget path, convert to direct CDN
function resolveTVSrc(src: string): string {
    if (src.startsWith('/tv-widget')) {
        return 'https://s3.tradingview.com' + src.replace(/^\/tv-widget/, '');
    }
    // Already absolute
    if (src.startsWith('http')) return src;
    // Bare path like 'external-embedding/embed-widget-advanced-chart.js'
    return 'https://s3.tradingview.com/' + src;
}

export function TVLazyWidget({ src, config, height = 550, className = "", skeletonHeight = "h-[500px]" }: TVLazyWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [loaded, setLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const mountedRef = useRef(false);

    // Stabilize config: only recalculate when the JSON representation actually changes
    const configJson = useMemo(() => JSON.stringify(config), [config]);

    // Initial Load Intersection Observer
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !loaded) {
                    setLoaded(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loaded]);

    // Mount TradingView Script — only runs when src or config *actually* change
    useEffect(() => {
        if (!loaded || !containerRef.current) return;

        // Skip if already mounted with same params (prevents flicker on parent re-renders)
        if (mountedRef.current && containerRef.current.querySelector('iframe')) return;

        setLoadError(null);
        mountedRef.current = true;

        // Clear previous script and container contents
        containerRef.current.innerHTML = '';

        const innerWidget = document.createElement('div');
        innerWidget.className = 'tradingview-widget-container__widget';
        innerWidget.style.height = typeof height === 'number' ? `${height}px` : height;
        innerWidget.style.width = '100%';
        containerRef.current.appendChild(innerWidget);

        const script = document.createElement('script');
        script.src = resolveTVSrc(src);
        script.type = 'text/javascript';
        script.async = true;
        script.onerror = () => {
            setLoadError('TradingView widget blocked');
        };
        script.innerHTML = configJson;

        containerRef.current.appendChild(script);

        const timeout = window.setTimeout(() => {
            const el = containerRef.current;
            if (!el) return;
            const hasIframe = el.querySelector('iframe');
            if (!hasIframe) setLoadError('TradingView widget blocked');
        }, 6000);

        // Cleanup function to prevent multiple scripts if unmounted rapidly
        return () => {
            window.clearTimeout(timeout);
            mountedRef.current = false;
            if (containerRef.current) containerRef.current.innerHTML = '';
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loaded, src, configJson, height]);

    return (
        <div ref={sentinelRef} className={className} style={{ height: loaded ? height : 'auto' }}>
            {loaded ? (
                <div className="h-full w-full">
                    {loadError ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 gap-4">
                            <div className="p-3 rounded-full bg-amber-500/10">
                                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3l9 16H3L12 3z" /></svg>
                            </div>
                            <div className="text-sm font-semibold text-foreground">Chart loading failed</div>
                            <div className="text-xs text-muted-foreground max-w-[400px]">
                                The TradingView widget could not load. This may be due to an ad-blocker, network restriction, or browser privacy setting.
                            </div>
                            {(() => {
                                try {
                                    const cfg = JSON.parse(configJson);
                                    const sym = cfg.symbol || '';
                                    if (sym) {
                                        return (
                                            <a
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                                                href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(sym)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Open {sym.replace(/^[A-Z]+:/, '')} on TradingView ↗
                                            </a>
                                        );
                                    }
                                } catch {}
                                return (
                                    <a className="text-xs font-semibold text-primary hover:underline" href="https://www.tradingview.com/" target="_blank" rel="noreferrer">Open TradingView ↗</a>
                                );
                            })()}
                        </div>
                    ) : (
                        <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
                    )}
                </div>
            ) : (
                <div className={`space-y-3 p-6 flex flex-col justify-center ${skeletonHeight}`}>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-full w-full mt-3 flex-1" />
                </div>
            )}
        </div>
    );
}
