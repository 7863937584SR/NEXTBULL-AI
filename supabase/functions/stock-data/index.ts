import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOP_SYMBOLS = new Set([
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
  "HINDUNILVR", "ITC", "SBIN", "BHARTIARTL", "TATAMOTORS",
  "WIPRO", "ADANIENT",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // First get a session cookie from NSE homepage
    const homeRes = await fetch("https://www.nseindia.com", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const cookies = homeRes.headers.get("set-cookie") || "";
    await homeRes.text(); // consume body
    console.log("Got NSE cookies:", cookies ? "yes" : "no");

    // Extract cookies for subsequent requests
    const cookieHeader = cookies.split(",").map(c => c.split(";")[0].trim()).join("; ");

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.nseindia.com/",
      "Cookie": cookieHeader,
    };

    // Fetch NIFTY 50 data (includes top stocks)
    const niftyUrl = "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050";
    const niftyRes = await fetch(niftyUrl, { headers });

    if (!niftyRes.ok) {
      const text = await niftyRes.text();
      console.error("NSE API error:", niftyRes.status, text.slice(0, 200));
      throw new Error(`NSE API returned ${niftyRes.status}`);
    }

    const niftyData = await niftyRes.json();
    console.log("NSE data received, stocks:", niftyData.data?.length || 0);

    const allStockData = niftyData.data || [];

    // First entry is the index itself
    const niftyIndex = allStockData.find((d: Record<string, unknown>) => d.symbol === "NIFTY 50");
    const indices = [];

    if (niftyIndex) {
      indices.push({
        name: "NIFTY 50",
        value: niftyIndex.lastPrice || 0,
        change: niftyIndex.change || 0,
        changePercent: +(niftyIndex.pChange || 0).toFixed(2),
        isError: false,
      });
    } else {
      indices.push({ name: "NIFTY 50", value: 0, change: 0, changePercent: 0, isError: true });
    }

    // Try to get SENSEX
    try {
      const sensexUrl = "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20BANK";
      const sensexRes = await fetch(sensexUrl, { headers });
      const sensexData = await sensexRes.json();
      const bankIndex = sensexData.data?.find((d: Record<string, unknown>) => d.symbol === "NIFTY BANK");
      if (bankIndex) {
        indices.push({
          name: "NIFTY BANK",
          value: bankIndex.lastPrice || 0,
          change: bankIndex.change || 0,
          changePercent: +(bankIndex.pChange || 0).toFixed(2),
          isError: false,
        });
      }
    } catch { /* skip */ }

    // Filter top stocks
    const stocks = allStockData
      .filter((d: Record<string, unknown>) => TOP_SYMBOLS.has(d.symbol as string))
      .map((d: Record<string, unknown>) => {
        const vol = (d.totalTradedVolume as number) || 0;
        const volumeStr = vol >= 1_000_000 ? (vol / 1_000_000).toFixed(1) + "M" : vol >= 1_000 ? (vol / 1_000).toFixed(1) + "K" : vol.toString();
        return {
          symbol: d.symbol as string,
          name: (d.meta as Record<string, unknown>)?.companyName as string || d.symbol as string,
          price: d.lastPrice as number || 0,
          change: +(d.change as number || 0).toFixed(2),
          changePercent: +(d.pChange as number || 0).toFixed(2),
          high: d.dayHigh as number || 0,
          low: d.dayLow as number || 0,
          volume: volumeStr,
          isError: false,
        };
      });

    return new Response(
      JSON.stringify({ stocks, indices, fetchedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Stock data fetch error:", msg);
    return new Response(
      JSON.stringify({ error: msg, stocks: [], indices: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
