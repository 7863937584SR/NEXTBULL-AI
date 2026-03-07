import axios from 'axios';

// Since we're using a proxy in Vite, we just point to the relative `/api/nse` path
// which will be rewritten to `https://www.nseindia.com/api`.
const BASE_URL = '/api/nse';

// Axios instance with default headers
const nseClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
    }
});

// NSE often requires a valid session cookie before hitting the data APIs.
// We ping the homepage first to establish the cookie.
let cookiesFetched = false;

const ensureSessionCookie = async () => {
    if (cookiesFetched) return;
    try {
        // We can hit the root of the site (via proxy) to get cookies
        await axios.get('/api/nse/../', {
            baseURL: window.location.origin // Just to ping the proxy root
        });
        cookiesFetched = true;
    } catch (error) {
        console.warn("Failed to fetch initial NSE cookies. API calls might fail.", error);
    }
};

export interface NseIndexData {
    index: string;
    last: number;
    variation: number;
    percentChange: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    yearHigh: number;
    yearLow: number;
}

export interface NseStockData {
    symbol: string;
    series: string;
    openPrice: number;
    highPrice: number;
    lowPrice: number;
    ltp: number; // Last Traded Price
    previousPrice: number;
    netPrice: number;
    tradeInfo: {
        tradedVolume: number;
        value: number;
    };
}

export const fetchMarketIndices = async (): Promise<NseIndexData[]> => {
    await ensureSessionCookie();
    try {
        // Try Yahoo Finance first for Indian indices (more reliable)
        const nseSymbols = [
            { symbol: '^NSEI', index: 'NIFTY 50' },
            { symbol: '^NSEBANK', index: 'NIFTY BANK' },
            { symbol: '^CNXIT', index: 'NIFTY IT' },
            { symbol: '^CNXFIN', index: 'NIFTY FIN SERVICE' },
            { symbol: '^CNXAUTO', index: 'NIFTY AUTO' },
        ];
        
        const indices: NseIndexData[] = [];
        for (const { symbol, index } of nseSymbols) {
            try {
                const response = await fetch(`/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`);
                if (response.ok) {
                    const data = await response.json();
                    const result = data?.chart?.result?.[0];
                    if (result) {
                        const meta = result.meta;
                        const current = meta.regularMarketPrice || meta.previousClose;
                        const prevClose = meta.previousClose;
                        const variation = current - prevClose;
                        const percentChange = (variation / prevClose) * 100;
                        
                        indices.push({
                            index,
                            last: current,
                            variation,
                            percentChange,
                            open: meta.regularMarketOpen || current,
                            high: meta.regularMarketDayHigh || current,
                            low: meta.regularMarketDayLow || current,
                            previousClose: prevClose,
                            yearHigh: meta.fiftyTwoWeekHigh || current * 1.2,
                            yearLow: meta.fiftyTwoWeekLow || current * 0.8,
                        });
                    }
                }
            } catch (error) {
                console.warn(`Failed to fetch ${symbol} from Yahoo Finance:`, error);
            }
        }
        
        // If we got live data, return it
        if (indices.length > 0) {
            return indices;
        }
        
        // Fallback to NSE API
        const response = await nseClient.get('/allIndices');
        return response.data.data;
    } catch (error) {
        console.error("Error fetching market indices:", error);
        throw new Error('Unable to fetch live market indices. Please try again.');
    }
};

/**
 * Fetch top gainers
 */
export const fetchTopGainers = async (): Promise<NseStockData[]> => {
    await ensureSessionCookie();
    try {
        // The endpoint `live-analysis-variations?index=gainers` returns top gainers
        const response = await nseClient.get('/live-analysis-variations', {
            params: { index: 'gainers' }
        });
        // Returns data grouped under NIFTY format usually
        return response.data?.NIFTY?.data || [];
    } catch (error) {
        console.error("Error fetching top gainers:", error);
        throw error;
    }
};

/**
 * Fetch top losers
 */
export const fetchTopLosers = async (): Promise<NseStockData[]> => {
    await ensureSessionCookie();
    try {
        const response = await nseClient.get('/live-analysis-variations', {
            params: { index: 'loosers' } // Note the spelling NSE uses
        });
        return response.data?.NIFTY?.data || [];
    } catch (error) {
        console.error("Error fetching top losers:", error);
        throw error;
    }
};
