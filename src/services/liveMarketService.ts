export interface LiveMarketStatus {
  sessionStatus: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_MARKET';
  volatility: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  spreadStatus: 'TIGHT' | 'NORMAL' | 'WIDE';
  dataFeed: 'LIVE' | 'DELAYED' | 'OFFLINE';
}

export interface IndexData {
  value: number;
  change: number;
  changePercent: number;
}

export interface LiveRates {
  usdInr: { rate: number; change: number; changePercent: number };
  eurUsd: { rate: number; change: number; changePercent: number };
  gbpUsd: { rate: number; change: number; changePercent: number };
  btcUsd: { rate: number; change: number; changePercent: number };
  ethUsd: { rate: number; change: number; changePercent: number };
  solUsd: { rate: number; change: number; changePercent: number };
  nifty: IndexData;
  sensex: IndexData;
  bankNifty: IndexData;
  vix: IndexData;
}

export interface StockTickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

// Helper: fetch a Yahoo Finance chart for a given symbol
const fetchYahooQuote = async (symbol: string): Promise<{ price: number; prevClose: number } | null> => {
  try {
    const res = await fetch(`/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`);
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    return {
      price: meta.regularMarketPrice ?? meta.previousClose ?? 0,
      prevClose: meta.previousClose ?? meta.regularMarketPrice ?? 0,
    };
  } catch {
    return null;
  }
};

export const fetchLiveMarketStatus = async (): Promise<LiveMarketStatus> => {
  try {
    const now = new Date();
    const utcHours = now.getUTCHours();

    let sessionStatus: LiveMarketStatus['sessionStatus'] = 'CLOSED';
    if ((utcHours >= 13 && utcHours < 21) || (utcHours >= 22 && utcHours < 5)) {
      sessionStatus = 'OPEN';
    } else if (utcHours >= 12 && utcHours < 13) {
      sessionStatus = 'PRE_MARKET';
    } else if (utcHours >= 21 && utcHours < 22) {
      sessionStatus = 'AFTER_MARKET';
    }

    return {
      sessionStatus,
      volatility: 'MODERATE',
      spreadStatus: 'NORMAL',
      dataFeed: 'LIVE',
    };
  } catch {
    return { sessionStatus: 'CLOSED', volatility: 'LOW', spreadStatus: 'NORMAL', dataFeed: 'OFFLINE' };
  }
};

// ── Fetch all live rates (indices, forex, crypto) ────────────────────
export const fetchLiveRates = async (): Promise<LiveRates> => {
  try {
    // ── 1. Indian market indices from Yahoo Finance (parallel) ──
    const [niftyQ, sensexQ, bankNiftyQ, vixQ] = await Promise.all([
      fetchYahooQuote('^NSEI'),
      fetchYahooQuote('^BSESN'),
      fetchYahooQuote('^NSEBANK'),
      fetchYahooQuote('^INDIAVIX'),
    ]);

    const toIndex = (q: { price: number; prevClose: number } | null, fallbackVal: number): IndexData => {
      if (!q) return { value: fallbackVal, change: 0, changePercent: 0 };
      const change = q.price - q.prevClose;
      const pct = q.prevClose ? (change / q.prevClose) * 100 : 0;
      return { value: q.price, change, changePercent: pct };
    };

    // ── 2. Forex from Exchange Rate API + historical from Frankfurter ──
    const [forexRes, cryptoRes, historicalRes] = await Promise.all([
      fetch('https://api.exchangerate-api.com/v4/latest/USD').then(r => r.json()).catch(() => null),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true').then(r => r.json()).catch(() => null),
      (() => {
        const y = new Date(); y.setDate(y.getDate() - 1);
        return fetch(`https://api.frankfurter.app/${y.toISOString().split('T')[0]}`).then(r => r.json()).catch(() => null);
      })(),
    ]);

    const rates = forexRes?.rates || {};
    const hRates = historicalRes?.rates || {};
    const calc = (cur: number, prev: number) => {
      const c = cur - prev;
      return { change: c, changePercent: prev ? (c / prev) * 100 : 0 };
    };

    const usdInrCur = rates.INR || 83.25;
    const usdInrPrev = hRates.INR || usdInrCur;
    const eurUsdCur = 1 / (rates.EUR || 0.92);
    const eurUsdPrev = 1 / (hRates.EUR || rates.EUR || 0.92);
    const gbpUsdCur = 1 / (rates.GBP || 0.79);
    const gbpUsdPrev = 1 / (hRates.GBP || rates.GBP || 0.79);

    const btcPrice = cryptoRes?.bitcoin?.usd || 43650;
    const btcChg = cryptoRes?.bitcoin?.usd_24h_change || 0;
    const ethPrice = cryptoRes?.ethereum?.usd || 2345;
    const ethChg = cryptoRes?.ethereum?.usd_24h_change || 0;
    const solPrice = cryptoRes?.solana?.usd || 145;
    const solChg = cryptoRes?.solana?.usd_24h_change || 0;

    return {
      usdInr: { rate: usdInrCur, ...calc(usdInrCur, usdInrPrev) },
      eurUsd: { rate: eurUsdCur, ...calc(eurUsdCur, eurUsdPrev) },
      gbpUsd: { rate: gbpUsdCur, ...calc(gbpUsdCur, gbpUsdPrev) },
      btcUsd: { rate: btcPrice, change: (btcPrice * btcChg) / 100, changePercent: btcChg },
      ethUsd: { rate: ethPrice, change: (ethPrice * ethChg) / 100, changePercent: ethChg },
      solUsd: { rate: solPrice, change: (solPrice * solChg) / 100, changePercent: solChg },
      nifty: toIndex(niftyQ, 21850),
      sensex: toIndex(sensexQ, 73745),
      bankNifty: toIndex(bankNiftyQ, 47890),
      vix: toIndex(vixQ, 14.25),
    };
  } catch (error) {
    console.error('Failed to fetch live rates:', error);
    return {
      usdInr: { rate: 83.25, change: 0.12, changePercent: 0.14 },
      eurUsd: { rate: 1.0847, change: -0.001, changePercent: -0.09 },
      gbpUsd: { rate: 1.2654, change: 0.002, changePercent: 0.16 },
      btcUsd: { rate: 43650, change: 850, changePercent: 1.98 },
      ethUsd: { rate: 2345, change: -45, changePercent: -1.88 },
      solUsd: { rate: 145, change: 4.5, changePercent: 3.2 },
      nifty: { value: 21850, change: 125, changePercent: 0.57 },
      sensex: { value: 73745, change: 320, changePercent: 0.44 },
      bankNifty: { value: 47890, change: -85, changePercent: -0.18 },
      vix: { value: 14.25, change: 0.3, changePercent: 2.15 },
    };
  }
};

// ── Fetch live stock prices for the scrolling ticker ─────────────────
const TICKER_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'RELIANCE' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'INFY.NS', name: 'INFY' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC BANK' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI BANK' },
  { symbol: 'ITC.NS', name: 'ITC' },
  { symbol: 'BHARTIARTL.NS', name: 'BHARTI AIRTEL' },
  { symbol: 'WIPRO.NS', name: 'WIPRO' },
  { symbol: 'SBIN.NS', name: 'SBI' },
  { symbol: 'TATAMOTORS.NS', name: 'TATA MOTORS' },
  { symbol: 'ADANIENT.NS', name: 'ADANI ENT' },
  { symbol: 'LT.NS', name: 'L&T' },
];

export const fetchTickerStocks = async (): Promise<StockTickerItem[]> => {
  const results: StockTickerItem[] = [];

  // Fetch all in parallel for speed
  const quotes = await Promise.all(
    TICKER_STOCKS.map(async (s) => {
      const q = await fetchYahooQuote(s.symbol);
      return { ...s, q };
    })
  );

  for (const { name, q } of quotes) {
    if (q) {
      const change = q.price - q.prevClose;
      const pct = q.prevClose ? (change / q.prevClose) * 100 : 0;
      results.push({ symbol: name, price: q.price, change, changePercent: pct });
    }
  }

  return results;
};