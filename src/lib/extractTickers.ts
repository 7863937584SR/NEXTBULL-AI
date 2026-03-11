/**
 * Scans AI response text and returns all recognised stock / crypto / index
 * tickers with their TradingView-compatible symbols.
 *
 * The lookup is case-insensitive and avoids duplicates.
 */

export interface TickerMatch {
  /** TradingView symbol, e.g. "NSE:RELIANCE" */
  symbol: string;
  /** Human-friendly label, e.g. "Reliance" */
  name: string;
}

// ── Master dictionary: keyword → { symbol, name } ──
// Order matters for overlapping names; longer names come first.
const TICKER_MAP: { keywords: string[]; symbol: string; name: string }[] = [
  // ─── Indian Indices ───
  { keywords: ['NIFTY 50', 'NIFTY50'],                    symbol: 'NSE:NIFTY',        name: 'NIFTY 50' },
  { keywords: ['BANK NIFTY', 'BANKNIFTY', 'NIFTY BANK'],  symbol: 'NSE:BANKNIFTY',    name: 'Bank NIFTY' },
  { keywords: ['NIFTY IT'],                                symbol: 'NSE:CNXIT',        name: 'NIFTY IT' },
  { keywords: ['NIFTY FIN', 'FINNIFTY'],                   symbol: 'NSE:FINNIFTY',     name: 'FIN NIFTY' },
  { keywords: ['SENSEX'],                                  symbol: 'BSE:SENSEX',       name: 'SENSEX' },

  // ─── Top NSE Stocks ───
  { keywords: ['RELIANCE'],            symbol: 'NSE:RELIANCE',   name: 'Reliance' },
  { keywords: ['TCS'],                 symbol: 'NSE:TCS',        name: 'TCS' },
  { keywords: ['INFOSYS', 'INFY'],     symbol: 'NSE:INFY',       name: 'Infosys' },
  { keywords: ['HDFC BANK', 'HDFCBANK'], symbol: 'NSE:HDFCBANK', name: 'HDFC Bank' },
  { keywords: ['ICICI BANK', 'ICICIBANK'], symbol: 'NSE:ICICIBANK', name: 'ICICI Bank' },
  { keywords: ['ITC'],                 symbol: 'NSE:ITC',        name: 'ITC' },
  { keywords: ['BHARTI AIRTEL', 'BHARTIARTL', 'AIRTEL'], symbol: 'NSE:BHARTIARTL', name: 'Airtel' },
  { keywords: ['SBI', 'SBIN', 'STATE BANK'], symbol: 'NSE:SBIN', name: 'SBI' },
  { keywords: ['TATA MOTORS', 'TATAMOTORS'], symbol: 'NSE:TATAMOTORS', name: 'Tata Motors' },
  { keywords: ['L&T', 'LARSEN'],       symbol: 'NSE:LT',         name: 'L&T' },
  { keywords: ['WIPRO'],               symbol: 'NSE:WIPRO',      name: 'Wipro' },
  { keywords: ['ADANI ENT', 'ADANIENT', 'ADANI ENTERPRISES'], symbol: 'NSE:ADANIENT', name: 'Adani Ent' },
  { keywords: ['ADANI PORTS', 'ADANIPORTS'], symbol: 'NSE:ADANIPORTS', name: 'Adani Ports' },
  { keywords: ['BAJAJ FINANCE', 'BAJFINANCE'], symbol: 'NSE:BAJFINANCE', name: 'Bajaj Fin' },
  { keywords: ['MARUTI', 'MARUTI SUZUKI'], symbol: 'NSE:MARUTI', name: 'Maruti' },
  { keywords: ['SUN PHARMA', 'SUNPHARMA'], symbol: 'NSE:SUNPHARMA', name: 'Sun Pharma' },
  { keywords: ['TATA STEEL', 'TATASTEEL'], symbol: 'NSE:TATASTEEL', name: 'Tata Steel' },
  { keywords: ['KOTAK BANK', 'KOTAKBANK', 'KOTAK MAHINDRA'], symbol: 'NSE:KOTAKBANK', name: 'Kotak Bank' },
  { keywords: ['AXIS BANK', 'AXISBANK'], symbol: 'NSE:AXISBANK', name: 'Axis Bank' },
  { keywords: ['HCL TECH', 'HCLTECH'], symbol: 'NSE:HCLTECH', name: 'HCL Tech' },
  { keywords: ['M&M', 'MAHINDRA'],     symbol: 'NSE:M_M',        name: 'M&M' },
  { keywords: ['TECH MAHINDRA', 'TECHM'], symbol: 'NSE:TECHM', name: 'Tech Mahindra' },
  { keywords: ['LTIMINDTREE', 'LTIM'], symbol: 'NSE:LTIM',       name: 'LTIMindtree' },
  { keywords: ['PERSISTENT'],          symbol: 'NSE:PERSISTENT', name: 'Persistent' },
  { keywords: ['COFORGE'],             symbol: 'NSE:COFORGE',    name: 'Coforge' },
  { keywords: ['MPHASIS'],             symbol: 'NSE:MPHASIS',    name: 'Mphasis' },
  { keywords: ['POWER GRID', 'POWERGRID'], symbol: 'NSE:POWERGRID', name: 'Power Grid' },
  { keywords: ['NTPC'],                symbol: 'NSE:NTPC',       name: 'NTPC' },
  { keywords: ['COAL INDIA', 'COALINDIA'], symbol: 'NSE:COALINDIA', name: 'Coal India' },
  { keywords: ['ONGC'],                symbol: 'NSE:ONGC',       name: 'ONGC' },
  { keywords: ['BPCL'],                symbol: 'NSE:BPCL',       name: 'BPCL' },
  { keywords: ['IOC', 'INDIAN OIL'],   symbol: 'NSE:IOC',        name: 'IOC' },
  { keywords: ['HINDALCO'],            symbol: 'NSE:HINDALCO',   name: 'Hindalco' },
  { keywords: ['JSPL', 'JINDAL STEEL'], symbol: 'NSE:JSWSTEEL',  name: 'JSW Steel' },
  { keywords: ['TITAN'],               symbol: 'NSE:TITAN',      name: 'Titan' },
  { keywords: ['ASIAN PAINTS', 'ASIANPAINT'], symbol: 'NSE:ASIANPAINT', name: 'Asian Paints' },
  { keywords: ['BRITANNIA'],           symbol: 'NSE:BRITANNIA',  name: 'Britannia' },
  { keywords: ['NESTLE'],              symbol: 'NSE:NESTLEIND',  name: 'Nestle India' },
  { keywords: ['HINDUSTAN UNILEVER', 'HUL', 'HINDUNILVR'], symbol: 'NSE:HINDUNILVR', name: 'HUL' },
  { keywords: ['BAJAJ AUTO', 'BAJAJ-AUTO'], symbol: 'NSE:BAJAJ-AUTO', name: 'Bajaj Auto' },
  { keywords: ['EICHER', 'EICHERMOT'], symbol: 'NSE:EICHERMOT',  name: 'Eicher Motors' },
  { keywords: ['HERO MOTOCORP', 'HEROMOTOCO'], symbol: 'NSE:HEROMOTOCO', name: 'Hero Moto' },
  { keywords: ['DMART', 'AVENUE SUPERMARTS'], symbol: 'NSE:DMART', name: 'DMart' },
  { keywords: ['ZOMATO'],              symbol: 'NSE:ZOMATO',     name: 'Zomato' },
  { keywords: ['PAYTM'],               symbol: 'NSE:PAYTM',      name: 'Paytm' },
  { keywords: ['PIDILITE'],            symbol: 'NSE:PIDILITIND',  name: 'Pidilite' },
  { keywords: ['DIVIS LAB', 'DIVISLAB'], symbol: 'NSE:DIVISLAB',  name: 'Divis Lab' },
  { keywords: ['DR REDDY', 'DRREDDY'], symbol: 'NSE:DRREDDY',    name: 'Dr Reddy' },
  { keywords: ['CIPLA'],               symbol: 'NSE:CIPLA',      name: 'Cipla' },
  { keywords: ['INDUSIND BANK', 'INDUSINDBK'], symbol: 'NSE:INDUSINDBK', name: 'IndusInd Bank' },
  { keywords: ['BANDHAN BANK', 'BANDHANBNK'], symbol: 'NSE:BANDHANBNK', name: 'Bandhan Bank' },
  { keywords: ['PNB', 'PUNJAB NATIONAL'], symbol: 'NSE:PNB',     name: 'PNB' },
  { keywords: ['VEDANTA', 'VEDL'],     symbol: 'NSE:VEDL',       name: 'Vedanta' },
  { keywords: ['GRASIM'],              symbol: 'NSE:GRASIM',     name: 'Grasim' },
  { keywords: ['ULTRATECH', 'ULTRACEMCO'], symbol: 'NSE:ULTRACEMCO', name: 'UltraTech' },
  { keywords: ['SHREE CEMENT', 'SHREECEM'], symbol: 'NSE:SHREECEM', name: 'Shree Cement' },
  { keywords: ['HAL', 'HINDUSTAN AERO'], symbol: 'NSE:HAL',      name: 'HAL' },
  { keywords: ['BEL', 'BHARAT ELECTRONICS'], symbol: 'NSE:BEL',  name: 'BEL' },
  { keywords: ['TRENT'],               symbol: 'NSE:TRENT',      name: 'Trent' },
  { keywords: ['IRCTC'],               symbol: 'NSE:IRCTC',      name: 'IRCTC' },

  // ─── US Markets ───
  { keywords: ['S&P 500', 'S&P500', 'SPX'],   symbol: 'SP:SPX',         name: 'S&P 500' },
  { keywords: ['NASDAQ', 'NASDAQ COMPOSITE'],  symbol: 'NASDAQ:IXIC',    name: 'NASDAQ' },
  { keywords: ['DOW JONES', 'DOW', 'DJIA'],    symbol: 'DJ:DJI',         name: 'Dow Jones' },
  { keywords: ['RUSSELL 2000'],                 symbol: 'RUSSELL:RUT',    name: 'Russell 2000' },

  // ─── US Stocks ───
  { keywords: ['APPLE', 'AAPL'],       symbol: 'NASDAQ:AAPL',    name: 'Apple' },
  { keywords: ['MICROSOFT', 'MSFT'],   symbol: 'NASDAQ:MSFT',    name: 'Microsoft' },
  { keywords: ['GOOGLE', 'GOOGL', 'ALPHABET'], symbol: 'NASDAQ:GOOGL', name: 'Google' },
  { keywords: ['AMAZON', 'AMZN'],      symbol: 'NASDAQ:AMZN',    name: 'Amazon' },
  { keywords: ['NVIDIA', 'NVDA'],      symbol: 'NASDAQ:NVDA',    name: 'Nvidia' },
  { keywords: ['TESLA', 'TSLA'],       symbol: 'NASDAQ:TSLA',    name: 'Tesla' },
  { keywords: ['META'],                symbol: 'NASDAQ:META',    name: 'Meta' },

  // ─── Crypto ───
  { keywords: ['BITCOIN', 'BTC'],      symbol: 'BINANCE:BTCUSDT',  name: 'Bitcoin' },
  { keywords: ['ETHEREUM', 'ETH'],     symbol: 'BINANCE:ETHUSDT',  name: 'Ethereum' },
  { keywords: ['SOLANA', 'SOL'],       symbol: 'BINANCE:SOLUSDT',  name: 'Solana' },
  { keywords: ['XRP', 'RIPPLE'],       symbol: 'BINANCE:XRPUSDT',  name: 'XRP' },
  { keywords: ['CARDANO', 'ADA'],      symbol: 'BINANCE:ADAUSDT',  name: 'Cardano' },
  { keywords: ['DOGECOIN', 'DOGE'],    symbol: 'BINANCE:DOGEUSDT', name: 'Dogecoin' },
  { keywords: ['AVALANCHE', 'AVAX'],   symbol: 'BINANCE:AVAXUSDT', name: 'Avalanche' },
  { keywords: ['POLKADOT', 'DOT'],     symbol: 'BINANCE:DOTUSDT',  name: 'Polkadot' },
  { keywords: ['CHAINLINK', 'LINK'],   symbol: 'BINANCE:LINKUSDT', name: 'Chainlink' },
  { keywords: ['POLYGON', 'POL', 'MATIC'], symbol: 'BINANCE:POLUSDT', name: 'Polygon' },
  { keywords: ['UNISWAP', 'UNI'],      symbol: 'BINANCE:UNIUSDT',  name: 'Uniswap' },
  { keywords: ['LITECOIN', 'LTC'],     symbol: 'BINANCE:LTCUSDT',  name: 'Litecoin' },
  { keywords: ['NEAR PROTOCOL', 'NEAR'], symbol: 'BINANCE:NEARUSDT', name: 'NEAR' },
  { keywords: ['TONCOIN', 'TON'],      symbol: 'OKX:TONUSDT',      name: 'Toncoin' },
  { keywords: ['BNB', 'BINANCE COIN'], symbol: 'BINANCE:BNBUSDT',  name: 'BNB' },
  { keywords: ['SHIBA', 'SHIB'],       symbol: 'BINANCE:SHIBUSDT', name: 'Shiba Inu' },
  { keywords: ['PEPE'],                symbol: 'BINANCE:PEPEUSDT', name: 'PEPE' },

  // ─── Commodities ───
  { keywords: ['GOLD', 'XAUUSD'],      symbol: 'OANDA:XAUUSD',   name: 'Gold' },
  { keywords: ['SILVER', 'XAGUSD'],    symbol: 'OANDA:XAGUSD',   name: 'Silver' },
  { keywords: ['CRUDE OIL', 'WTI', 'CRUDE'], symbol: 'NYMEX:CL1!', name: 'Crude Oil' },
  { keywords: ['BRENT'],               symbol: 'NYMEX:BZ1!',     name: 'Brent' },
  { keywords: ['NATURAL GAS'],         symbol: 'NYMEX:NG1!',     name: 'Natural Gas' },
  { keywords: ['COPPER'],              symbol: 'COMEX:HG1!',     name: 'Copper' },

  // ─── Forex ───
  { keywords: ['DXY', 'DOLLAR INDEX'], symbol: 'TVC:DXY',        name: 'DXY' },
  { keywords: ['USD/INR', 'USDINR'],   symbol: 'FX_IDC:USDINR',  name: 'USD/INR' },
  { keywords: ['EUR/USD', 'EURUSD'],   symbol: 'FX:EURUSD',      name: 'EUR/USD' },
  { keywords: ['GBP/USD', 'GBPUSD'],   symbol: 'FX:GBPUSD',      name: 'GBP/USD' },
  { keywords: ['USD/JPY', 'USDJPY'],   symbol: 'FX:USDJPY',      name: 'USD/JPY' },

  // ─── Volatility ───
  { keywords: ['VIX', 'CBOE VIX'],     symbol: 'TVC:VIX',        name: 'VIX' },
  { keywords: ['INDIA VIX'],           symbol: 'NSE:INDIAVIX',   name: 'India VIX' },
];

// Pre-build a sorted list (longer keywords first to avoid partial matches)
const SORTED_ENTRIES = TICKER_MAP.flatMap(entry =>
  entry.keywords.map(kw => ({ keyword: kw, symbol: entry.symbol, name: entry.name }))
).sort((a, b) => b.keyword.length - a.keyword.length);

/**
 * Scan `text` and return de-duplicated list of recognised tickers.
 * Already excludes the primary `[CHART_ACTION]` symbol if provided.
 */
export function extractTickers(text: string, excludeSymbol?: string): TickerMatch[] {
  const upper = text.toUpperCase();
  const seen = new Set<string>();
  const results: TickerMatch[] = [];

  for (const entry of SORTED_ENTRIES) {
    if (seen.has(entry.symbol)) continue;

    const kw = entry.keyword.toUpperCase();
    // Use word-boundary-aware search: the keyword must not be part of a larger word
    const idx = upper.indexOf(kw);
    if (idx === -1) continue;

    // Simple boundary check – char before/after should not be a letter
    const before = idx > 0 ? upper[idx - 1] : ' ';
    const after = idx + kw.length < upper.length ? upper[idx + kw.length] : ' ';
    const isWordBefore = /[A-Z]/.test(before);
    const isWordAfter = /[A-Z]/.test(after);
    if (isWordBefore || isWordAfter) continue;

    // Skip if this is the primary chart action symbol
    if (excludeSymbol && entry.symbol === excludeSymbol) {
      seen.add(entry.symbol);
      continue;
    }

    seen.add(entry.symbol);
    results.push({ symbol: entry.symbol, name: entry.name });
  }

  return results;
}
