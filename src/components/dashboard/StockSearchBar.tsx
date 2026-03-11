import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, ArrowRight, Flame, Star, Zap } from 'lucide-react';

interface StockSearchBarProps {
  onSelect: (symbol: string) => void;
}

/* ── Full ticker catalog for autocomplete ── */
const STOCKS = [
  // ── Indian Indices ──
  { symbol: 'NSE:NIFTY', name: 'NIFTY 50', tag: 'Index' },
  { symbol: 'NSE:BANKNIFTY', name: 'Bank NIFTY', tag: 'Index' },
  { symbol: 'BSE:SENSEX', name: 'SENSEX', tag: 'Index' },
  { symbol: 'NSE:NIFTYIT', name: 'NIFTY IT', tag: 'Index' },
  { symbol: 'NSE:FINNIFTY', name: 'FIN NIFTY', tag: 'Index' },
  { symbol: 'NSE:NIFTYMIDCAP', name: 'NIFTY Midcap', tag: 'Index' },
  { symbol: 'NSE:NIFTYSMLCAP', name: 'NIFTY Smallcap', tag: 'Index' },

  // ── US / Global Indices ──
  { symbol: 'SP:SPX', name: 'S&P 500', tag: 'Index' },
  { symbol: 'NASDAQ:NDX', name: 'NASDAQ 100', tag: 'Index' },
  { symbol: 'DJ:DJI', name: 'Dow Jones', tag: 'Index' },
  { symbol: 'TVC:UKX', name: 'FTSE 100', tag: 'Index' },
  { symbol: 'TVC:NI225', name: 'Nikkei 225', tag: 'Index' },
  { symbol: 'XETR:DAX', name: 'DAX 40', tag: 'Index' },
  { symbol: 'SSE:000001', name: 'Shanghai Composite', tag: 'Index' },
  { symbol: 'HSI:HSI', name: 'Hang Seng', tag: 'Index' },

  // ── NSE Large-Cap ──
  { symbol: 'NSE:RELIANCE', name: 'Reliance Industries', tag: 'NSE' },
  { symbol: 'NSE:TCS', name: 'TCS', tag: 'NSE' },
  { symbol: 'NSE:INFY', name: 'Infosys', tag: 'NSE' },
  { symbol: 'NSE:HDFCBANK', name: 'HDFC Bank', tag: 'NSE' },
  { symbol: 'NSE:ICICIBANK', name: 'ICICI Bank', tag: 'NSE' },
  { symbol: 'NSE:SBIN', name: 'State Bank of India', tag: 'NSE' },
  { symbol: 'NSE:TATAMOTORS', name: 'Tata Motors', tag: 'NSE' },
  { symbol: 'NSE:ITC', name: 'ITC', tag: 'NSE' },
  { symbol: 'NSE:LT', name: 'Larsen & Toubro', tag: 'NSE' },
  { symbol: 'NSE:BHARTIARTL', name: 'Bharti Airtel', tag: 'NSE' },
  { symbol: 'NSE:WIPRO', name: 'Wipro', tag: 'NSE' },
  { symbol: 'NSE:ADANIENT', name: 'Adani Enterprises', tag: 'NSE' },
  { symbol: 'NSE:ADANIPORTS', name: 'Adani Ports', tag: 'NSE' },
  { symbol: 'NSE:BAJFINANCE', name: 'Bajaj Finance', tag: 'NSE' },
  { symbol: 'NSE:BAJFINSV', name: 'Bajaj Finserv', tag: 'NSE' },
  { symbol: 'NSE:MARUTI', name: 'Maruti Suzuki', tag: 'NSE' },
  { symbol: 'NSE:SUNPHARMA', name: 'Sun Pharma', tag: 'NSE' },
  { symbol: 'NSE:TATASTEEL', name: 'Tata Steel', tag: 'NSE' },
  { symbol: 'NSE:KOTAKBANK', name: 'Kotak Mahindra Bank', tag: 'NSE' },
  { symbol: 'NSE:AXISBANK', name: 'Axis Bank', tag: 'NSE' },
  { symbol: 'NSE:HCLTECH', name: 'HCL Technologies', tag: 'NSE' },
  { symbol: 'NSE:M_M', name: 'Mahindra & Mahindra', tag: 'NSE' },
  { symbol: 'NSE:NTPC', name: 'NTPC', tag: 'NSE' },
  { symbol: 'NSE:POWERGRID', name: 'Power Grid Corp', tag: 'NSE' },
  { symbol: 'NSE:TITAN', name: 'Titan Company', tag: 'NSE' },
  { symbol: 'NSE:ASIANPAINT', name: 'Asian Paints', tag: 'NSE' },
  { symbol: 'NSE:NESTLEIND', name: 'Nestle India', tag: 'NSE' },
  { symbol: 'NSE:HINDUNILVR', name: 'Hindustan Unilever', tag: 'NSE' },
  { symbol: 'NSE:ULTRACEMCO', name: 'UltraTech Cement', tag: 'NSE' },
  { symbol: 'NSE:ONGC', name: 'ONGC', tag: 'NSE' },
  { symbol: 'NSE:COALINDIA', name: 'Coal India', tag: 'NSE' },
  { symbol: 'NSE:BPCL', name: 'BPCL', tag: 'NSE' },
  { symbol: 'NSE:IOC', name: 'Indian Oil Corp', tag: 'NSE' },
  { symbol: 'NSE:DRREDDY', name: 'Dr. Reddys Labs', tag: 'NSE' },
  { symbol: 'NSE:CIPLA', name: 'Cipla', tag: 'NSE' },
  { symbol: 'NSE:HAL', name: 'Hindustan Aeronautics', tag: 'NSE' },
  { symbol: 'NSE:BEL', name: 'Bharat Electronics', tag: 'NSE' },
  { symbol: 'NSE:ZOMATO', name: 'Zomato', tag: 'NSE' },
  { symbol: 'NSE:IRCTC', name: 'IRCTC', tag: 'NSE' },
  { symbol: 'NSE:TRENT', name: 'Trent', tag: 'NSE' },
  { symbol: 'NSE:DMART', name: 'Avenue Supermarts', tag: 'NSE' },
  { symbol: 'NSE:JSWSTEEL', name: 'JSW Steel', tag: 'NSE' },
  { symbol: 'NSE:TECHM', name: 'Tech Mahindra', tag: 'NSE' },
  { symbol: 'NSE:INDUSINDBK', name: 'IndusInd Bank', tag: 'NSE' },
  { symbol: 'NSE:GRASIM', name: 'Grasim Industries', tag: 'NSE' },
  { symbol: 'NSE:EICHERMOT', name: 'Eicher Motors', tag: 'NSE' },
  { symbol: 'NSE:TATACONSUM', name: 'Tata Consumer', tag: 'NSE' },
  { symbol: 'NSE:DIVISLAB', name: 'Divis Labs', tag: 'NSE' },
  { symbol: 'NSE:BRITANNIA', name: 'Britannia', tag: 'NSE' },
  { symbol: 'NSE:HEROMOTOCO', name: 'Hero MotoCorp', tag: 'NSE' },
  { symbol: 'NSE:APOLLOHOSP', name: 'Apollo Hospitals', tag: 'NSE' },
  { symbol: 'NSE:HINDALCO', name: 'Hindalco', tag: 'NSE' },
  { symbol: 'NSE:SBILIFE', name: 'SBI Life Insurance', tag: 'NSE' },
  { symbol: 'NSE:HDFCLIFE', name: 'HDFC Life Insurance', tag: 'NSE' },
  { symbol: 'NSE:VEDL', name: 'Vedanta', tag: 'NSE' },
  { symbol: 'NSE:PNB', name: 'Punjab National Bank', tag: 'NSE' },
  { symbol: 'NSE:BANKBARODA', name: 'Bank of Baroda', tag: 'NSE' },
  { symbol: 'NSE:CANBK', name: 'Canara Bank', tag: 'NSE' },
  { symbol: 'NSE:TATAPOWER', name: 'Tata Power', tag: 'NSE' },
  { symbol: 'NSE:ADANIGREEN', name: 'Adani Green', tag: 'NSE' },
  { symbol: 'NSE:ADANIPOWER', name: 'Adani Power', tag: 'NSE' },
  { symbol: 'NSE:JIOFIN', name: 'Jio Financial', tag: 'NSE' },
  { symbol: 'NSE:PAYTM', name: 'Paytm (One97)', tag: 'NSE' },
  { symbol: 'NSE:NYKAA', name: 'Nykaa', tag: 'NSE' },
  { symbol: 'NSE:POLICYBZR', name: 'PB Fintech', tag: 'NSE' },

  // ── US Stocks ──
  { symbol: 'NASDAQ:AAPL', name: 'Apple', tag: 'US' },
  { symbol: 'NASDAQ:MSFT', name: 'Microsoft', tag: 'US' },
  { symbol: 'NASDAQ:GOOGL', name: 'Alphabet (Google)', tag: 'US' },
  { symbol: 'NASDAQ:AMZN', name: 'Amazon', tag: 'US' },
  { symbol: 'NASDAQ:NVDA', name: 'Nvidia', tag: 'US' },
  { symbol: 'NASDAQ:TSLA', name: 'Tesla', tag: 'US' },
  { symbol: 'NASDAQ:META', name: 'Meta Platforms', tag: 'US' },
  { symbol: 'NASDAQ:AMD', name: 'AMD', tag: 'US' },
  { symbol: 'NASDAQ:INTC', name: 'Intel', tag: 'US' },
  { symbol: 'NASDAQ:NFLX', name: 'Netflix', tag: 'US' },
  { symbol: 'NYSE:DIS', name: 'Walt Disney', tag: 'US' },
  { symbol: 'NYSE:JPM', name: 'JPMorgan Chase', tag: 'US' },
  { symbol: 'NYSE:V', name: 'Visa', tag: 'US' },
  { symbol: 'NYSE:MA', name: 'Mastercard', tag: 'US' },
  { symbol: 'NYSE:WMT', name: 'Walmart', tag: 'US' },
  { symbol: 'NYSE:JNJ', name: 'Johnson & Johnson', tag: 'US' },
  { symbol: 'NYSE:PG', name: 'Procter & Gamble', tag: 'US' },
  { symbol: 'NYSE:KO', name: 'Coca-Cola', tag: 'US' },
  { symbol: 'NYSE:PFE', name: 'Pfizer', tag: 'US' },
  { symbol: 'NYSE:BA', name: 'Boeing', tag: 'US' },
  { symbol: 'NYSE:GS', name: 'Goldman Sachs', tag: 'US' },
  { symbol: 'NYSE:BAC', name: 'Bank of America', tag: 'US' },
  { symbol: 'NASDAQ:AVGO', name: 'Broadcom', tag: 'US' },
  { symbol: 'NASDAQ:CRM', name: 'Salesforce', tag: 'US' },
  { symbol: 'NASDAQ:COIN', name: 'Coinbase', tag: 'US' },
  { symbol: 'NYSE:PLTR', name: 'Palantir', tag: 'US' },
  { symbol: 'NYSE:UBER', name: 'Uber', tag: 'US' },
  { symbol: 'NASDAQ:MSTR', name: 'MicroStrategy', tag: 'US' },

  // ── Crypto ──
  { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', tag: 'Crypto', aliases: ['BTC', 'BITCOIN'] },
  { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum', tag: 'Crypto', aliases: ['ETH'] },
  { symbol: 'BINANCE:SOLUSDT', name: 'Solana', tag: 'Crypto', aliases: ['SOL'] },
  { symbol: 'BINANCE:XRPUSDT', name: 'XRP (Ripple)', tag: 'Crypto', aliases: ['XRP', 'RIPPLE'] },
  { symbol: 'BINANCE:DOGEUSDT', name: 'Dogecoin', tag: 'Crypto', aliases: ['DOGE'] },
  { symbol: 'BINANCE:ADAUSDT', name: 'Cardano', tag: 'Crypto', aliases: ['ADA'] },
  { symbol: 'BINANCE:AVAXUSDT', name: 'Avalanche', tag: 'Crypto', aliases: ['AVAX'] },
  { symbol: 'BINANCE:DOTUSDT', name: 'Polkadot', tag: 'Crypto', aliases: ['DOT'] },
  { symbol: 'BINANCE:LINKUSDT', name: 'Chainlink', tag: 'Crypto', aliases: ['LINK'] },
  { symbol: 'BINANCE:BNBUSDT', name: 'BNB', tag: 'Crypto', aliases: ['BNB'] },
  { symbol: 'BINANCE:MATICUSDT', name: 'Polygon', tag: 'Crypto', aliases: ['MATIC', 'POL'] },
  { symbol: 'BINANCE:SHIBUSDT', name: 'Shiba Inu', tag: 'Crypto', aliases: ['SHIB'] },
  { symbol: 'BINANCE:LTCUSDT', name: 'Litecoin', tag: 'Crypto', aliases: ['LTC'] },
  { symbol: 'BINANCE:TRXUSDT', name: 'TRON', tag: 'Crypto', aliases: ['TRX'] },
  { symbol: 'BINANCE:ATOMUSDT', name: 'Cosmos', tag: 'Crypto', aliases: ['ATOM'] },
  { symbol: 'BINANCE:NEARUSDT', name: 'NEAR Protocol', tag: 'Crypto', aliases: ['NEAR'] },
  { symbol: 'BINANCE:UNIUSDT', name: 'Uniswap', tag: 'Crypto', aliases: ['UNI'] },
  { symbol: 'BINANCE:APTUSDT', name: 'Aptos', tag: 'Crypto', aliases: ['APT'] },
  { symbol: 'BINANCE:AAVEUSDT', name: 'Aave', tag: 'Crypto', aliases: ['AAVE'] },
  { symbol: 'BINANCE:OPUSDT', name: 'Optimism', tag: 'Crypto', aliases: ['OP'] },
  { symbol: 'BINANCE:ARBUSDT', name: 'Arbitrum', tag: 'Crypto', aliases: ['ARB'] },
  { symbol: 'BINANCE:FTMUSDT', name: 'Fantom', tag: 'Crypto', aliases: ['FTM'] },
  { symbol: 'BINANCE:PEPEUSDT', name: 'PEPE', tag: 'Crypto', aliases: ['PEPE'] },
  { symbol: 'BINANCE:WIFUSDT', name: 'dogwifhat', tag: 'Crypto', aliases: ['WIF'] },
  { symbol: 'BINANCE:SUIUSDT', name: 'Sui', tag: 'Crypto', aliases: ['SUI'] },
  { symbol: 'BINANCE:SEIUSDT', name: 'Sei', tag: 'Crypto', aliases: ['SEI'] },
  { symbol: 'BINANCE:INJUSDT', name: 'Injective', tag: 'Crypto', aliases: ['INJ'] },
  { symbol: 'BINANCE:TIAUSDT', name: 'Celestia', tag: 'Crypto', aliases: ['TIA'] },
  { symbol: 'BINANCE:JUPUSDT', name: 'Jupiter', tag: 'Crypto', aliases: ['JUP'] },
  { symbol: 'BINANCE:FETUSDT', name: 'Fetch.ai', tag: 'Crypto', aliases: ['FET'] },
  { symbol: 'BINANCE:RENDERUSDT', name: 'Render', tag: 'Crypto', aliases: ['RENDER', 'RNDR'] },
  { symbol: 'BINANCE:WLDUSDT', name: 'Worldcoin', tag: 'Crypto', aliases: ['WLD'] },

  // ── Commodities ──
  { symbol: 'OANDA:XAUUSD', name: 'Gold', tag: 'Commodity', aliases: ['GOLD', 'XAU'] },
  { symbol: 'OANDA:XAGUSD', name: 'Silver', tag: 'Commodity', aliases: ['SILVER', 'XAG'] },
  { symbol: 'NYMEX:CL1!', name: 'Crude Oil WTI', tag: 'Commodity', aliases: ['OIL', 'CRUDE', 'WTI'] },
  { symbol: 'NYMEX:BZ1!', name: 'Brent Crude', tag: 'Commodity', aliases: ['BRENT'] },
  { symbol: 'COMEX:GC1!', name: 'Gold Futures', tag: 'Commodity' },
  { symbol: 'COMEX:SI1!', name: 'Silver Futures', tag: 'Commodity' },
  { symbol: 'NYMEX:NG1!', name: 'Natural Gas', tag: 'Commodity', aliases: ['NATGAS', 'GAS'] },
  { symbol: 'COMEX:HG1!', name: 'Copper', tag: 'Commodity', aliases: ['COPPER'] },
  { symbol: 'MCX:GOLD1!', name: 'Gold MCX', tag: 'Commodity' },
  { symbol: 'MCX:SILVER1!', name: 'Silver MCX', tag: 'Commodity' },
  { symbol: 'MCX:CRUDEOIL1!', name: 'Crude Oil MCX', tag: 'Commodity' },

  // ── Forex ──
  { symbol: 'FX_IDC:USDINR', name: 'USD/INR', tag: 'Forex' },
  { symbol: 'FX:EURUSD', name: 'EUR/USD', tag: 'Forex' },
  { symbol: 'FX:GBPUSD', name: 'GBP/USD', tag: 'Forex' },
  { symbol: 'FX:USDJPY', name: 'USD/JPY', tag: 'Forex' },
  { symbol: 'FX:USDCHF', name: 'USD/CHF', tag: 'Forex' },
  { symbol: 'FX:AUDUSD', name: 'AUD/USD', tag: 'Forex' },
  { symbol: 'FX:USDCAD', name: 'USD/CAD', tag: 'Forex' },
  { symbol: 'FX:NZDUSD', name: 'NZD/USD', tag: 'Forex' },
  { symbol: 'FX:GBPJPY', name: 'GBP/JPY', tag: 'Forex' },
  { symbol: 'FX:EURJPY', name: 'EUR/JPY', tag: 'Forex' },
  { symbol: 'TVC:DXY', name: 'US Dollar Index', tag: 'Forex', aliases: ['DXY', 'DOLLAR'] },

  // ── ETFs ──
  { symbol: 'AMEX:SPY', name: 'SPDR S&P 500 ETF', tag: 'ETF' },
  { symbol: 'NASDAQ:QQQ', name: 'Invesco QQQ', tag: 'ETF' },
  { symbol: 'AMEX:IWM', name: 'Russell 2000 ETF', tag: 'ETF' },
  { symbol: 'AMEX:GLD', name: 'SPDR Gold Trust', tag: 'ETF' },
  { symbol: 'AMEX:SLV', name: 'iShares Silver Trust', tag: 'ETF' },
  { symbol: 'AMEX:ARKK', name: 'ARK Innovation', tag: 'ETF' },
  { symbol: 'AMEX:IBIT', name: 'iShares Bitcoin Trust', tag: 'ETF' },

  // ── Bonds / Rates ──
  { symbol: 'TVC:US10Y', name: 'US 10Y Treasury', tag: 'Bond' },
  { symbol: 'TVC:US02Y', name: 'US 2Y Treasury', tag: 'Bond' },
  { symbol: 'TVC:IN10Y', name: 'India 10Y Bond', tag: 'Bond' },
];

type StockEntry = (typeof STOCKS)[number];

const TAG_COLORS: Record<string, string> = {
  Index: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  NSE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  US: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  Crypto: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Commodity: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Forex: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ETF: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Bond: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
};

const TAG_ICONS: Record<string, string> = {
  Index: '📊',
  NSE: '🇮🇳',
  US: '🇺🇸',
  Crypto: '₿',
  Commodity: '🪙',
  Forex: '💱',
  ETF: '📦',
  Bond: '🏛️',
};

const TRENDING: string[] = [
  'BINANCE:BTCUSDT',
  'NSE:RELIANCE',
  'NASDAQ:NVDA',
  'NSE:NIFTY',
  'OANDA:XAUUSD',
  'BINANCE:ETHUSDT',
];

export function StockSearchBar({ onSelect }: StockSearchBarProps) {
  const [query, setQuery] = useState('');
  const [show, setShow] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const lowerQ = query.toLowerCase().trim();

  const filtered: StockEntry[] = useMemo(() => {
    if (lowerQ.length < 1) return [];
    return STOCKS.filter(s => {
      const aliases = (s as any).aliases as string[] | undefined;
      return (
        s.name.toLowerCase().includes(lowerQ) ||
        s.symbol.toLowerCase().includes(lowerQ) ||
        s.tag.toLowerCase().includes(lowerQ) ||
        (aliases && aliases.some(a => a.toLowerCase().includes(lowerQ)))
      );
    }).slice(0, 15);
  }, [lowerQ]);

  // Show trending when focused with no query
  const showTrending = show && lowerQ.length === 0;
  const trendingStocks = STOCKS.filter(s => TRENDING.includes(s.symbol));

  const submit = useCallback((symbol: string) => {
    onSelect(symbol);
    setShow(false);
    setQuery('');
    setHighlightIdx(-1);
    inputRef.current?.blur();
  }, [onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = lowerQ.length > 0 ? filtered : trendingStocks;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => Math.min(prev + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && highlightIdx < list.length) {
        submit(list[highlightIdx].symbol);
      } else if (query.trim()) {
        const raw = query.trim().toUpperCase();
        submit(raw.includes(':') ? raw : `NSE:${raw}`);
      }
    } else if (e.key === 'Escape') {
      setShow(false);
      inputRef.current?.blur();
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx >= 0 && dropdownRef.current) {
      const el = dropdownRef.current.querySelector(`[data-idx="${highlightIdx}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIdx]);

  // Global keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const renderItem = (s: StockEntry, i: number) => (
    <button
      key={s.symbol}
      data-idx={i}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-all group ${
        i === highlightIdx
          ? 'bg-gradient-to-r from-blue-500/15 via-purple-500/10 to-transparent text-white'
          : 'hover:bg-white/[0.04] text-gray-300 hover:text-white'
      }`}
      onMouseDown={(e) => { e.preventDefault(); submit(s.symbol); }}
      onMouseEnter={() => setHighlightIdx(i)}
    >
      <span className="text-base shrink-0">{TAG_ICONS[s.tag] || '📈'}</span>
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{s.name}</span>
        </div>
        <span className="text-[11px] text-gray-500 font-mono">{s.symbol}</span>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TAG_COLORS[s.tag] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
        {s.tag}
      </span>
      <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-all ${
        i === highlightIdx ? 'text-blue-400 translate-x-0 opacity-100' : 'text-gray-600 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
      }`} />
    </button>
  );

  return (
    <div className="relative flex-1 max-w-xl">
      {/* ── Glowing search input ── */}
      <div className={`relative transition-all duration-300 ${
        isFocused
          ? 'drop-shadow-[0_0_18px_rgba(59,130,246,0.4)]'
          : ''
      }`}>
        {/* Animated glow border ring */}
        <div className={`absolute -inset-[1.5px] rounded-xl transition-all duration-300 pointer-events-none ${
          isFocused
            ? 'opacity-100'
            : 'opacity-0'
        }`}
          style={isFocused ? {
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)',
            backgroundSize: '300% 100%',
            animation: 'glow-shift 3s ease infinite',
            filter: 'blur(1.5px)',
          } : {}}
        />

        <div className="relative">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${
            isFocused ? 'text-blue-400' : 'text-gray-500'
          }`} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setShow(true); setHighlightIdx(-1); }}
            onFocus={() => { setShow(true); setIsFocused(true); }}
            onBlur={() => { setIsFocused(false); setTimeout(() => setShow(false), 250); }}
            onKeyDown={handleKeyDown}
            placeholder="Search stocks, crypto, indices, forex…"
            className={`w-full pl-10 pr-12 py-2.5 text-sm rounded-xl border text-white placeholder:text-gray-500 transition-all duration-200 outline-none ${
              isFocused
                ? 'bg-[#0c0e15] border-blue-500/60 shadow-[0_0_30px_rgba(59,130,246,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
            }`}
          />
          {query ? (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 transition-all"
              onMouseDown={(e) => {
                e.preventDefault();
                const raw = query.trim().toUpperCase();
                submit(raw.includes(':') ? raw : `NSE:${raw}`);
              }}
              title="Open chart"
            >
              <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center text-[10px] text-gray-500 border border-white/10 rounded-md px-1.5 py-0.5 bg-white/[0.03] font-mono">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* ── Dropdown ── */}
      {(show && (filtered.length > 0 || showTrending || (lowerQ.length > 0 && filtered.length === 0))) && (
        <div
          ref={dropdownRef}
          className="absolute z-[60] mt-2 w-full bg-[#0f1219]/95 border border-white/10 rounded-xl shadow-2xl shadow-black/60 max-h-[420px] overflow-hidden flex flex-col backdrop-blur-xl"
        >
          {/* Trending state (empty query) */}
          {showTrending && (
            <>
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Trending Now</span>
              </div>
              <div className="overflow-auto flex-1">
                {trendingStocks.map((s, i) => renderItem(s, i))}
              </div>
              <div className="px-4 py-2 border-t border-white/5 flex items-center gap-2 text-[11px] text-gray-500">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span>Type any symbol and press Enter to open its chart</span>
              </div>
            </>
          )}

          {/* Search results */}
          {lowerQ.length > 0 && filtered.length > 0 && (
            <>
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Results</span>
                </div>
                <span className="text-[10px] text-gray-500 tabular-nums">{filtered.length} found</span>
              </div>
              <div className="overflow-auto flex-1">
                {filtered.map((s, i) => renderItem(s, i))}
              </div>
            </>
          )}

          {/* Empty state */}
          {lowerQ.length > 0 && filtered.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-400 mb-1">No match for <span className="text-white font-semibold">"{query}"</span></p>
              <p className="text-xs text-gray-500">
                Press <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 text-gray-300 text-[10px] border border-white/10 font-mono">Enter</kbd>{' '}
                to open <span className="text-blue-400 font-semibold font-mono">{query.trim().toUpperCase().includes(':') ? query.trim().toUpperCase() : `NSE:${query.trim().toUpperCase()}`}</span> chart
              </p>
            </div>
          )}
        </div>
      )}

      {/* Inject glow keyframes */}
      <style>{`
        @keyframes glow-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
