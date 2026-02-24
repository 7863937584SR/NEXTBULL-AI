import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, TrendingUp, BarChart3, IndianRupee, Bitcoin, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Comprehensive live market data — all powered by TradingView widgets.
 * 
 * PERFORMANCE: Each widget section uses Intersection Observer to load
 * its TradingView script ONLY when scrolled into view. This avoids
 * loading 9 heavy scripts simultaneously on page mount.
 */

const TV = 'https://s3.tradingview.com/external-embedding/embed-widget-';

/* ── Lazy-loaded TradingView widget with IntersectionObserver ── */
function LazyWidget({ src, config, height = 550 }: { src: string; config: object; height?: number }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [loaded, setLoaded] = useState(false);

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
            { rootMargin: '200px' } // Start loading 200px before visible
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loaded]);

    useEffect(() => {
        if (!loaded || !containerRef.current) return;
        containerRef.current.innerHTML = '';

        const innerWidget = document.createElement('div');
        innerWidget.className = 'tradingview-widget-container__widget';
        innerWidget.style.height = 'calc(100% - 32px)';
        innerWidget.style.width = '100%';
        containerRef.current.appendChild(innerWidget);

        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify(config);
        containerRef.current.appendChild(script);
    }, [loaded, src, config]);

    return (
        <div ref={sentinelRef}>
            {loaded ? (
                <div ref={containerRef} className="tradingview-widget-container" />
            ) : (
                <div className="space-y-3 p-6" style={{ height }}>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-3 mt-4">
                        <Skeleton className="h-24 flex-1" />
                        <Skeleton className="h-24 flex-1" />
                        <Skeleton className="h-24 flex-1" />
                    </div>
                    <Skeleton className="h-32 w-full mt-3" />
                    <Skeleton className="h-4 w-2/3 mt-3" />
                    <Skeleton className="h-4 w-1/3" />
                </div>
            )}
        </div>
    );
}

/* ── Section card wrapper ── */
function SectionCard({
    children, title, subtitle, icon: Icon, gradientFrom, gradientVia, borderVia,
}: {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    gradientFrom: string;
    gradientVia: string;
    borderVia: string;
}) {
    return (
        <Card className="bg-card/80 border-border/50 backdrop-blur-sm overflow-hidden relative hover-glow">
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${borderVia} to-transparent`} />
            <CardHeader className="pb-2 pt-5 px-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${gradientFrom} ring-1 ${gradientVia}`}>
                        <Icon className={`w-5 h-5 ${gradientVia.replace('ring-', 'text-').replace('/20', '')}`} />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">{title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            {subtitle}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">{children}</CardContent>
        </Card>
    );
}

/* ── Widget configs (memoized as constants outside component) ── */
const marketOverviewColors = {
    plotLineColorGrowing: 'rgba(38, 166, 154, 1)',
    plotLineColorFalling: 'rgba(239, 83, 80, 1)',
    gridLineColor: 'rgba(42, 46, 57, 0.3)',
    scaleFontColor: 'rgba(209, 212, 220, 0.7)',
    belowLineFillColorGrowing: 'rgba(38, 166, 154, 0.05)',
    belowLineFillColorFalling: 'rgba(239, 83, 80, 0.05)',
    belowLineFillColorGrowingBottom: 'rgba(38, 166, 154, 0)',
    belowLineFillColorFallingBottom: 'rgba(239, 83, 80, 0)',
    symbolActiveColor: 'rgba(38, 166, 154, 0.12)',
};

const globalOverviewColors = {
    ...marketOverviewColors,
    plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
    belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.05)',
    belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
    symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
};

const INDIAN_CONFIG = {
    colorTheme: 'dark', dateRange: '1D', showChart: true, locale: 'en',
    isTransparent: true, showSymbolLogo: true, showFloatingTooltip: true,
    width: '100%', height: '550', ...marketOverviewColors,
    tabs: [
        {
            title: 'Indices', originalTitle: 'Indices', symbols: [
                { s: 'NSE:NIFTY', d: 'NIFTY 50' }, { s: 'BSE:SENSEX', d: 'SENSEX' },
                { s: 'NSE:BANKNIFTY', d: 'BANK NIFTY' }, { s: 'NSE:CNXFINANCE', d: 'NIFTY FIN SERVICE' },
                { s: 'NSE:CNXIT', d: 'NIFTY IT' }, { s: 'NSE:CNXPHARMA', d: 'NIFTY PHARMA' },
            ]
        },
        {
            title: 'Sectoral', originalTitle: 'Sectoral', symbols: [
                { s: 'NSE:CNXAUTO', d: 'NIFTY AUTO' }, { s: 'NSE:CNXMETAL', d: 'NIFTY METAL' },
                { s: 'NSE:CNXREALTY', d: 'NIFTY REALTY' }, { s: 'NSE:CNXENERGY', d: 'NIFTY ENERGY' },
                { s: 'NSE:CNXFMCG', d: 'NIFTY FMCG' }, { s: 'NSE:CNXPSUBANK', d: 'NIFTY PSU BANK' },
            ]
        },
        {
            title: 'Large Cap', originalTitle: 'Large Cap', symbols: [
                { s: 'NSE:RELIANCE', d: 'Reliance' }, { s: 'NSE:TCS', d: 'TCS' },
                { s: 'NSE:HDFCBANK', d: 'HDFC Bank' }, { s: 'NSE:INFY', d: 'Infosys' },
                { s: 'NSE:ICICIBANK', d: 'ICICI Bank' }, { s: 'NSE:BHARTIARTL', d: 'Airtel' },
            ]
        },
        {
            title: 'Commodities MCX', originalTitle: 'Commodities MCX', symbols: [
                { s: 'FX:USDINR', d: 'USD/INR' }, { s: 'TVC:GOLD', d: 'Gold' },
                { s: 'NYMEX:CL1!', d: 'Crude Oil' }, { s: 'TVC:SILVER', d: 'Silver' },
                { s: 'MCX:CRUDEOIL1!', d: 'MCX Crude' }, { s: 'MCX:NATURALGAS1!', d: 'MCX Nat Gas' },
            ]
        },
    ],
};

const GLOBAL_CONFIG = {
    colorTheme: 'dark', dateRange: '1D', showChart: true, locale: 'en',
    isTransparent: true, showSymbolLogo: true, showFloatingTooltip: true,
    width: '100%', height: '550', ...globalOverviewColors,
    tabs: [
        {
            title: 'US & Europe', originalTitle: 'US & Europe', symbols: [
                { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' }, { s: 'FOREXCOM:NSXUSD', d: 'NASDAQ 100' },
                { s: 'FOREXCOM:DJI', d: 'Dow Jones' }, { s: 'CAPITALCOM:DAX', d: 'DAX' },
                { s: 'CAPITALCOM:UK100', d: 'FTSE 100' }, { s: 'CAPITALCOM:EU50', d: 'Euro Stoxx 50' },
            ]
        },
        {
            title: 'Asia Pacific', originalTitle: 'Asia Pacific', symbols: [
                { s: 'BSE:SENSEX', d: 'SENSEX' }, { s: 'NSE:NIFTY', d: 'NIFTY 50' },
                { s: 'INDEX:NKY', d: 'Nikkei 225' }, { s: 'INDEX:HSI', d: 'Hang Seng' },
                { s: 'SSE:000001', d: 'Shanghai Comp.' }, { s: 'KRX:KOSPI', d: 'KOSPI' },
            ]
        },
        {
            title: 'Commodities', originalTitle: 'Commodities', symbols: [
                { s: 'TVC:GOLD', d: 'Gold' }, { s: 'TVC:SILVER', d: 'Silver' },
                { s: 'NYMEX:CL1!', d: 'Crude Oil WTI' }, { s: 'NYMEX:NG1!', d: 'Natural Gas' },
                { s: 'CBOT:ZW1!', d: 'Wheat' }, { s: 'COMEX:HG1!', d: 'Copper' },
            ]
        },
    ],
};

const CRYPTO_CONFIG = {
    colorTheme: 'dark', dateRange: '1D', showChart: true, locale: 'en',
    isTransparent: true, showSymbolLogo: true, showFloatingTooltip: true,
    width: '100%', height: '550',
    plotLineColorGrowing: 'rgba(247, 147, 26, 1)',
    plotLineColorFalling: 'rgba(239, 83, 80, 1)',
    gridLineColor: 'rgba(42, 46, 57, 0.3)',
    scaleFontColor: 'rgba(209, 212, 220, 0.7)',
    belowLineFillColorGrowing: 'rgba(247, 147, 26, 0.05)',
    belowLineFillColorFalling: 'rgba(239, 83, 80, 0.05)',
    belowLineFillColorGrowingBottom: 'rgba(247, 147, 26, 0)',
    belowLineFillColorFallingBottom: 'rgba(239, 83, 80, 0)',
    symbolActiveColor: 'rgba(247, 147, 26, 0.12)',
    tabs: [
        {
            title: 'Major Coins', originalTitle: 'Major Coins', symbols: [
                { s: 'BITSTAMP:BTCUSD', d: 'Bitcoin' }, { s: 'BITSTAMP:ETHUSD', d: 'Ethereum' },
                { s: 'BINANCE:BNBUSDT', d: 'BNB' }, { s: 'BINANCE:SOLUSDT', d: 'Solana' },
                { s: 'BINANCE:XRPUSDT', d: 'XRP' }, { s: 'BINANCE:ADAUSDT', d: 'Cardano' },
            ]
        },
        {
            title: 'DeFi & Layer 2', originalTitle: 'DeFi & Layer 2', symbols: [
                { s: 'BINANCE:AVAXUSDT', d: 'Avalanche' }, { s: 'BINANCE:DOTUSDT', d: 'Polkadot' },
                { s: 'BINANCE:MATICUSDT', d: 'Polygon' }, { s: 'BINANCE:LINKUSDT', d: 'Chainlink' },
                { s: 'BINANCE:UNIUSDT', d: 'Uniswap' }, { s: 'BINANCE:AAVEUSDT', d: 'Aave' },
            ]
        },
        {
            title: 'Meme & Trending', originalTitle: 'Meme & Trending', symbols: [
                { s: 'BINANCE:DOGEUSDT', d: 'Dogecoin' }, { s: 'BINANCE:SHIBUSDT', d: 'Shiba Inu' },
                { s: 'BINANCE:PEPEUSDT', d: 'PEPE' }, { s: 'BINANCE:TRXUSDT', d: 'TRON' },
                { s: 'BINANCE:NEARUSDT', d: 'NEAR Protocol' }, { s: 'BINANCE:SUIUSDT', d: 'SUI' },
            ]
        },
    ],
};

const CRYPTO_SCREENER_CONFIG = {
    width: '100%', height: '550', defaultColumn: 'overview',
    defaultScreen: 'crypto_has_crypto', market: 'crypto',
    showToolbar: true, colorTheme: 'dark', locale: 'en', isTransparent: true,
};

const FOREX_RATES_CONFIG = {
    width: '100%', height: '400', isTransparent: true, colorTheme: 'dark', locale: 'en',
    currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'INR', 'CNY'],
};

const FOREX_HEATMAP_CONFIG = {
    width: '100%', height: '450', isTransparent: true, colorTheme: 'dark', locale: 'en',
    currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD', 'INR'],
};

const HEATMAP_CRYPTO = {
    dataSource: "Crypto",
    blockSize: "market_cap_calc",
    blockColor: "change",
    locale: "en",
    symbolUrl: "",
    colorTheme: "dark",
    hasTopBar: true,
    isDataSetEnabled: false,
    isZoomEnabled: true,
    hasSymbolTooltip: true,
    isMonoSize: false,
    width: "100%",
    height: "500"
};

const HEATMAP_SENSEX = {
    exchanges: [], dataSource: 'SENSEX', grouping: 'sector', blockSize: 'market_cap_basic',
    blockColor: 'change', locale: 'en', symbolUrl: '', colorTheme: 'dark', hasTopBar: true,
    isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false,
    width: '100%', height: '500',
};

const HEATMAP_SPX = {
    ...HEATMAP_SENSEX, dataSource: 'SPX500',
};

const SCREENER_CONFIG = {
    width: '100%', height: '550', defaultColumn: 'overview',
    defaultScreen: 'most_capitalized', market: 'india',
    showToolbar: true, colorTheme: 'dark', locale: 'en', isTransparent: true,
};


export const MarketScreeners = memo(() => {
    return (
        <div className="space-y-6">
            <SectionCard
                title="Stock Screener"
                subtitle="Live · Top gainers, losers, most active · Filter by market cap, P/E"
                icon={BarChart3}
                gradientFrom="from-indigo-500/20 to-violet-500/10"
                gradientVia="ring-indigo-500/20"
                borderVia="via-indigo-500/60"
            >
                <LazyWidget src={TV + 'screener.js'} config={SCREENER_CONFIG} height={600} />
            </SectionCard>

            <SectionCard
                title="Crypto Screener"
                subtitle="Live · All coins · Sort by market cap, volume, change %"
                icon={BarChart3}
                gradientFrom="from-amber-500/20 to-yellow-500/10"
                gradientVia="ring-amber-500/20"
                borderVia="via-amber-500/60"
            >
                <LazyWidget src={TV + 'screener.js'} config={CRYPTO_SCREENER_CONFIG} height={600} />
            </SectionCard>
        </div>
    );
});
MarketScreeners.displayName = 'MarketScreeners';

export const MarketHeatmaps = memo(() => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SectionCard
                    title="Forex Cross Rates"
                    subtitle="Live matrix · EUR, USD, JPY, GBP, CHF, AUD, CAD, INR, CNY"
                    icon={DollarSign}
                    gradientFrom="from-violet-500/20 to-purple-500/10"
                    gradientVia="ring-violet-500/20"
                    borderVia="via-violet-500/60"
                >
                    <LazyWidget src={TV + 'forex-cross-rates.js'} config={FOREX_RATES_CONFIG} height={400} />
                </SectionCard>

                <SectionCard
                    title="Crypto Heatmap"
                    subtitle="Live · Top Cryptocurrencies by Market Cap"
                    icon={Bitcoin}
                    gradientFrom="from-orange-500/20 to-amber-500/10"
                    gradientVia="ring-orange-500/20"
                    borderVia="via-orange-500/60"
                >
                    <LazyWidget src={TV + 'crypto-coins-heatmap.js'} config={HEATMAP_CRYPTO} height={450} />
                </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SectionCard
                    title="SENSEX Heatmap"
                    subtitle="Indian market · Sector-wise by market cap"
                    icon={TrendingUp}
                    gradientFrom="from-teal-500/20 to-emerald-500/10"
                    gradientVia="ring-teal-500/20"
                    borderVia="via-teal-500/60"
                >
                    <LazyWidget src={TV + 'stock-heatmap.js'} config={HEATMAP_SENSEX} height={500} />
                </SectionCard>

                <SectionCard
                    title="S&P 500 Heatmap"
                    subtitle="US market · Large-cap stocks"
                    icon={Globe}
                    gradientFrom="from-blue-500/20 to-cyan-500/10"
                    gradientVia="ring-blue-500/20"
                    borderVia="via-blue-500/60"
                >
                    <LazyWidget src={TV + 'stock-heatmap.js'} config={HEATMAP_SPX} height={500} />
                </SectionCard>
            </div>
        </div>
    );
});
MarketHeatmaps.displayName = 'MarketHeatmaps';

const GlobalMarketsWidget = memo(({ hideDetailedTabs = false }: { hideDetailedTabs?: boolean }) => {
    // Determine which markets are currently open to prioritize them in the UI
    const [marketOrder, setMarketOrder] = useState<('indian' | 'global' | 'crypto')[]>(['indian', 'global', 'crypto']);

    useEffect(() => {
        const now = new Date();
        const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
        const day = now.getUTCDay(); // 0 is Sunday, 6 is Saturday

        const isWeekday = day >= 1 && day <= 5;

        // India: 09:15 to 15:30 IST -> 03:45 to 10:00 UTC
        const isIndianOpen = isWeekday && utcHours >= 3.75 && utcHours <= 10.0;

        // US: 09:30 to 16:00 EST/EDT -> ~13:30 to 21:00 UTC (pad boundaries)
        const isUsOpen = isWeekday && utcHours >= 13.5 && utcHours <= 21.0;

        if (isUsOpen && !isIndianOpen) {
            setMarketOrder(['global', 'indian', 'crypto']);
        } else if (!isUsOpen && !isIndianOpen) {
            // Both closed (e.g. weekends or late night), put 24/7 Crypto at the top
            setMarketOrder(['crypto', 'global', 'indian']);
        } else {
            // Indian is open, default to Indian first
            setMarketOrder(['indian', 'global', 'crypto']);
        }
    }, []);

    const sections = {
        indian: (
            <SectionCard
                key="indian"
                title="Indian Markets"
                subtitle="Live Indian Session · NIFTY, SENSEX, Sectoral, Large Cap"
                icon={IndianRupee}
                gradientFrom="from-teal-500/20 to-emerald-500/10"
                gradientVia="ring-teal-500/20"
                borderVia="via-teal-500/60"
            >
                <LazyWidget src={TV + 'market-overview.js'} config={INDIAN_CONFIG} />
            </SectionCard>
        ),
        global: (
            <SectionCard
                key="global"
                title="Global Markets"
                subtitle="Live Global Session · US, Europe, Asia, Commodities"
                icon={Globe}
                gradientFrom="from-blue-500/20 to-cyan-500/10"
                gradientVia="ring-blue-500/20"
                borderVia="via-blue-500/60"
            >
                <LazyWidget src={TV + 'market-overview.js'} config={GLOBAL_CONFIG} />
            </SectionCard>
        ),
        crypto: (
            <SectionCard
                key="crypto"
                title="Cryptocurrency Markets"
                subtitle="Live 24/7 · Bitcoin, Ethereum, DeFi, Meme Coins"
                icon={Bitcoin}
                gradientFrom="from-orange-500/20 to-amber-500/10"
                gradientVia="ring-orange-500/20"
                borderVia="via-orange-500/60"
            >
                <LazyWidget src={TV + 'market-overview.js'} config={CRYPTO_CONFIG} />
            </SectionCard>
        )
    };

    return (
        <div className="space-y-4">
            {marketOrder.map(key => sections[key])}

            {!hideDetailedTabs && (
                <>
                    <MarketScreeners />
                    <MarketHeatmaps />
                </>
            )}
        </div>
    );
});

GlobalMarketsWidget.displayName = 'GlobalMarketsWidget';

export default GlobalMarketsWidget;
