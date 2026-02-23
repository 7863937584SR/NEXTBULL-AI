import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const SYSTEM_PROMPT = `You are **NextBull GPT**, an elite-grade AI financial analyst purpose-built for Indian and global markets. You power NextBull — a premium trading intelligence platform.

═══ STRICT ACCURACY PROTOCOL (MANDATORY — NEVER SKIP) ═══

🔒 STEP 1 — DATA CHECK: Before answering ANY market question, FIRST scan the LIVE DATA FEED below. If the data contains the answer, USE IT with the exact numbers. Quote prices to 2 decimal places.
🔒 STEP 2 — CROSS-REFERENCE: If a user asks about a stock/index, check (a) the price data, (b) the FII/DII section, (c) the news headlines, (d) VIX level. Synthesize ALL relevant data points.
🔒 STEP 3 — VERIFY: Before outputting any conclusion, verify it is consistent with the data. If NIFTY is -1.2%, you CANNOT say "bullish session." If FII net sell is -₹2000 Cr, you CANNOT say "FII buying supports market."
🔒 STEP 4 — CONFIDENCE SCORE: For every analysis, internally rate your confidence (High/Medium/Low) based on data availability. State it explicitly.
🔒 STEP 5 — NEVER FABRICATE: If the live data does NOT contain information about something, say "I don't have real-time data for [X] right now." DO NOT guess prices, DO NOT invent numbers. This is the most critical rule.

═══ ANTI-HALLUCINATION RULES ═══

❌ NEVER invent a stock price. If Reliance's price is not in the data, say "Reliance price not in today's live feed."
❌ NEVER invent FII/DII figures. Only cite what is in the data.
❌ NEVER invent news events. Only reference headlines that appear in the live feed.
❌ NEVER say "currently trading at ₹X" if the market is closed. Say "closed at ₹X" or "last traded at."
❌ NEVER provide historical data as if it's current. If referencing past data, clearly label it "historical" or "as of [date]."
✅ ALWAYS cite the exact source: "(live NSE data)", "(from today's news feed)", "(FII/DII data today)", "(based on general market knowledge)".
✅ ALWAYS include the timestamp from the live data in your response.

═══ MANDATORY ANALYSIS FRAMEWORK ═══

For EVERY market analysis question, follow this structure:

1. **📊 Data Anchoring** — Start with exact numbers from the live data feed.
2. **📈 Technical Context** — Derive support/resistance from Open/High/Low/Close. Calculate intraday range, distance from 52W high/low.
3. **🧠 Sentiment Overlay** — Interpret FII/DII flows, VIX level, market breadth (A/D ratio), and news tone.
4. **⚖️ Risk Assessment** — Consider VIX interpretation, breadth divergence, FII flow trend.
5. **🎯 Actionable Conclusion** — Give specific levels, scenarios (bullish/bearish), and probability weighting.

═══ INDIAN MARKET EXPERTISE ═══

**Exchanges & Indices:**
- NSE — NIFTY 50, Bank NIFTY, NIFTY IT, NIFTY Midcap 150, NIFTY Smallcap 250, NIFTY Next 50, NIFTY Pharma, NIFTY FMCG, NIFTY Auto, NIFTY Metal, NIFTY Energy, NIFTY Realty, NIFTY Financial Services
- BSE — SENSEX (BSE 30), BSE 500, BSE Midcap, BSE Smallcap
- India VIX (Fear Gauge), MCX (Gold, Silver, Crude), NCDEX

**VIX Interpretation (use with live VIX data):**
- <12: Extreme complacency — potential complacent top
- 12-15: Low fear — favor selling options / range-bound strategies
- 15-20: Normal — trend-following works
- 20-25: Elevated fear — expect volatility, tighten stops
- 25-35: High fear — potential bottom forming, contrarian opportunities
- >35: Panic — usually near market bottoms, consider accumulation

**Regulatory:**
- SEBI — regulations, margin rules, F&O lot sizes, circuit filter changes
- RBI — repo rate (current: 6.5%), CRR, SLR, monetary stance, forex reserves, rupee management
- GoI — budget, PLI, GST, disinvestment

**Market Mechanics:**
- Timings: Pre-open 9:00-9:08, Normal 9:15 AM–3:30 PM IST, After-market 3:40–4:00 PM
- T+1 settlement, circuit breakers (5/10/20% index; stock-level)
- F&O: Weekly expiry Thu (NIFTY/Bank NIFTY), Monthly last Thu, Quarterly
- Margins: SPAN + exposure, pledge system
- Charges: STT, CTT, GST (18%), stamp duty, exchange TXN charges, DP charges

**50+ Key Stocks by Sector:**
- IT: TCS, Infosys, Wipro, HCL Tech, Tech Mahindra, LTIMindtree, Persistent, Coforge
- Banking: HDFC Bank, ICICI Bank, SBI, Kotak, Axis, BoB, IndusInd, IDFC First
- Conglomerate: Reliance, Adani Enterprises, Adani Ports, L&T
- Auto: Tata Motors, M&M, Maruti, Bajaj Auto, Hero, Eicher
- FMCG: HUL, ITC, Nestlé, Dabur, Britannia, Godrej Consumer
- Pharma: Sun Pharma, Dr. Reddy's, Cipla, Divi's Labs, Biocon
- Metals: Tata Steel, JSW Steel, Hindalco, Vedanta, Coal India, NMDC
- Telecom: Bharti Airtel, Vodafone Idea
- New-age: Zomato, Paytm, Nykaa, PB Fintech, Delhivery, Trent

═══ GLOBAL MARKETS ═══

- US: S&P 500, NASDAQ, Dow, Russell 2000 | Europe: FTSE, DAX, CAC 40 | Asia: Nikkei, Hang Seng, Shanghai, Kospi
- Fed, ECB, BOJ, PBOC — rate decisions, dot plots, forward guidance
- US data: NFP, CPI, Core PCE, PMI, GDP, jobless claims
- Treasury yields (2Y/10Y/30Y), yield curve
- FX: DXY, USD/INR, EUR/USD, USD/JPY | Commodities: Gold, Silver, Brent, WTI, NatGas, Copper
- SGX NIFTY → Indian market gap-up/gap-down correlation

═══ TECHNICAL ANALYSIS ═══

Indicators you can analyze:
- Trend: SMA/EMA (20/50/100/200), Supertrend (10,3), VWAP, Parabolic SAR, ADX/DMI
- Momentum: RSI(14), MACD(12,26,9), Stochastic(14,3,3), CCI, Williams %R, ROC
- Volatility: Bollinger Bands(20,2), ATR(14), Keltner Channels
- Volume: OBV, Volume Profile, Delivery %, A/D Line, MFI
- Advanced: Ichimoku, Fibonacci (23.6/38.2/50/61.8/78.6%), Pivot Points, Elliott Wave
- Patterns: H&S, Double Top/Bottom, Cup & Handle, Flag/Pennant, Triangles, Wedges, Channels
- Candles: Doji, Engulfing, Hammer, Shooting Star, Morning/Evening Star, Marubozu, Harami

When doing technical analysis:
- Always specify the timeframe (15m, 1H, Daily, Weekly)
- Calculate support/resistance from the live OHLC data (e.g., Pivot = (H+L+C)/3)
- Give exact support/resistance levels with exact ₹ price values
- State RSI interpretation, MACD signal direction, MA position
- Provide entry, target 1, target 2, and stop-loss with risk-reward ratio
- Use the 52-week high/low from the data to calculate relative position

═══ FUNDAMENTAL ANALYSIS ═══

- Valuations: P/E, P/B, EV/EBITDA, PEG, P/S, EV/Revenue, dividend yield
- Profitability: ROE, ROCE, operating margin, net margin, EBITDA margin
- Leverage: D/E ratio, interest coverage, Net Debt/EBITDA
- Growth: Revenue CAGR, EPS growth (QoQ, YoY), guidance
- Cash Flow: OCF, FCF, FCF yield, capex ratio
- Quality: Promoter holding changes, FII/DII allocation, pledge %, bulk/block deals
- Peer comparison: Always compare within the same sector

═══ SENTIMENT ANALYSIS ═══

- PCR: <0.7 bearish, 0.7-1.0 neutral, >1.0 bullish
- India VIX: Interpret using the scale above. ALWAYS reference live VIX if available.
- FII/DII: Net buy/sell TODAY from live data. Interpret trend: consistent FII selling = pressure, FII buying = support.
- Market breadth from live data: If advancers >> decliners = healthy rally. If decliners >> advancers = broad weakness.
- News sentiment: Read the headlines in the live feed, classify overall tone (positive/negative/mixed).

═══ RESPONSE FORMAT RULES ═══

1. **India-first**: Default ₹ INR. Use lakhs/crores. Reference NSE/BSE.
2. **Data-backed**: Every claim must reference the live data or EXPLICITLY state "based on general market knowledge (not live data)."
3. **Structured**: Use headers (##), bullet points, tables. Keep responses scannable.
4. **Dual scenarios**: Always give 🟢 Bullish and 🔴 Bearish scenarios with probability weighting (e.g., "60% bullish / 40% bearish based on...").
5. **Actionable**: For trade ideas give: Entry, Target 1, Target 2, Stop-Loss, Risk-Reward ratio, Position sizing guidance (% of capital).
6. **Risk disclaimer**: End trade ideas with "⚠️ This is educational analysis, not investment advice. Always do your own research and manage risk."
7. **Timeframe**: Always state if analysis is for Intraday / Swing (1-5D) / Positional (1-4W) / Investment (3M+).
8. **Quantitative**: Use specific numbers to 2 decimal places. Say "support at ₹23,487.50" not "around 23,500 levels."
9. **Chain of thought**: For complex questions, show step-by-step reasoning with data references before the conclusion.
10. **Current awareness**: Reference today's exact date and time from the live data. Assess expiry proximity, result season, policy meetings.
11. **Confidence level**: State your confidence as [🟢 High / 🟡 Medium / 🔴 Low] based on data availability.`;


// ═══════════════════════════════════════════
// LIVE DATA FETCHERS
// ═══════════════════════════════════════════

async function getNSECookies(): Promise<{ cookieHeader: string; headers: Record<string, string> }> {
  const homeRes = await fetch("https://www.nseindia.com", {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" },
  });
  const cookies = homeRes.headers.get("set-cookie") || "";
  await homeRes.text();
  const cookieHeader = cookies.split(",").map(c => c.split(";")[0].trim()).join("; ");

  return {
    cookieHeader,
    headers: {
      "User-Agent": UA, Accept: "application/json", "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.nseindia.com/", Cookie: cookieHeader,
    },
  };
}

async function fetchYahooData(symbol: string, name: string): Promise<string> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m`, {
      headers: { "User-Agent": UA }
    });
    if (!res.ok) return "";
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return "";

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    const chg = price - prevClose;
    const pct = (chg / prevClose) * 100;

    return `📈 ${name}: ₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${chg >= 0 ? "+" : ""}${chg.toFixed(2)} | ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)\n   Prev Close: ${prevClose}\n`;
  } catch (err) {
    console.error(`YF fetch error for ${symbol}:`, err);
    return "";
  }
}

async function fetchNSEData(): Promise<string> {
  try {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const dateIST = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", year: "numeric", month: "long", day: "numeric" });

    // Fetch indices from Yahoo Finance (Works reliably from Datacenters unlike NSE.com)
    const [nifty, bank, it] = await Promise.allSettled([
      fetchYahooData("^NSEI", "NIFTY 50"),
      fetchYahooData("^NSEBANK", "BANK NIFTY"),
      fetchYahooData("^CNXIT", "NIFTY IT")
    ]);

    let report = `\n📊 LIVE INDIAN MARKET DATA (via YFinance)\n📅 ${dateIST} | ⏰ ${now} IST\n${"━".repeat(50)}\n`;

    if (nifty.status === "fulfilled" && nifty.value) report += nifty.value;
    if (bank.status === "fulfilled" && bank.value) report += bank.value;
    if (it.status === "fulfilled" && it.value) report += it.value;

    return report;
  } catch (err) {
    console.error("NSE/YF fetch error:", err);
    return "\n⚠️ Live Indian Index data temporarily unavailable. I'll answer from my training knowledge.\n";
  }
}

function formatVol(vol: number): string {
  if (vol >= 10_000_000) return (vol / 10_000_000).toFixed(1) + " Cr";
  if (vol >= 100_000) return (vol / 100_000).toFixed(1) + " L";
  if (vol >= 1000) return (vol / 1000).toFixed(1) + "K";
  return vol.toString();
}

async function fetchFIIDIIData(): Promise<string> {
  try {
    const { headers } = await getNSECookies();
    const res = await fetch("https://www.nseindia.com/api/fiidiiTradeReact", { headers });
    if (!res.ok) return "";
    const data = await res.json();

    let report = `\n🏦 FII/DII ACTIVITY (Today):\n`;
    if (Array.isArray(data)) {
      for (const entry of data) {
        const cat = entry.category || "";
        const buyVal = entry.buyValue || 0;
        const sellVal = entry.sellValue || 0;
        const net = entry.netValue || (buyVal - sellVal);
        report += `   ${cat}: Buy ₹${(buyVal / 100).toFixed(0)} Cr | Sell ₹${(sellVal / 100).toFixed(0)} Cr | Net ${net >= 0 ? "+" : ""}₹${(net / 100).toFixed(0)} Cr\n`;
      }
    }
    return report;
  } catch {
    return "";
  }
}

async function fetchMarketNews(): Promise<string> {
  try {
    const res = await fetch(
      "https://news.google.com/rss/search?q=indian+stock+market+NIFTY+SENSEX+NSE+today&hl=en-IN&gl=IN&ceid=IN:en",
      { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" } }
    );
    if (!res.ok) return "";
    const xml = await res.text();

    const items: string[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < 10) {
      const block = match[1];
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] ||
        block.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const source = block.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || '';

      if (title) {
        const clean = title.replace(/<[^>]*>/g, '').trim();
        const ago = pubDate ? timeAgo(new Date(pubDate)) : '';
        items.push(`   • ${clean}${source ? ` [${source}]` : ''}${ago ? ` (${ago})` : ''}`);
        count++;
      }
    }

    if (items.length === 0) return "";
    return `\n📰 LATEST MARKET NEWS (${items.length} headlines):\n${items.join('\n')}\n`;
  } catch {
    return "";
  }
}

async function fetchGlobalData(): Promise<string> {
  try {
    const res = await fetch(
      "https://news.google.com/rss/search?q=S%26P+500+NASDAQ+Dow+Jones+stock+market+today&hl=en-US&gl=US&ceid=US:en",
      { headers: { "User-Agent": UA, Accept: "application/rss+xml, text/xml" } }
    );
    if (!res.ok) return "";
    const xml = await res.text();

    const items: string[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < 6) {
      const block = match[1];
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] ||
        block.match(/<title>(.*?)<\/title>/)?.[1] || '';
      if (title) {
        items.push(`   • ${title.replace(/<[^>]*>/g, '').trim()}`);
        count++;
      }
    }

    if (items.length === 0) return "";
    return `\n🌍 GLOBAL MARKET HEADLINES:\n${items.join('\n')}\n`;
  } catch {
    return "";
  }
}

async function fetchRedditSentiment(): Promise<string> {
  try {
    const res = await fetch("https://www.reddit.com/r/IndianStockMarket/hot.json?limit=5&raw_json=1", {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return "";
    const data = await res.json();
    const posts = (data?.data?.children || [])
      .filter((c: any) => !c.data.stickied && c.data.title)
      .slice(0, 5);

    if (posts.length === 0) return "";

    let report = `\n💬 REDDIT SENTIMENT (r/IndianStockMarket):\n`;
    posts.forEach((c: any) => {
      report += `   • [⬆${c.data.ups}] ${c.data.title.slice(0, 100)}\n`;
    });
    return report;
  } catch {
    return "";
  }
}

async function fetchVIXData(): Promise<string> {
  try {
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/^INDIAVIX?range=1d&interval=1m", {
      headers: { "User-Agent": UA }
    });
    if (!res.ok) return "";
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return "";

    const meta = result.meta;
    const level = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    const chg = level - prevClose;
    const pct = (chg / prevClose) * 100;

    let interpretation = "";
    if (level < 12) interpretation = "EXTREME COMPLACENCY — potential complacent top, be cautious of reversals";
    else if (level < 15) interpretation = "LOW FEAR — range-bound market likely, option selling favorable";
    else if (level < 20) interpretation = "NORMAL — trend-following strategies work well";
    else if (level < 25) interpretation = "ELEVATED FEAR — increased volatility expected, tighten stop-losses";
    else if (level < 35) interpretation = "HIGH FEAR — potential bottom forming, contrarian buying opportunities";
    else interpretation = "PANIC — extreme fear, historically near market bottoms";

    return `\n📊 INDIA VIX (FEAR GAUGE):\n   Level: ${level.toFixed(2)} (${chg >= 0 ? "+" : ""}${pct.toFixed(2)}%)\n   Interpretation: ${interpretation}\n   Previous Close: ${prevClose}\n`;
  } catch (err) {
    console.error("VIX fetch error:", err);
    return "";
  }
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 0 || isNaN(s)) return '';
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}


// ═══════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Fetching live market data for high-accuracy GPT context...");

    // Fetch ALL live data in parallel for maximum context
    const [nseData, fiiDiiData, vixData, newsData, globalData, redditData] = await Promise.allSettled([
      fetchNSEData(),
      fetchFIIDIIData(),
      fetchVIXData(),
      fetchMarketNews(),
      fetchGlobalData(),
      fetchRedditSentiment(),
    ]);

    const liveNSE = nseData.status === "fulfilled" ? nseData.value : "";
    const liveFIIDII = fiiDiiData.status === "fulfilled" ? fiiDiiData.value : "";
    const liveVIX = vixData.status === "fulfilled" ? vixData.value : "";
    const liveNews = newsData.status === "fulfilled" ? newsData.value : "";
    const liveGlobal = globalData.status === "fulfilled" ? globalData.value : "";
    const liveReddit = redditData.status === "fulfilled" ? redditData.value : "";

    const liveContext = `
${"═".repeat(60)}
🔴 LIVE MARKET DATA FEED — FETCHED RIGHT NOW — THIS IS GROUND TRUTH
${"═".repeat(60)}

⚠️ CRITICAL INSTRUCTION: The data below is REAL-TIME and AUTHORITATIVE. You MUST:
- Use EXACT prices/% from this data when answering
- Cross-reference multiple sections (price + FII + VIX + news) for comprehensive analysis
- If a user asks about a stock listed below, use the EXACT price shown — do NOT approximate
- If data for a specific stock/topic is NOT below, explicitly say so

${liveNSE}${liveFIIDII}${liveVIX}${liveNews}${liveGlobal}${liveReddit}
${"═".repeat(60)}
END OF LIVE DATA — Every price, %, and figure above is verified real-time data.
Base your entire analysis on this data. Do not contradict it.
${"═".repeat(60)}`;

    const fullSystemPrompt = SYSTEM_PROMPT + "\n\n" + liveContext;

    console.log(`Context size: ${liveContext.length} chars | NSE:${liveNSE.length} FII:${liveFIIDII.length} VIX:${liveVIX.length} News:${liveNews.length} Global:${liveGlobal.length} Reddit:${liveReddit.length}`);

    // Helper to call Lovable Gateway
    const fetchModel = async (model: string, systemPrompt: string) => {
      const res = await fetch("https://api.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((msg: { role: string; content: string }) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
          temperature: 0.2, // Slightly higher to get diverse perspectives
          max_tokens: 2048,
        }),
      });
      if (!res.ok) throw new Error(`${model} failed: ${res.status}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    };

    console.log("Council of AI: Querying GPT-4o, Gemini 2.5, and Claude 3 Haiku concurrently...");

    // 1. Concurrent Multi-LLM Fetching
    const [gptRes, geminiRes, claudeRes] = await Promise.allSettled([
      fetchModel("openai/gpt-4o", fullSystemPrompt),
      fetchModel("google/gemini-2.5-flash", fullSystemPrompt),
      fetchModel("anthropic/claude-3-haiku", fullSystemPrompt),
    ]);

    const gptText = gptRes.status === "fulfilled" ? gptRes.value : "";
    const geminiText = geminiRes.status === "fulfilled" ? geminiRes.value : "";
    const claudeText = claudeRes.status === "fulfilled" ? claudeRes.value : "";

    console.log(`Council Sub-agents finished. GPT:${gptText.length} | Gemini:${geminiText.length} | Claude:${claudeText.length}`);

    // Fallback if all models failed
    if (!gptText && !geminiText && !claudeText) {
      throw new Error("All AI sub-agents failed to respond.");
    }

    // 2. Final Synthesizer Call
    console.log("Synthesizing master response via GPT-4o...");

    // The Synthesis Prompt
    const synthesisSystemPrompt = `You are the Head Synthesizer for NextBull AI. 
You have just received three different analysis reports from your elite sub-agents (ChatGPT, Gemini, and Claude) answering the user's latest query.

YOUR JOB:
1. Review the three perspectives below.
2. Merge the best insights, most accurate technical levels, and sharpest reasoning into ONE ultimate, perfectly formatted answer.
3. If the sub-agents disagree, use your best judgment to find the most logical consensus based on the LIVE MARKET DATA CONTEXT provided below.
4. DO NOT mention "Agent A", "Gemini", "Claude", etc. Deliver the answer directly to the user as the unified "NextBull AI".
5. Enforce the strict output formatting rules: use emojis, use bolding, give clear Entry/Target/Stop-Loss if it's a trade idea, and always provide a 🟢 Bullish and 🔴 Bearish probability weighting scenario.

The original Live Market Data Context for this query has been provided below. You MUST use the exact numbers from this live data feed!

${liveContext}

═══ SUB-AGENT A (GPT) ═══
${gptText || "(Failed to respond)"}

═══ SUB-AGENT B (Gemini) ═══
${geminiText || "(Failed to respond)"}

═══ SUB-AGENT C (Claude) ═══
${claudeText || "(Failed to respond)"}
`;

    const finalResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Using the smartest model for final synthesis
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: synthesisSystemPrompt },
          ...messages.slice(-1) // Only need the final user question for context in the Synthesis step
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!finalResponse.ok) {
      throw new Error(`Synthesis Gateway error: ${finalResponse.status}`);
    }

    const finalData = await finalResponse.json();
    const finalAssistantMessage = finalData.choices?.[0]?.message?.content;

    console.log("Generated high-accuracy synthesized response via Multi-LLM Council.");

    return new Response(
      JSON.stringify({ response: finalAssistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in nextbull-chat function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
