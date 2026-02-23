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

/**
 * Fetch all market indices data.
 */
export const fetchMarketIndices = async (): Promise<NseIndexData[]> => {
    await ensureSessionCookie();
    try {
        const response = await nseClient.get('/allIndices');
        return response.data.data; // The array is usually inside the `data` property
    } catch (error) {
        console.error("Error fetching market indices:", error);
        throw error;
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
