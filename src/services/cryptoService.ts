export interface CryptoTicker {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPriceUsd: number;
  changePct24h: number | null;
}

export const fetchTopCryptoMovers = async (): Promise<CryptoTicker[]> => {
  const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
  url.searchParams.set('vs_currency', 'usd');
  url.searchParams.set('order', 'market_cap_desc');
  url.searchParams.set('per_page', '50');
  url.searchParams.set('page', '1');
  url.searchParams.set('sparkline', 'false');
  url.searchParams.set('price_change_percentage', '24h');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`CoinGecko error: ${res.status}`);
  }

  const data = (await res.json()) as any[];

  const mapped: CryptoTicker[] = data.map((c) => ({
    id: String(c.id),
    symbol: String(c.symbol || '').toUpperCase(),
    name: String(c.name || ''),
    image: String(c.image || ''),
    currentPriceUsd: Number(c.current_price ?? 0),
    changePct24h: typeof c.price_change_percentage_24h === 'number' ? c.price_change_percentage_24h : null,
  }));

  return mapped
    .filter((c) => Number.isFinite(c.currentPriceUsd))
    .sort((a, b) => Math.abs(b.changePct24h ?? 0) - Math.abs(a.changePct24h ?? 0))
    .slice(0, 10);
};
