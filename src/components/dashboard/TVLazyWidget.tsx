import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface TVLazyWidgetProps {
    src: string;
    config: object;
    height?: number | string;
    className?: string;
    skeletonHeight?: string;
}

export function TVLazyWidget({ src, config, height = 550, className = "", skeletonHeight = "h-[500px]" }: TVLazyWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [loaded, setLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

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

    // Mount/Remount TradingView Script
    useEffect(() => {
        if (!loaded || !containerRef.current) return;

        setLoadError(null);

        // Clear previous script and container contents completely on re-render (refreshKey change)
        containerRef.current.innerHTML = '';

        const innerWidget = document.createElement('div');
        innerWidget.className = 'tradingview-widget-container__widget';
        innerWidget.style.height = typeof height === 'number' ? `${height}px` : height;
        innerWidget.style.width = '100%';
        containerRef.current.appendChild(innerWidget);

        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        script.async = true;
        script.onerror = () => {
            setLoadError('TradingView widget blocked');
        };
        // Deep clone config to avoid mutating original, then stringify
        script.innerHTML = JSON.stringify(config);

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
            if (containerRef.current) containerRef.current.innerHTML = '';
        }
    }, [loaded, src, config, height]);

    return (
        <div ref={sentinelRef} className={className} style={{ height: loaded ? height : 'auto' }}>
            {loaded ? (
                <div className="h-full w-full">
                    {loadError ? (
                        <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 gap-3">
                            <div className="text-sm font-semibold text-foreground">Widget unavailable</div>
                            <div className="text-xs text-muted-foreground max-w-[360px]">
                                TradingView resources are blocked (403) on this network/browser. You can open the chart directly on TradingView.
                            </div>
                            <a
                                className="text-xs font-semibold text-primary hover:underline"
                                href="https://www.tradingview.com/"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Open TradingView
                            </a>
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
