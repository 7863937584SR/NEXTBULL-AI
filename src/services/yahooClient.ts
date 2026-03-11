/**
 * Client-side helper to fetch Yahoo Finance quotes via the Supabase Edge
 * Function `yahoo-finance`.  Batches multiple symbols into one request.
 */

import { supabase } from '@/integrations/supabase/client';

export interface YahooQuote {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  name: string;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

/**
 * Fetch quotes for one or more Yahoo Finance symbols.
 * Returns a map of `symbol → YahooQuote | null`.
 */
export async function fetchYahooQuotes(
  symbols: string[],
): Promise<Record<string, YahooQuote | null>> {
  if (symbols.length === 0) return {};

  try {
    const { data, error } = await supabase.functions.invoke('yahoo-finance', {
      body: { symbols },
    });

    if (error) {
      console.error('yahoo-finance edge fn error:', error);
      return Object.fromEntries(symbols.map(s => [s, null]));
    }

    return (data?.quotes as Record<string, YahooQuote | null>) ?? {};
  } catch (err) {
    console.error('fetchYahooQuotes failed:', err);
    return Object.fromEntries(symbols.map(s => [s, null]));
  }
}

/**
 * Convenience wrapper: fetch a single symbol and return a simpler shape.
 */
export async function fetchSingleYahooQuote(
  symbol: string,
): Promise<{ price: number; prevClose: number } | null> {
  const quotes = await fetchYahooQuotes([symbol]);
  const q = quotes[symbol];
  if (!q) return null;
  return { price: q.price, prevClose: q.prevClose };
}
