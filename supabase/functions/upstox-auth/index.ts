import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "get_login_url") {
      const { api_key, redirect_uri } = body;
      if (!api_key || !redirect_uri) {
        return new Response(JSON.stringify({ error: "Missing api_key or redirect_uri" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const loginUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${encodeURIComponent(api_key)}&redirect_uri=${encodeURIComponent(redirect_uri)}`;

      return new Response(JSON.stringify({ login_url: loginUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange_token") {
      const { code, api_key, api_secret, redirect_uri } = body;
      if (!code || !api_key || !api_secret || !redirect_uri) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Exchange auth code for access token
      const tokenRes = await fetch("https://api.upstox.com/v2/login/authorization/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
        body: new URLSearchParams({
          code,
          client_id: api_key,
          client_secret: api_secret,
          redirect_uri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        console.error("Upstox token exchange error:", tokenData);
        return new Response(JSON.stringify({ error: tokenData.message || "Token exchange failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Store connection in broker_connections table
      const { error: dbError } = await supabase.from("broker_connections").upsert({
        user_id: user.id,
        broker: "upstox",
        access_token: tokenData.access_token,
        token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tokens valid until 3:30 AM next day
        broker_user_id: tokenData.user_id || null,
        email: tokenData.email || null,
        user_name: tokenData.user_name || null,
        is_active: true,
      }, { onConflict: "user_id,broker" });

      if (dbError) {
        console.error("DB error storing broker connection:", dbError);
        return new Response(JSON.stringify({ error: "Failed to save connection" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        user_name: tokenData.user_name,
        email: tokenData.email,
        user_id: tokenData.user_id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_status") {
      const { data, error: dbError } = await supabase
        .from("broker_connections")
        .select("broker, is_active, broker_user_id, user_name, email, token_expiry")
        .eq("user_id", user.id)
        .eq("is_active", true);

      return new Response(JSON.stringify({ connections: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      const { broker } = body;
      await supabase
        .from("broker_connections")
        .update({ is_active: false, access_token: null })
        .eq("user_id", user.id)
        .eq("broker", broker);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Upstox auth error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
