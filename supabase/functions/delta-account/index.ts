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
      environment = "global"
    } = body as {
      api_key?: string;
      api_secret?: string;
      environment?: "global" | "india" | "testnet" | "india_testnet";
    };

    if (!api_key || !api_secret) return jsonResponse({ error: "Missing api_key/api_secret" }, 400);

    let baseUrl = "https://api.delta.exchange";
    if (environment === "india") baseUrl = "https://api.india.delta.exchange";
    if (environment === "testnet") baseUrl = "https://testnet-api.delta.exchange";
    if (environment === "india_testnet") baseUrl = "https://cdn-ind.testnet.deltaex.org";

    const makeDeltaRequest = async (method: string, path: string, payloadObj: any = {}) => {
      const url = `${baseUrl}${path}`;
      const payload = method === "POST" ? JSON.stringify(payloadObj) : "";

      const timestamp = String(Math.floor(Date.now() / 1000));
      const queryStr = ""; // For GET without query params
      const signaturePayload = method + timestamp + path + queryStr + payload;
      const signature = await hmacSha256Hex(api_secret, signaturePayload);

      const deltaRes = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "nextbull-edge-function",
          "api-key": api_key,
          timestamp,
          signature,
        },
        body: method === "POST" ? payload : undefined,
      });

      const text = await deltaRes.text();
      console.log(`Delta API Response (${path}):`, text);

      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!deltaRes.ok) {
        // Pass through the actual Delta error if available
        const errorDetail = data?.error?.message || data?.message || text;
        throw new Error(JSON.stringify({
          error: "Delta API error",
          detail: errorDetail,
          status: deltaRes.status,
          data
        }));
      }
      return data;
    };

    // Parallel requests to get balances and margined positions
    const [balancesData, positionsData] = await Promise.all([
      makeDeltaRequest("GET", "/v2/wallet/balances"),
      makeDeltaRequest("GET", "/v2/positions/margined")
    ]);

    return jsonResponse({
      success: true,
      balances: balancesData?.result || [],
      positions: positionsData?.result || []
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
