import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── OTP STORE (in-memory, per-instance — production should use Redis/DB) ──
const otpStore = new Map<string, { otp: string; expiresAt: number; broker: string }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    const body = await req.json();
    const { action } = body;

    // ═══════════════════════════════════════════
    // ACTION: get_login_url (OAuth for Upstox / Zerodha)
    // ═══════════════════════════════════════════
    if (action === "get_login_url") {
      const { api_key, redirect_uri, broker = "upstox" } = body;
      if (!api_key || !redirect_uri) {
        return jsonResponse({ error: "Missing api_key or redirect_uri" }, 400);
      }

      let loginUrl = "";

      if (broker === "upstox") {
        loginUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${encodeURIComponent(api_key)}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
      } else if (broker === "zerodha") {
        loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(api_key)}`;
      } else {
        return jsonResponse({ error: `OAuth not supported for broker: ${broker}` }, 400);
      }

      return jsonResponse({ login_url: loginUrl });
    }

    // ═══════════════════════════════════════════
    // ACTION: exchange_token (OAuth callback)
    // ═══════════════════════════════════════════
    if (action === "exchange_token") {
      const { code, api_key, api_secret, redirect_uri, broker = "upstox" } = body;
      if (!code || !api_key || !api_secret || !redirect_uri) {
        return jsonResponse({ error: "Missing required fields" }, 400);
      }

      let tokenData: Record<string, unknown> = {};

      if (broker === "upstox") {
        const tokenRes = await fetch("https://api.upstox.com/v2/login/authorization/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
          body: new URLSearchParams({ code, client_id: api_key, client_secret: api_secret, redirect_uri, grant_type: "authorization_code" }),
        });
        tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
          console.error("Upstox token exchange error:", tokenData);
          return jsonResponse({ error: (tokenData as any).message || "Token exchange failed" }, 400);
        }
      } else if (broker === "zerodha") {
        // Zerodha Kite Connect token exchange
        const checksum = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(api_key + code + api_secret)
        );
        const checksumHex = Array.from(new Uint8Array(checksum))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");

        const tokenRes = await fetch("https://api.kite.trade/session/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Kite-Version": "3" },
          body: new URLSearchParams({ api_key, request_token: code, checksum: checksumHex }),
        });
        tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
          console.error("Zerodha token exchange error:", tokenData);
          return jsonResponse({ error: (tokenData as any).message || "Token exchange failed" }, 400);
        }
        // Normalize Zerodha response
        const kiteData = (tokenData as any).data || tokenData;
        tokenData = {
          access_token: kiteData.access_token,
          user_id: kiteData.user_id,
          user_name: kiteData.user_name || kiteData.user_id,
          email: kiteData.email || null,
        };
      } else {
        return jsonResponse({ error: `OAuth not supported for broker: ${broker}` }, 400);
      }

      // Store connection
      const { error: dbError } = await supabase.from("broker_connections").upsert({
        user_id: user.id,
        broker,
        access_token: tokenData.access_token as string,
        token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        broker_user_id: (tokenData.user_id as string) || null,
        email: (tokenData.email as string) || null,
        user_name: (tokenData.user_name as string) || null,
        is_active: true,
        connection_method: "api",
      }, { onConflict: "user_id,broker" });

      if (dbError) {
        console.error("DB error storing broker connection:", dbError);
        return jsonResponse({ error: "Failed to save connection" }, 500);
      }

      return jsonResponse({
        success: true,
        user_name: tokenData.user_name,
        email: tokenData.email,
        user_id: tokenData.user_id,
      });
    }

    // ═══════════════════════════════════════════
    // ACTION: send_otp (OTP-based connection)
    // ═══════════════════════════════════════════
    if (action === "send_otp") {
      const { phone_number, broker } = body;
      if (!phone_number || !broker) {
        return jsonResponse({ error: "Missing phone_number or broker" }, 400);
      }

      // Validate phone format (Indian: 10 digits)
      const cleanPhone = phone_number.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        return jsonResponse({ error: "Invalid phone number. Must be 10 digits." }, 400);
      }

      // Generate and store OTP
      const otp = generateOtp();
      const key = `${user.id}:${broker}:${cleanPhone}`;
      otpStore.set(key, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 min expiry
        broker,
      });

      console.log(`OTP generated for ${broker} (user: ${user.id}, phone: ***${cleanPhone.slice(-4)}): ${otp}`);

      // In production, integrate with SMS gateway (MSG91, Twilio, etc.)
      // For now, log the OTP and return success

      return jsonResponse({
        success: true,
        message: `OTP sent to +91 ${cleanPhone.slice(-4).padStart(10, "*")}`,
        // DEV ONLY: include OTP in response for testing — remove in production!
        dev_otp: otp,
      });
    }

    // ═══════════════════════════════════════════
    // ACTION: verify_otp
    // ═══════════════════════════════════════════
    if (action === "verify_otp") {
      const { phone_number, broker, otp } = body;
      if (!phone_number || !broker || !otp) {
        return jsonResponse({ error: "Missing phone_number, broker, or otp" }, 400);
      }

      const cleanPhone = phone_number.replace(/\D/g, "");
      const key = `${user.id}:${broker}:${cleanPhone}`;
      const stored = otpStore.get(key);

      if (!stored) {
        return jsonResponse({ error: "No OTP found. Please request a new one." }, 400);
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(key);
        return jsonResponse({ error: "OTP expired. Please request a new one." }, 400);
      }

      if (stored.otp !== otp) {
        return jsonResponse({ error: "Invalid OTP. Please try again." }, 400);
      }

      // OTP verified — clean up
      otpStore.delete(key);

      // Store broker connection
      const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Trader";

      const { error: dbError } = await supabase.from("broker_connections").upsert({
        user_id: user.id,
        broker,
        access_token: null, // No OAuth token for OTP connections
        token_expiry: null,
        broker_user_id: `${broker.toUpperCase()}-${cleanPhone.slice(-4)}`,
        email: user.email || null,
        user_name: displayName,
        phone_number: cleanPhone,
        is_active: true,
        connection_method: "otp",
      }, { onConflict: "user_id,broker" });

      if (dbError) {
        console.error("DB error storing OTP broker connection:", dbError);
        return jsonResponse({ error: "Failed to save connection" }, 500);
      }

      return jsonResponse({
        success: true,
        user_name: displayName,
        broker,
        message: `${broker} account connected successfully via OTP`,
      });
    }

    // ═══════════════════════════════════════════
    // ACTION: get_status
    // ═══════════════════════════════════════════
    if (action === "get_status") {
      const { data } = await supabase
        .from("broker_connections")
        .select("broker, is_active, broker_user_id, user_name, email, token_expiry, phone_number, connection_method")
        .eq("user_id", user.id)
        .eq("is_active", true);

      return jsonResponse({ connections: data || [] });
    }

    // ═══════════════════════════════════════════
    // ACTION: disconnect
    // ═══════════════════════════════════════════
    if (action === "disconnect") {
      const { broker } = body;
      if (!broker) {
        return jsonResponse({ error: "Missing broker name" }, 400);
      }

      await supabase
        .from("broker_connections")
        .update({ is_active: false, access_token: null })
        .eq("user_id", user.id)
        .eq("broker", broker);

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Broker auth error:", msg);
    return jsonResponse({ error: msg }, 500);
  }
});
