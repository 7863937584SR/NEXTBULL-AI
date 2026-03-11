import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Cache crumb + cookie for a few minutes so we don't re-fetch every call
let cachedCrumb: string | null = null;
let cachedCookie: string | null = null;
let crumbExpiry = 0;

async function getYahooCrumb(): Promise<{ crumb: string; cookie: string }> {
  if (cachedCrumb && cachedCookie && Date.now() < crumbExpiry) {
    return { crumb: cachedCrumb, cookie: cachedCookie };
  }

  // Step 1: Get consent cookie from Yahoo
  const consentRes = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA },
    redirect: "manual",
  });
  await consentRes.text();

  const setCookies = consentRes.headers.get("set-cookie") || "";
  const cookieParts = setCookies.split(",").map((c) => c.split(";")[0].trim()).filter(Boolean);
  const cookieHeader = cookieParts.join("; ");

  // Step 2: Get crumb using cookie
  const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
    headers: {
      "User-Agent": UA,
      Cookie: cookieHeader,
    },
  });

  if (!crumbRes.ok) {
    throw new Error(`Failed to get crumb: ${crumbRes.status}`);
  }

  const crumb = await crumbRes.text();

  cachedCrumb = crumb.trim();
  cachedCookie = cookieHeader;
  crumbExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  return { crumb: cachedCrumb, cookie: cachedCookie };
}

interface QuoteResult {
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

async function fetchQuote(symbol: string, cookie: string, crumb: string): Promise<QuoteResult | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m&crumb=${encodeURIComponent(crumb)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Cookie: cookie,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result?.meta) return null;
    const m = result.meta;
    const price = m.regularMarketPrice ?? m.previousClose ?? 0;
    const prevClose = m.previousClose ?? price;
    const change = price - prevClose;
    const pct = prevClose ? (change / prevClose) * 100 : 0;
    return {
      symbol,
      price,
      prevClose,
      change: +change.toFixed(4),
      changePercent: +pct.toFixed(4),
      open: m.regularMarketOpen ?? price,
      high: m.regularMarketDayHigh ?? price,
      low: m.regularMarketDayLow ?? price,
      volume: m.regularMarketVolume ?? 0,
      name: m.shortName || m.longName || symbol,
      fiftyTwoWeekHigh: m.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: m.fiftyTwoWeekLow,
    };
  } catch (e) {
    console.warn(`Yahoo fetch failed for ${symbol}:`, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const symbols: string[] = Array.isArray(body.symbols) ? body.symbols : body.symbol ? [body.symbol] : [];

    if (symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: "Provide 'symbols' array or 'symbol' string", quotes: {} }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cap at 30 symbols per request
    const batch = symbols.slice(0, 30);

    const { crumb, cookie } = await getYahooCrumb();

    const results = await Promise.allSettled(
      batch.map((s) => fetchQuote(s, cookie, crumb))
    );

    const quotes: Record<string, QuoteResult | null> = {};
    results.forEach((r, i) => {
      quotes[batch[i]] = r.status === "fulfilled" ? r.value : null;
    });

    return new Response(
      JSON.stringify({ quotes, fetchedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("yahoo-finance error:", msg);
    return new Response(
      JSON.stringify({ error: msg, quotes: {} }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
