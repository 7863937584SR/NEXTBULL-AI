import { useEffect, useRef, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, TrendingUp, BarChart3, IndianRupee, Bitcoin, DollarSign, Newspaper } from 'lucide-react';

/**
 * Comprehensive live market data dashboard — all powered by TradingView widgets.
 *
 * Sections:
 * 1. Indian Markets Overview (Indices, Sectoral, Large Cap, Key Symbols)
 * 2. Global Markets Overview (US & Europe, Asia, Forex, Commodities, Crypto)
 * 3. Crypto Live Prices (dedicated crypto coin list)
 * 4. Crypto Screener (top coins with full data)
 * 5. Forex Cross Rates
 * 6. Forex Heatmap (currency strength)
 * 7. SENSEX + S&P 500 Heatmaps
 * 8. Indian Stock Screener
 * 9. Live Market Timeline (news feed)
 */

/* helper to inject a TradingView widget */
function loadWidget(ref: React.RefObject<HTMLDivElement>, src: string, config: object) {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify(config);
    ref.current.appendChild(script);
}

const TV = 'https://s3.tradingview.com/external-embedding/embed-widget-';

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

const GlobalMarketsWidget = memo(() => {
    const indianRef = useRef<HTMLDivElement>(null);
    const globalRef = useRef<HTMLDivElement>(null);
    const cryptoTickersRef = useRef<HTMLDivElement>(null);
    const cryptoScreenerRef = useRef<HTMLDivElement>(null);
    const forexRatesRef = useRef<HTMLDivElement>(null);
    const forexHeatmapRef = useRef<HTMLDivElement>(null);
    const sensexRef = useRef<HTMLDivElement>(null);
    const spxRef = useRef<HTMLDivElement>(null);
    const screenerRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        // 1. Indian Markets
        loadWidget(indianRef, TV + 'market-overview.js', {
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
        });

        // 2. Global Markets
        loadWidget(globalRef, TV + 'market-overview.js', {
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
        });

        // 3. Crypto Tickers (live mini charts)
        loadWidget(cryptoTickersRef, TV + 'market-overview.js', {
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
        });

        // 4. Crypto Screener
        loadWidget(cryptoScreenerRef, TV + 'screener.js', {
            width: '100%', height: '550', defaultColumn: 'overview',
            defaultScreen: 'crypto_has_crypto', market: 'crypto',
            showToolbar: true, colorTheme: 'dark', locale: 'en', isTransparent: true,
        });

        // 5. Forex Cross Rates
        loadWidget(forexRatesRef, TV + 'forex-cross-rates.js', {
            width: '100%', height: '400', isTransparent: true, colorTheme: 'dark', locale: 'en',
            currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'INR', 'CNY'],
        });

        // 6. Forex Heatmap
        loadWidget(forexHeatmapRef, TV + 'forex-heat-map.js', {
            width: '100%', height: '450', isTransparent: true, colorTheme: 'dark', locale: 'en',
            currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD', 'INR'],
        });

        // 7. SENSEX Heatmap
        loadWidget(sensexRef, TV + 'stock-heatmap.js', {
            exchanges: [], dataSource: 'SENSEX', grouping: 'sector', blockSize: 'market_cap_basic',
            blockColor: 'change', locale: 'en', symbolUrl: '', colorTheme: 'dark', hasTopBar: true,
            isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false,
            width: '100%', height: '500',
        });

        // 8. S&P 500 Heatmap
        loadWidget(spxRef, TV + 'stock-heatmap.js', {
            exchanges: [], dataSource: 'SPX500', grouping: 'sector', blockSize: 'market_cap_basic',
            blockColor: 'change', locale: 'en', symbolUrl: '', colorTheme: 'dark', hasTopBar: true,
            isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false,
            width: '100%', height: '500',
        });

        // 9. Indian Stock Screener
        loadWidget(screenerRef, TV + 'screener.js', {
            width: '100%', height: '550', defaultColumn: 'overview',
            defaultScreen: 'most_capitalized', market: 'india',
            showToolbar: true, colorTheme: 'dark', locale: 'en', isTransparent: true,
        });
    }, []);

    return (
        <div className="space-y-4">
            {/* ════════ INDIAN MARKETS ════════ */}
            <SectionCard
                title="Indian Markets"
                subtitle="Real-time · NIFTY, SENSEX, Sectoral, Large Cap, MCX"
                icon={IndianRupee}
                gradientFrom="from-teal-500/20 to-emerald-500/10"
                gradientVia="ring-teal-500/20"
                borderVia="via-teal-500/60"
            >
                <div ref={indianRef} className="tradingview-widget-container" />
            </SectionCard>

            {/* ════════ GLOBAL MARKETS ════════ */}
            <SectionCard
                title="Global Markets"
                subtitle="Real-time · US, Europe, Asia, Commodities"
                icon={Globe}
                gradientFrom="from-blue-500/20 to-cyan-500/10"
                gradientVia="ring-blue-500/20"
                borderVia="via-blue-500/60"
            >
                <div ref={globalRef} className="tradingview-widget-container" />
            </SectionCard>

            {/* ════════ CRYPTO MARKETS ════════ */}
            <SectionCard
                title="Cryptocurrency Markets"
                subtitle="Real-time · Bitcoin, Ethereum, DeFi, Meme Coins, 18+ tokens"
                icon={Bitcoin}
                gradientFrom="from-orange-500/20 to-amber-500/10"
                gradientVia="ring-orange-500/20"
                borderVia="via-orange-500/60"
            >
                <div ref={cryptoTickersRef} className="tradingview-widget-container" />
            </SectionCard>

            {/* ════════ CRYPTO SCREENER ════════ */}
            <SectionCard
                title="Crypto Screener"
                subtitle="Live · All coins · Sort by market cap, volume, change %"
                icon={BarChart3}
                gradientFrom="from-amber-500/20 to-yellow-500/10"
                gradientVia="ring-amber-500/20"
                borderVia="via-amber-500/60"
            >
                <div ref={cryptoScreenerRef} className="tradingview-widget-container" />
            </SectionCard>

            {/* ════════ FOREX — CROSS RATES + HEATMAP ════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SectionCard
                    title="Forex Cross Rates"
                    subtitle="Live matrix · EUR, USD, JPY, GBP, CHF, AUD, CAD, INR, CNY"
                    icon={DollarSign}
                    gradientFrom="from-violet-500/20 to-purple-500/10"
                    gradientVia="ring-violet-500/20"
                    borderVia="via-violet-500/60"
                >
                    <div ref={forexRatesRef} className="tradingview-widget-container" />
                </SectionCard>

                <SectionCard
                    title="Forex Heatmap"
                    subtitle="Live · Currency strength visualization"
                    icon={DollarSign}
                    gradientFrom="from-purple-500/20 to-pink-500/10"
                    gradientVia="ring-purple-500/20"
                    borderVia="via-purple-500/60"
                >
                    <div ref={forexHeatmapRef} className="tradingview-widget-container" />
                </SectionCard>
            </div>

            {/* ════════ MARKET HEATMAPS ════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SectionCard
                    title="SENSEX Heatmap"
                    subtitle="Indian market · Sector-wise by market cap"
                    icon={TrendingUp}
                    gradientFrom="from-teal-500/20 to-emerald-500/10"
                    gradientVia="ring-teal-500/20"
                    borderVia="via-teal-500/60"
                >
                    <div ref={sensexRef} className="tradingview-widget-container" />
                </SectionCard>

                <SectionCard
                    title="S&P 500 Heatmap"
                    subtitle="US market · Large-cap stocks"
                    icon={Globe}
                    gradientFrom="from-blue-500/20 to-cyan-500/10"
                    gradientVia="ring-blue-500/20"
                    borderVia="via-blue-500/60"
                >
                    <div ref={spxRef} className="tradingview-widget-container" />
                </SectionCard>
            </div>

            {/* ════════ INDIAN STOCK SCREENER ════════ */}
            <SectionCard
                title="Indian Stock Screener"
                subtitle="Live · Top gainers, losers, most active · Filter by market cap, P/E"
                icon={BarChart3}
                gradientFrom="from-indigo-500/20 to-violet-500/10"
                gradientVia="ring-indigo-500/20"
                borderVia="via-indigo-500/60"
            >
                <div ref={screenerRef} className="tradingview-widget-container" />
            </SectionCard>
        </div>
    );
});

GlobalMarketsWidget.displayName = 'GlobalMarketsWidget';

export default GlobalMarketsWidget;
