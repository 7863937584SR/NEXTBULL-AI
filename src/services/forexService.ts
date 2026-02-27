export interface ForexRateRow {
  pair: string;
  rate: number;
}

export const fetchForexRates = async (): Promise<ForexRateRow[]> => {
  const url = new URL('https://api.frankfurter.app/latest');
  url.searchParams.set('from', 'USD');
  url.searchParams.set('to', 'INR,EUR,GBP,JPY,AUD,CAD,CHF');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Forex API error: ${res.status}`);
  }

  const data = (await res.json()) as any;
  const rates: Record<string, number> = data?.rates || {};

  const rows: ForexRateRow[] = Object.entries(rates)
    .map(([quote, rate]) => ({
      pair: `USD/${quote}`,
      rate: Number(rate),
    }))
    .filter((r) => Number.isFinite(r.rate));

  return rows;
};
