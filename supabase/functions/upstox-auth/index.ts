import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* ═══════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════ */

async function sha256Hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ═══════════════════════════════════════════════════════════
   BROKER OAuth CONFIGURATIONS
   
   Each broker reads API key + secret from Supabase secrets
   (env vars). The server admin must set these:
   
   npx supabase secrets set \
     ZERODHA_API_KEY=xxx ZERODHA_API_SECRET=xxx \
     UPSTOX_API_KEY=xxx UPSTOX_API_SECRET=xxx \
     ANGELONE_API_KEY=xxx ANGELONE_API_SECRET=xxx \
     DHAN_CLIENT_ID=xxx DHAN_SECRET=xxx \
     FYERS_APP_ID=xxx FYERS_SECRET=xxx \
     FIVEPAISA_APP_KEY=xxx FIVEPAISA_SECRET=xxx \
     --project-ref YOUR_PROJECT_REF
   ═══════════════════════════════════════════════════════════ */

interface TokenResult {
  access_token: string;
  user_id?: string | null;
  user_name?: string | null;
  email?: string | null;
  expires_in?: number;
}

interface BrokerConfig {
  name: string;
  envKey: string;
  envSecret: string;
  buildLoginUrl: (apiKey: string, redirectUri: string) => string;
  exchangeCode: (p: {
    code: string;
    apiKey: string;
    apiSecret: string;
    redirectUri: string;
  }) => Promise<TokenResult>;
}

const BROKER_OAUTH: Record<string, BrokerConfig> = {
  /* ─── Zerodha (Kite Connect v3) ─── */
  zerodha: {
    name: "Zerodha",
    envKey: "ZERODHA_API_KEY",
    envSecret: "ZERODHA_API_SECRET",
    buildLoginUrl: (apiKey) =>
      `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(apiKey)}`,
    exchangeCode: async ({ code, apiKey, apiSecret }) => {
      // Zerodha checksum = SHA-256(api_key + request_token + api_secret)
      const checksum = await sha256Hex(apiKey + code + apiSecret);
      const res = await fetch("https://api.kite.trade/session/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Kite-Version": "3",
        },
        body: new URLSearchParams({
          api_key: apiKey,
          request_token: code,
          checksum,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Zerodha error ${res.status}`);
      const d = data.data || data;
      return {
        access_token: d.access_token,
        user_id: d.user_id,
        user_name: d.user_name || d.user_id,
        email: d.email || null,
      };
    },
  },

  /* ─── Upstox (v2 OAuth) ─── */
  upstox: {
    name: "Upstox",
    envKey: "UPSTOX_API_KEY",
    envSecret: "UPSTOX_API_SECRET",
    buildLoginUrl: (apiKey, redirectUri) =>
      `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${encodeURIComponent(apiKey)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    exchangeCode: async ({ code, apiKey, apiSecret, redirectUri }) => {
      const res = await fetch(
        "https://api.upstox.com/v2/login/authorization/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: new URLSearchParams({
            code,
            client_id: apiKey,
            client_secret: apiSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Upstox error ${res.status}`);
      return {
        access_token: data.access_token,
        user_id: data.user_id || null,
        user_name: data.user_name || data.user_id || null,
        email: data.email || null,
      };
    },
  },

  /* ─── Angel One (SmartAPI Publisher Login) ─── */
  angelone: {
    name: "Angel One",
    envKey: "ANGELONE_API_KEY",
    envSecret: "ANGELONE_API_SECRET",
    buildLoginUrl: (apiKey) =>
      `https://smartapi.angelone.in/publisher-login?api_key=${encodeURIComponent(apiKey)}`,
    exchangeCode: async ({ code }) => {
      // Angel One publisher login returns JWT token directly in the redirect
      return { access_token: code, user_name: null, email: null };
    },
  },

  /* ─── Dhan (DhanHQ — Direct Access Token from portal) ─── */
  dhan: {
    name: "Dhan",
    envKey: "DHAN_CLIENT_ID",
    envSecret: "DHAN_ACCESS_TOKEN",
    buildLoginUrl: () => "__DIRECT_TOKEN__", // Dhan uses pre-issued token, no OAuth redirect
    exchangeCode: async ({ apiKey }) => {
      // Dhan's SELF token is pre-issued from their portal — no exchange needed.
      // The access token is stored in DHAN_ACCESS_TOKEN env var.
      const directToken = Deno.env.get("DHAN_ACCESS_TOKEN");
      if (!directToken) throw new Error("DHAN_ACCESS_TOKEN not configured");
      return {
        access_token: directToken,
        user_id: apiKey, // dhanClientId
        user_name: `Dhan-${apiKey}`,
        email: null,
      };
    },
  },

  /* ─── Fyers (v3 OAuth) ─── */
  fyers: {
    name: "Fyers",
    envKey: "FYERS_APP_ID",
    envSecret: "FYERS_SECRET",
    buildLoginUrl: (appId, redirectUri) =>
      `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=nextbull`,
    exchangeCode: async ({ code, apiKey, apiSecret }) => {
      // Fyers: appIdHash = SHA-256(appId:secret)
      const appIdHash = await sha256Hex(`${apiKey}:${apiSecret}`);
      const res = await fetch(
        "https://api-t1.fyers.in/api/v3/validate-authcode",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "authorization_code",
            appIdHash,
            code,
          }),
        }
      );
      const data = await res.json();
      if (data.s !== "ok" && data.code !== 200) {
        throw new Error(data?.message || "Fyers error");
      }
      return {
        access_token: data.access_token,
        user_name: data.data?.name || null,
        email: data.data?.email || null,
      };
    },
  },

  /* ─── 5Paisa (Vendor Login) ─── */
  fivepaisa: {
    name: "5Paisa",
    envKey: "FIVEPAISA_APP_KEY",
    envSecret: "FIVEPAISA_SECRET",
    buildLoginUrl: (appKey, redirectUri) =>
      `https://dev-openapi.5paisa.com/WebVendorLogin/VLogin/Index?VendorKey=${encodeURIComponent(appKey)}&ResponseURL=${encodeURIComponent(redirectUri)}`,
    exchangeCode: async ({ code }) => {
      // 5Paisa returns RequestToken in the callback
      return { access_token: code };
    },
  },
};

/* ═══════════════════════════════════════════════════════════
   EDGE FUNCTION
   
   Actions:
     initiate  → Get broker login URL (server reads API key from env)
     callback  → Exchange auth code for token, store in DB
     disconnect→ Deactivate a connection
     status    → List connections + which brokers are configured
     exchange_token → Legacy (frontend sends keys — backward compat)
   ═══════════════════════════════════════════════════════════ */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── Auth ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" });
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: "Invalid token" });

    const body = await req.json();
    const { action } = body;

    // ═══════════════════════════════════════
    // ACTION: initiate
    // Returns the broker's OAuth login URL
    // ═══════════════════════════════════════
    if (action === "initiate") {
      const { broker, redirect_uri } = body;
      if (!broker) return json({ error: "Missing broker" });

      const config = BROKER_OAUTH[broker];
      if (!config) {
        return json(
          {
            error: `Broker "${broker}" does not support OAuth login. Use API key connection instead.`,
          }
        );
      }

      const apiKey = Deno.env.get(config.envKey);
      if (!apiKey) {
        // Return 200 with error field so Supabase client doesn't throw.
        // The frontend checks data.error to handle this gracefully.
        return json({
          error: "not_configured",
          message: `${config.name} is not configured yet. Server admin needs to set ${config.envKey} and ${config.envSecret} in Supabase secrets.`,
          broker,
          broker_name: config.name,
        });
      }

      const loginUrl = config.buildLoginUrl(apiKey, redirect_uri || "");

      // Direct-token brokers (e.g. Dhan) have a pre-issued token — no OAuth redirect needed
      if (loginUrl === "__DIRECT_TOKEN__") {
        console.log(`[BROKER] ${config.name} is a direct-token broker, auto-connecting for user ${user.id}`);

        const accessToken = Deno.env.get(config.envSecret);
        if (!accessToken) {
          return json({ error: "not_configured", message: `${config.name} access token not set.`, broker, broker_name: config.name });
        }

        const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Trader";

        const { error: dbError } = await supabase
          .from("broker_connections")
          .upsert(
            {
              user_id: user.id,
              broker,
              access_token: accessToken,
              token_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              broker_user_id: apiKey,
              email: user.email || null,
              user_name: displayName,
              is_active: true,
              connection_method: "direct_token",
            },
            { onConflict: "user_id,broker" }
          );

        if (dbError) {
          console.error(`[BROKER] DB error for ${config.name}:`, dbError);
          return json({ error: "Failed to save connection" });
        }

        return json({
          direct_connected: true,
          success: true,
          broker,
          broker_name: config.name,
          user_name: displayName,
          user_id: apiKey,
        });
      }

      console.log(
        `[BROKER] ${config.name} login URL generated for user ${user.id}`
      );
      return json({ login_url: loginUrl, broker, broker_name: config.name });
    }

    // ═══════════════════════════════════════
    // ACTION: callback
    // Exchange auth code for token → store in DB
    // ═══════════════════════════════════════
    if (action === "callback") {
      const { broker, code, redirect_uri } = body;
      if (!broker || !code)
        return json({ error: "Missing broker or code" });

      const config = BROKER_OAUTH[broker];
      if (!config) return json({ error: `Unknown broker: ${broker}` });

      const apiKey = Deno.env.get(config.envKey);
      const apiSecret = Deno.env.get(config.envSecret);
      if (!apiKey || !apiSecret) {
        return json(
          { error: `${config.name} server credentials not configured` }
        );
      }

      console.log(
        `[BROKER] ${config.name} token exchange for user ${user.id}...`
      );

      const result = await config.exchangeCode({
        code,
        apiKey,
        apiSecret,
        redirectUri: redirect_uri || "",
      });

      console.log(
        `[BROKER] ${config.name} token exchange OK. Broker user: ${result.user_name || result.user_id || "unknown"}`
      );

      // Save to database
      const displayName =
        result.user_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Trader";

      const { error: dbError } = await supabase
        .from("broker_connections")
        .upsert(
          {
            user_id: user.id,
            broker,
            access_token: result.access_token,
            token_expiry: result.expires_in
              ? new Date(
                  Date.now() + result.expires_in * 1000
                ).toISOString()
              : new Date(
                  Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(),
            broker_user_id: result.user_id || null,
            email: result.email || user.email || null,
            user_name: displayName,
            is_active: true,
            connection_method: "oauth",
          },
          { onConflict: "user_id,broker" }
        );

      if (dbError) {
        console.error(`[BROKER] DB error for ${config.name}:`, dbError);
        return json({ error: "Failed to save connection to database" });
      }

      return json({
        success: true,
        broker,
        broker_name: config.name,
        user_name: displayName,
        user_id: result.user_id,
        email: result.email,
      });
    }

    // ═══════════════════════════════════════
    // ACTION: disconnect
    // ═══════════════════════════════════════
    if (action === "disconnect") {
      const { broker } = body;
      if (!broker) return json({ error: "Missing broker" });

      const { error } = await supabase
        .from("broker_connections")
        .update({ is_active: false, access_token: null })
        .eq("user_id", user.id)
        .eq("broker", broker);

      if (error) return json({ error: error.message });
      return json({ success: true });
    }

    // ═══════════════════════════════════════
    // ACTION: status
    // Returns all active connections + which brokers have credentials
    // ═══════════════════════════════════════
    if (action === "status") {
      const { data } = await supabase
        .from("broker_connections")
        .select(
          "broker, is_active, broker_user_id, user_name, email, token_expiry, connection_method"
        )
        .eq("user_id", user.id)
        .eq("is_active", true);

      // Check which brokers have server-side API credentials configured
      const configured: Record<string, boolean> = {};
      for (const [key, config] of Object.entries(BROKER_OAUTH)) {
        configured[key] = !!Deno.env.get(config.envKey);
      }

      return json({ connections: data || [], configured });
    }

    // ═══════════════════════════════════════
    // LEGACY: exchange_token
    // (Old flow — frontend sends api_key + api_secret directly)
    // Kept for backward compatibility
    // ═══════════════════════════════════════
    if (action === "exchange_token") {
      const { code, api_key, api_secret, redirect_uri, broker = "upstox" } =
        body;
      if (!code || !api_key || !api_secret || !redirect_uri) {
        return json({ error: "Missing required fields" });
      }

      const config = BROKER_OAUTH[broker];
      if (!config) return json({ error: `Unsupported broker: ${broker}` });

      const result = await config.exchangeCode({
        code,
        apiKey: api_key,
        apiSecret: api_secret,
        redirectUri: redirect_uri,
      });

      const displayName =
        result.user_name ||
        user.user_metadata?.full_name ||
        "Trader";

      const { error: dbError } = await supabase
        .from("broker_connections")
        .upsert(
          {
            user_id: user.id,
            broker,
            access_token: result.access_token,
            token_expiry: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
            broker_user_id: result.user_id || null,
            email: result.email || user.email || null,
            user_name: displayName,
            is_active: true,
            connection_method: "api",
          },
          { onConflict: "user_id,broker" }
        );

      if (dbError) {
        console.error("DB error:", dbError);
        return json({ error: "Failed to save connection" });
      }

      return json({
        success: true,
        user_name: displayName,
        email: result.email,
        user_id: result.user_id,
      });
    }

    return json({ error: `Invalid action: ${action}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[BROKER] Error:", msg);
    return json({ error: msg });
  }
});
