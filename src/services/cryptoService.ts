export interface CryptoTicker {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPriceUsd: number;
  changePct24h: number | null;
}

const fetchJson = async (url: string, timeoutMs = 8000) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
};

const fromCoinGecko = async (): Promise<CryptoTicker[]> => {
  const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
  url.searchParams.set('vs_currency', 'usd');
  url.searchParams.set('order', 'market_cap_desc');
  url.searchParams.set('per_page', '50');
  url.searchParams.set('page', '1');
  url.searchParams.set('sparkline', 'false');
  url.searchParams.set('price_change_percentage', '24h');

  const data = (await fetchJson(url.toString(), 9000)) as any[];
  return data.map((c) => ({
    id: String(c.id),
    symbol: String(c.symbol || '').toUpperCase(),
    name: String(c.name || ''),
    image: String(c.image || ''),
    currentPriceUsd: Number(c.current_price ?? 0),
    changePct24h: typeof c.price_change_percentage_24h === 'number' ? c.price_change_percentage_24h : null,
  }));
};

const fromCoinCap = async (): Promise<CryptoTicker[]> => {
  const data = (await fetchJson('https://api.coincap.io/v2/assets?limit=50', 9000)) as any;
  const arr: any[] = Array.isArray(data?.data) ? data.data : [];
  return arr.map((a) => {
    const symbol = String(a?.symbol || '').toUpperCase();
    const id = String(a?.id || symbol || a?.name || '');
    return {
      id,
      symbol,
      name: String(a?.name || ''),
      image: symbol ? `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png` : '',
      currentPriceUsd: Number(a?.priceUsd ?? 0),
      changePct24h: typeof a?.changePercent24Hr === 'string' || typeof a?.changePercent24Hr === 'number' ? Number(a.changePercent24Hr) : null,
    } as CryptoTicker;
  });
};

export const fetchTopCryptoMovers = async (): Promise<CryptoTicker[]> => {
  let mapped: CryptoTicker[] = [];
  try {
    mapped = await fromCoinGecko();
  } catch {
    mapped = await fromCoinCap();
  }

  return mapped
    .filter((c) => Number.isFinite(c.currentPriceUsd) && c.currentPriceUsd > 0)
    .sort((a, b) => Math.abs(b.changePct24h ?? 0) - Math.abs(a.changePct24h ?? 0))
    .slice(0, 10);
};
