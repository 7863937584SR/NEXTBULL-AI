import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth — get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: "Invalid token" });

    // Get user's Dhan connection from DB
    const { data: conn, error: dbErr } = await supabase
      .from("broker_connections")
      .select("access_token, broker_user_id")
      .eq("user_id", user.id)
      .eq("broker", "dhan")
      .eq("is_active", true)
      .single();

    if (dbErr || !conn?.access_token) {
      return json({ error: "Dhan not connected", connected: false });
    }

    const accessToken = conn.access_token;
    const clientId = conn.broker_user_id || Deno.env.get("DHAN_CLIENT_ID") || "";

    // Use sandbox or production URL from env (defaults to sandbox)
    const baseUrl = Deno.env.get("DHAN_BASE_URL") || "https://sandbox.dhan.co";

    const dhanHeaders = {
      "access-token": accessToken,
      "client-id": clientId,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Parallel: fetch profile, holdings, positions, fund limits
    const [profileRes, holdingsRes, positionsRes, fundRes] = await Promise.allSettled([
      fetch(`${baseUrl}/v2/profile`, { headers: dhanHeaders }),
      fetch(`${baseUrl}/v2/holdings`, { headers: dhanHeaders }),
      fetch(`${baseUrl}/v2/positions`, { headers: dhanHeaders }),
      fetch(`${baseUrl}/v2/fundlimit`, { headers: dhanHeaders }),
    ]);

    const parseResult = async (res: PromiseSettledResult<Response>, label: string) => {
      if (res.status === "rejected") {
        console.warn(`Dhan ${label} fetch failed:`, res.reason);
        return { error: `${label} fetch failed` };
      }
      const r = res.value;
      const text = await r.text();
      try {
        return JSON.parse(text);
      } catch {
        console.warn(`Dhan ${label} non-JSON:`, text.slice(0, 200));
        return { error: `${label} returned non-JSON`, status: r.status };
      }
    };

    const profile = await parseResult(profileRes, "profile");
    const holdings = await parseResult(holdingsRes, "holdings");
    const positions = await parseResult(positionsRes, "positions");
    const funds = await parseResult(fundRes, "funds");

    // Check if the token is invalid
    if (profile?.errorCode === "DH-906" || profile?.errorCode === "DH-901") {
      return json({
        error: "Dhan token expired or invalid. Please reconnect.",
        connected: false,
        errorCode: profile.errorCode,
      });
    }

    return json({
      success: true,
      connected: true,
      broker: "dhan",
      profile,
      holdings: Array.isArray(holdings) ? holdings : holdings?.data || [],
      positions: Array.isArray(positions) ? positions : positions?.data || [],
      funds,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("dhan-account error:", msg);
    return json({ error: msg });
  }
});
