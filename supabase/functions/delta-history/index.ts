import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

    const body = await req.json();
    const {
      api_key,
      api_secret,
      environment = "india",
      page_size = 50,
      after = undefined,
    } = body as {
      api_key?: string;
      api_secret?: string;
      environment?: "global" | "india" | "testnet" | "india_testnet";
      page_size?: number;
      after?: string;
    };

    if (!api_key || !api_secret) return jsonResponse({ error: "Missing api_key/api_secret" }, 400);

    let baseUrl = "https://api.delta.exchange";
    if (environment === "india") baseUrl = "https://api.india.delta.exchange";
    if (environment === "testnet") baseUrl = "https://testnet-api.delta.exchange";
    if (environment === "india_testnet") baseUrl = "https://cdn-ind.testnet.deltaex.org";

    const makeDeltaRequest = async (method: string, path: string, queryParams: Record<string, string> = {}) => {
      const qs = new URLSearchParams(queryParams).toString();
      const fullPath = qs ? `${path}?${qs}` : path;
      const url = `${baseUrl}${fullPath}`;

      const timestamp = String(Math.floor(Date.now() / 1000));
      const signaturePayload = method + timestamp + path + (qs ? `?${qs}` : "") + "";
      const signature = await hmacSha256Hex(api_secret!, signaturePayload);

      const deltaRes = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "nextbull-edge-function",
          "api-key": api_key!,
          timestamp,
          signature,
        },
      });

      const text = await deltaRes.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (!deltaRes.ok) {
        const errorDetail = data?.error?.message || data?.message || text;
        throw new Error(JSON.stringify({ error: "Delta API error", detail: errorDetail, status: deltaRes.status }));
      }
      return data;
    };

    // Fetch order history, fills/trades, and current positions in parallel
    const queryParams: Record<string, string> = {
      page_size: String(page_size),
      states: "closed,cancelled,filled",
    };
    if (after) queryParams.after = after;

    const [ordersData, fillsData, positionsData, balancesData] = await Promise.all([
      makeDeltaRequest("GET", "/v2/orders", queryParams).catch(() => ({ result: [] })),
      makeDeltaRequest("GET", "/v2/fills", { page_size: String(page_size) }).catch(() => ({ result: [] })),
      makeDeltaRequest("GET", "/v2/positions/margined").catch(() => ({ result: [] })),
      makeDeltaRequest("GET", "/v2/wallet/balances").catch(() => ({ result: [] })),
    ]);

    return jsonResponse({
      success: true,
      orders: ordersData?.result || [],
      fills: fillsData?.result || [],
      positions: positionsData?.result || [],
      balances: balancesData?.result || [],
    });

  } catch (err) {
    let errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Function Error:", errMsg);
    try {
      const parsedErr = JSON.parse(errMsg);
      return jsonResponse(parsedErr, parsedErr.status || 500);
    } catch {
      return jsonResponse({ error: errMsg }, 500);
    }
  }
});
