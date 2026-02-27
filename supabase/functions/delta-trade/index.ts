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
      environment = "global",
      order,
    } = body as {
      api_key?: string;
      api_secret?: string;
      environment?: "global" | "india";
      order?: {
        product_symbol?: string;
        product_id?: number;
        side?: "buy" | "sell";
        size?: number;
        order_type?: string;
        limit_price?: string;
        time_in_force?: string;
        reduce_only?: boolean;
        post_only?: boolean;
        client_order_id?: string;
      };
    };

    if (!api_key || !api_secret) return jsonResponse({ error: "Missing api_key/api_secret" }, 400);
    if (!order?.side || !order?.size || (!order.product_symbol && !order.product_id)) {
      return jsonResponse({ error: "Missing order fields" }, 400);
    }

    const baseUrl = environment === "india"
      ? "https://api.india.delta.exchange"
      : "https://api.delta.exchange";

    const method = "POST";
    const path = "/v2/orders";
    const url = `${baseUrl}${path}`;

    const payloadObj = {
      product_id: order.product_id,
      product_symbol: order.product_symbol,
      side: order.side,
      size: order.size,
      order_type: order.order_type ?? "market_order",
      limit_price: order.limit_price,
      time_in_force: order.time_in_force ?? "gtc",
      reduce_only: Boolean(order.reduce_only ?? false),
      post_only: Boolean(order.post_only ?? false),
      client_order_id: order.client_order_id ?? `nextbull_${Date.now()}`,
    };

    const payload = JSON.stringify(payloadObj);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const prehash = method + timestamp + path + "" + payload;
    const signature = await hmacSha256Hex(api_secret, prehash);

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
      body: payload,
    });

    const text = await deltaRes.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!deltaRes.ok) {
      return jsonResponse({ error: "Delta API error", status: deltaRes.status, data }, 400);
    }

    return jsonResponse({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: msg }, 500);
  }
});
