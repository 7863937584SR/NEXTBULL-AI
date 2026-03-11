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

import { fetchYahooQuotes } from '@/services/yahooClient';

export interface StockTickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

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
    // ── 1. Indian market indices via Edge Function (single batch request) ──
    const indexSymbols = ['^NSEI', '^BSESN', '^NSEBANK', '^INDIAVIX'];
    const indexQuotes = await fetchYahooQuotes(indexSymbols);

    const toIndex = (sym: string, fallbackVal: number): IndexData => {
      const q = indexQuotes[sym];
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
      nifty: toIndex('^NSEI', 21850),
      sensex: toIndex('^BSESN', 73745),
      bankNifty: toIndex('^NSEBANK', 47890),
      vix: toIndex('^INDIAVIX', 14.25),
    };
  } catch (error) {
    console.error('Failed to fetch live rates:', error);
    throw new Error('Unable to fetch live market rates. Please check your connection.');
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
  const symbols = TICKER_STOCKS.map(s => s.symbol);
  const quotes = await fetchYahooQuotes(symbols);
  const results: StockTickerItem[] = [];

  for (const s of TICKER_STOCKS) {
    const q = quotes[s.symbol];
    if (q) {
      results.push({ symbol: s.name, price: q.price, change: q.change, changePercent: q.changePercent });
    }
  }

  return results;
};