import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const SYSTEM_PROMPT = `You are **NextBull GPT**, a data-driven AI financial analyst for Indian and global markets. You power NextBull — a trading intelligence platform.

═══ STRICT DOMAIN LIMITATION (NEVER VIOLATE) ═══
🚫 YOU ARE A FINANCIAL ASSISTANT ONLY.
🚫 If a user asks a question that is NOT related to financial markets, trading, investing, stocks, indices, crypto, or macroeconomics, you MUST politely but firmly refuse to answer.
🚫 Do NOT answer questions about coding, history, general knowledge, math (unrelated to finance), creative writing, or anything else.
✅ Example response to off-topic: "I am NextBull GPT, a specialized financial AI. I can only assist you with market analysis, trading strategies, and financial data. How can I help you with the markets today?"

═══ TRUTHFULNESS & NEUTRALITY PROTOCOL (HIGHEST PRIORITY) ═══

🔒 RULE 1 — DATA-FIRST: Before answering ANY market question, FIRST scan the LIVE DATA FEED below. If the data contains the answer, USE IT with the exact numbers. Quote prices to 2 decimal places. NEVER round or approximate.
🔒 RULE 2 — CROSS-REFERENCE: For any stock/index query, cross-check (a) price data, (b) FII/DII flows, (c) news headlines, (d) VIX level, (e) global context, (f) forex/commodity moves. Report ALL relevant data points, especially those that CONTRADICT each other.
🔒 RULE 3 — LOGICAL CONSISTENCY: Before outputting any conclusion, verify it is consistent with the data. If NIFTY is -1.2%, you CANNOT say "bullish session." If FII net sell is -₹2000 Cr, you CANNOT say "FII buying supports market." If data conflicts with your conclusion, CHANGE YOUR CONCLUSION, not the data.
🔒 RULE 4 — ZERO FABRICATION: If the live data does NOT contain information about something, say "I don't have real-time data for [X] in today's feed." DO NOT guess prices, DO NOT invent numbers, DO NOT extrapolate. This is the most critical rule.
🔒 RULE 5 — SEPARATE FACT FROM OPINION: Clearly distinguish between (a) verified live data, (b) derived analysis, and (c) general market knowledge. Tag each: "(live data)", "(derived)", "(general knowledge — not verified today)".
🔒 RULE 6 — NEUTRAL TONE: You are an analyst, NOT a cheerleader. NEVER use hype language ("explosive", "moon", "rocket", "incredible opportunity"). Present both bull AND bear cases with EQUAL depth and evidence. Your job is to inform, not to sell.
🔒 RULE 7 — UNCERTAINTY IS HONEST: If you are uncertain, SAY SO. "The data suggests X, but Y is also plausible" is better than false certainty. Markets are probabilistic — reflect that.
🔒 RULE 8 — NO RECENCY BIAS: Do not assume the current trend will continue. Mean reversion is real. A stock up 5% today does NOT mean it will be up tomorrow.

═══ ANTI-HALLUCINATION RULES ═══

❌ NEVER invent a stock price. If the price is not in the live feed, say so.
❌ NEVER invent FII/DII figures. Only cite what is in the data.
❌ NEVER invent news events. Only reference headlines that appear in the live feed.
❌ NEVER say "currently trading at ₹X" if the market is closed. Say "closed at ₹X" or "last traded at."
❌ NEVER provide historical data as if it's current. Clearly label it "historical" or "as of [date]."
❌ NEVER state a directional opinion (bullish/bearish) without citing at least 2 supporting data points from the live feed.
❌ NEVER present a single scenario as certain. Always present the counter-scenario.
✅ ALWAYS cite the exact source: "(live data)", "(from today's news feed)", "(FII/DII data today)", "(general knowledge)".
✅ ALWAYS include the timestamp from the live data.
✅ ALWAYS acknowledge conflicting signals when they exist (e.g., "FII selling but VIX declining — mixed signal").

═══ MANDATORY ANALYSIS FRAMEWORK ═══

For EVERY market analysis question, you MUST output your response in this EXACT structure:

**📊 MARKET DATA SNAPSHOT**
*   **India VIX**: [Value]
*   **FII/DII Net Flow**: [Value]
*   **Top News Sentiment**: [Positive/Negative/Mixed]
*   **(If specific stock asked)** **[Stock Name] Last Price**: ₹[Value] | **Day Change**: [Value]%

**1. 📈 Technical Context**
Derive support/resistance from Open/High/Low/Close. Calculate intraday range, distance from 52W high/low.

**2. 🧠 Sentiment Overlay**
Interpret FII/DII flows, VIX level, market breadth (A/D ratio), and news tone.

**3. ⚖️ Risk Assessment**
Consider VIX interpretation, breadth divergence, FII flow trend.

**4. 🎯 Actionable Conclusion**
Give specific levels, scenarios (bullish/bearish), and probability weighting.

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
2. **Data-backed**: Every claim must reference the live data or EXPLICITLY state "(general knowledge — not verified today)." No unsourced claims.
3. **Structured**: Use headers (##), bullet points, tables. Keep responses scannable. Be concise — no filler sentences.
4. **Balanced dual scenarios**: ALWAYS give 🟢 Bull Case and 🔴 Bear Case with EQUAL DEPTH. Do NOT favor one over the other unless the data overwhelmingly supports it. If you give 3 bullet points for bull case, give 3 for bear case.
5. **Probability weighting**: Assign probabilities based on data evidence count (e.g., "55% bullish / 45% bearish based on 3 positive signals vs 2 negative"). Avoid extreme probabilities (>75%) unless 4+ data points align.
6. **Actionable**: For trade ideas give: Entry, Target 1, Target 2, Stop-Loss, Risk-Reward ratio. Include what would INVALIDATE the trade idea.
7. **Risk disclaimer**: End trade ideas with "⚠️ This is educational analysis, not investment advice. Always do your own research and manage risk."
8. **Timeframe**: Always state if analysis is for Intraday / Swing (1-5D) / Positional (1-4W) / Investment (3M+).
9. **Quantitative precision**: Use specific numbers to 2 decimal places. Say "support at ₹23,487.50" not "around 23,500 levels." Do NOT use vague terms like "strong", "huge", "massive" — use numbers.
10. **Chain of thought**: For complex questions, show step-by-step reasoning with data references BEFORE the conclusion. Conclusion must logically follow from the data.
11. **Current awareness**: Reference today's exact date and time from the live data. Assess expiry proximity, result season, policy meetings.
12. **Confidence level**: State your confidence as [🟢 High / 🟡 Medium / 🔴 Low] based on data availability. Most analysis should be 🟡 Medium unless you have 4+ confirming data points.
13. **Conflicting signals**: If bull and bear signals are roughly equal, SAY THAT. "The data is mixed" is an honest and useful answer. Do not force a directional call when data is ambiguous.
14. **No hype language**: Avoid words like: incredible, amazing, explosive, moon, skyrocket, guaranteed, no-brainer, once-in-a-lifetime. Use measured language: "suggests", "indicates", "the data points to", "probability favors".

═══ AUTO-CHART TRIGGER (MANDATORY WHEN ANALYZING SPECIFIC ASSETS) ═══

If you are giving a detailed technical analysis (support, resistance, targets) for a SPECIFIC asset, you MUST append a secret JSON block at the very end of your response so the UI can open an interactive chart for the user.

Format: \`[CHART_ACTION: {"symbol": "EXCHANGE:SYMBOL", "name": "Asset Name"}]\`

Mappings to use:
- Bitcoin / BTC -> \`[CHART_ACTION: {"symbol": "BINANCE:BTCUSDT", "name": "Bitcoin"}]\`
- Ethereum / ETH -> \`[CHART_ACTION: {"symbol": "BINANCE:ETHUSDT", "name": "Ethereum"}]\`
- Gold -> \`[CHART_ACTION: {"symbol": "OANDA:XAUUSD", "name": "Gold"}]\`
- NIFTY 50 -> \`[CHART_ACTION: {"symbol": "NSE:NIFTY", "name": "NIFTY 50"}]\`
- Bank NIFTY -> \`[CHART_ACTION: {"symbol": "NSE:BANKNIFTY", "name": "Bank NIFTY"}]\`
- Reliance -> \`[CHART_ACTION: {"symbol": "NSE:RELIANCE", "name": "Reliance"}]\`
- (For any other NSE stock, use NSE:TICKER)

Example ending of your response:
"...therefore the setup looks bullish. ⚠️ This is educational analysis, not investment advice.
[CHART_ACTION: {"symbol": "BINANCE:BTCUSDT", "name": "Bitcoin"}]"`;


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

// Generic Yahoo fetcher returning raw numbers for non-INR assets
async function fetchYahooRaw(symbol: string): Promise<{ price: number; prevClose: number; chg: number; pct: number; high: number; low: number; vol: number } | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m`, {
      headers: { "User-Agent": UA }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    return {
      price,
      prevClose,
      chg: price - prevClose,
      pct: ((price - prevClose) / prevClose) * 100,
      high: meta.regularMarketDayHigh || price,
      low: meta.regularMarketDayLow || price,
      vol: meta.regularMarketVolume || 0,
    };
  } catch { return null; }
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

// ── Extended Indices: SENSEX, Midcap, Smallcap, FinServices, Auto ──
async function fetchExtendedIndices(): Promise<string> {
  try {
    const symbols = [
      { sym: "^BSESN", name: "SENSEX" },
      { sym: "NIFTY_MIDCAP_150.NS", name: "NIFTY Midcap 150" },
      { sym: "^CNXFIN", name: "NIFTY FinService" },
      { sym: "^CNXAUTO", name: "NIFTY Auto" },
    ];
    const results = await Promise.allSettled(symbols.map(s => fetchYahooData(s.sym, s.name)));
    let report = "";
    results.forEach(r => { if (r.status === "fulfilled" && r.value) report += r.value; });
    return report ? `\n📊 EXTENDED INDICES:\n${report}` : "";
  } catch { return ""; }
}

// ── Top NSE stocks real-time prices ──
async function fetchTopStocks(): Promise<string> {
  try {
    const stocks = [
      { sym: "RELIANCE.NS", name: "Reliance" },
      { sym: "TCS.NS", name: "TCS" },
      { sym: "INFY.NS", name: "Infosys" },
      { sym: "HDFCBANK.NS", name: "HDFC Bank" },
      { sym: "ICICIBANK.NS", name: "ICICI Bank" },
      { sym: "ITC.NS", name: "ITC" },
      { sym: "BHARTIARTL.NS", name: "Bharti Airtel" },
      { sym: "SBIN.NS", name: "SBI" },
      { sym: "TATAMOTORS.NS", name: "Tata Motors" },
      { sym: "LT.NS", name: "L&T" },
      { sym: "WIPRO.NS", name: "Wipro" },
      { sym: "ADANIENT.NS", name: "Adani Ent" },
      { sym: "BAJFINANCE.NS", name: "Bajaj Finance" },
      { sym: "MARUTI.NS", name: "Maruti Suzuki" },
      { sym: "SUNPHARMA.NS", name: "Sun Pharma" },
      { sym: "TATASTEEL.NS", name: "Tata Steel" },
      { sym: "KOTAKBANK.NS", name: "Kotak Bank" },
      { sym: "AXISBANK.NS", name: "Axis Bank" },
      { sym: "HCLTECH.NS", name: "HCL Tech" },
      { sym: "M&M.NS", name: "M&M" },
    ];

    const results = await Promise.allSettled(stocks.map(s => fetchYahooRaw(s.sym)));
    let report = "\n📈 TOP 20 NSE STOCKS (Real-Time):\n";
    let hasData = false;

    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        const d = r.value;
        hasData = true;
        report += `   ${stocks[i].name.padEnd(15)} ₹${d.price.toFixed(2).padStart(10)} ${d.chg >= 0 ? "+" : ""}${d.pct.toFixed(2).padStart(7)}%  H:${d.high.toFixed(2)} L:${d.low.toFixed(2)}  Vol:${formatVol(d.vol)}\n`;
      }
    });

    return hasData ? report : "";
  } catch { return ""; }
}

// ── US Indices ──
async function fetchUSMarkets(): Promise<string> {
  try {
    const indices = [
      { sym: "^GSPC", name: "S&P 500" },
      { sym: "^IXIC", name: "NASDAQ" },
      { sym: "^DJI", name: "Dow Jones" },
      { sym: "^RUT", name: "Russell 2000" },
    ];
    const results = await Promise.allSettled(indices.map(s => fetchYahooRaw(s.sym)));
    let report = "\n🇺🇸 US MARKETS:\n";
    let hasData = false;

    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        const d = r.value;
        hasData = true;
        report += `   ${indices[i].name.padEnd(14)} $${d.price.toFixed(2)} (${d.chg >= 0 ? "+" : ""}${d.pct.toFixed(2)}%)\n`;
      }
    });

    return hasData ? report : "";
  } catch { return ""; }
}

// ── Crypto prices ──
async function fetchCryptoData(): Promise<string> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin&order=market_cap_desc&per_page=10&sparkline=false&price_change_percentage=24h",
      { headers: { "User-Agent": UA, Accept: "application/json" } }
    );
    if (!res.ok) {
      // Fallback to CoinCap
      const capRes = await fetch("https://api.coincap.io/v2/assets?limit=10", {
        headers: { "User-Agent": UA }
      });
      if (!capRes.ok) return "";
      const capData = await capRes.json();
      let report = "\n🪙 CRYPTO MARKET (CoinCap):\n";
      (capData.data || []).slice(0, 7).forEach((c: any) => {
        const pct = parseFloat(c.changePercent24Hr) || 0;
        report += `   ${c.symbol.padEnd(6)} $${parseFloat(c.priceUsd).toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%) MCap: $${(parseFloat(c.marketCapUsd) / 1e9).toFixed(1)}B\n`;
      });
      return report;
    }

    const data = await res.json();
    let report = "\n🪙 CRYPTO MARKET (CoinGecko):\n";
    data.forEach((c: any) => {
      const pct = c.price_change_percentage_24h || 0;
      report += `   ${c.symbol.toUpperCase().padEnd(6)} $${c.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%) MCap: $${(c.market_cap / 1e9).toFixed(1)}B  Vol: $${(c.total_volume / 1e9).toFixed(1)}B\n`;
    });
    return report;
  } catch { return ""; }
}

// ── Forex rates ──
async function fetchForexData(): Promise<string> {
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      headers: { "User-Agent": UA }
    });
    if (!res.ok) return "";
    const data = await res.json();
    const rates = data.rates || {};

    const pairs = [
      { code: "INR", name: "USD/INR" },
      { code: "EUR", name: "EUR/USD", invert: true },
      { code: "GBP", name: "GBP/USD", invert: true },
      { code: "JPY", name: "USD/JPY" },
    ];

    // DXY from Yahoo
    const dxy = await fetchYahooRaw("DX-Y.NYB");

    let report = "\n💱 FOREX RATES:\n";
    pairs.forEach(p => {
      const rate = rates[p.code];
      if (rate) {
        const display = (p as any).invert ? (1 / rate).toFixed(4) : rate.toFixed(4);
        report += `   ${p.name.padEnd(10)} ${display}\n`;
      }
    });

    if (dxy) {
      report += `   DXY (Dollar Index): ${dxy.price.toFixed(2)} (${dxy.chg >= 0 ? "+" : ""}${dxy.pct.toFixed(2)}%)\n`;
    }

    return report;
  } catch { return ""; }
}

// ── Commodities ──
async function fetchCommodities(): Promise<string> {
  try {
    const items = [
      { sym: "GC=F", name: "Gold", unit: "$/oz" },
      { sym: "SI=F", name: "Silver", unit: "$/oz" },
      { sym: "CL=F", name: "Crude Oil (WTI)", unit: "$/bbl" },
      { sym: "BZ=F", name: "Brent Crude", unit: "$/bbl" },
      { sym: "NG=F", name: "Natural Gas", unit: "$/MMBtu" },
      { sym: "HG=F", name: "Copper", unit: "$/lb" },
    ];
    const results = await Promise.allSettled(items.map(i => fetchYahooRaw(i.sym)));
    let report = "\n🏗️ COMMODITIES:\n";
    let hasData = false;

    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        const d = r.value;
        hasData = true;
        report += `   ${items[i].name.padEnd(20)} $${d.price.toFixed(2)} ${items[i].unit} (${d.chg >= 0 ? "+" : ""}${d.pct.toFixed(2)}%)\n`;
      }
    });

    return hasData ? report : "";
  } catch { return ""; }
}

// ── Treasury Yields ──
async function fetchTreasuryYields(): Promise<string> {
  try {
    const bonds = [
      { sym: "^TNX", name: "US 10Y Yield" },
      { sym: "^TYX", name: "US 30Y Yield" },
      { sym: "^FVX", name: "US 5Y Yield" },
    ];
    const results = await Promise.allSettled(bonds.map(b => fetchYahooRaw(b.sym)));
    let report = "\n📉 TREASURY YIELDS:\n";
    let hasData = false;

    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        const d = r.value;
        hasData = true;
        report += `   ${bonds[i].name.padEnd(16)} ${d.price.toFixed(3)}% (${d.chg >= 0 ? "+" : ""}${d.chg.toFixed(3)}bps)\n`;
      }
    });

    return hasData ? report : "";
  } catch { return ""; }
}

// ── SGX NIFTY (NIFTY Futures proxy) ──
async function fetchSGXNifty(): Promise<string> {
  try {
    const d = await fetchYahooRaw("^NSEI");
    const fut = await fetchYahooRaw("0P0001BKTH.NS"); // NIFTY FUT near-month
    if (!d) return "";
    let report = "";
    if (fut) {
      const premium = fut.price - d.price;
      report = `\n📊 NIFTY FUTURES:\n   Near-Month: ₹${fut.price.toFixed(2)} (${fut.pct >= 0 ? "+" : ""}${fut.pct.toFixed(2)}%) Premium: ${premium >= 0 ? "+" : ""}${premium.toFixed(2)}\n`;
    }
    return report;
  } catch { return ""; }
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
    const body = await req.json();
    const { messages, deltaPortfolio: rawDeltaPortfolio } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // API key validation is done later in the multi-provider section

    console.log("Fetching live market data for high-accuracy GPT context...");

    // ── User's Delta portfolio passed from frontend ──
    const deltaPortfolio = typeof rawDeltaPortfolio === "string" ? rawDeltaPortfolio : "";

    // Fetch ALL live data in parallel for maximum context
    const [
      nseData, extIndices, topStocks,
      usMarkets, cryptoData, forexData, commodityData, treasuryData, sgxData,
      fiiDiiData, vixData, newsData, globalData, redditData,
    ] = await Promise.allSettled([
      fetchNSEData(),
      fetchExtendedIndices(),
      fetchTopStocks(),
      fetchUSMarkets(),
      fetchCryptoData(),
      fetchForexData(),
      fetchCommodities(),
      fetchTreasuryYields(),
      fetchSGXNifty(),
      fetchFIIDIIData(),
      fetchVIXData(),
      fetchMarketNews(),
      fetchGlobalData(),
      fetchRedditSentiment(),
    ]);

    const val = (r: PromiseSettledResult<string>) => r.status === "fulfilled" ? r.value : "";

    const liveNSE = val(nseData);
    const liveExtIdx = val(extIndices);
    const liveStocks = val(topStocks);
    const liveUS = val(usMarkets);
    const liveCrypto = val(cryptoData);
    const liveForex = val(forexData);
    const liveCommodity = val(commodityData);
    const liveTreasury = val(treasuryData);
    const liveSGX = val(sgxData);
    const liveFIIDII = val(fiiDiiData);
    const liveVIX = val(vixData);
    const liveNews = val(newsData);
    const liveGlobal = val(globalData);
    const liveReddit = val(redditData);

    const liveContext = `
${"═".repeat(60)}
🔴 LIVE MARKET DATA FEED — FETCHED RIGHT NOW — THIS IS GROUND TRUTH
${"═".repeat(60)}

⚠️ CRITICAL INSTRUCTIONS:
1. The data below is REAL-TIME and AUTHORITATIVE. Use EXACT prices/% — do NOT approximate or round.
2. If a user asks about a stock/asset listed below, use the EXACT price shown.
3. If data for a specific stock/topic is NOT below, explicitly say "not in today's live feed" — do NOT guess.
4. LOOK FOR CONFLICTING SIGNALS — if FII is selling but market is up, or VIX is rising but prices are flat, REPORT the conflict. Do not ignore inconvenient data.
5. The data is a snapshot — it does NOT tell you direction. A stock at ₹100 could go to ₹90 or ₹110. Do not assume continuation.
6. Maintain NEUTRAL tone. Present what the data shows, not what you think the user wants to hear.

${liveNSE}${liveExtIdx}${liveStocks}${liveSGX}${liveFIIDII}${liveVIX}${liveUS}${liveCrypto}${liveForex}${liveCommodity}${liveTreasury}${liveNews}${liveGlobal}${liveReddit}${deltaPortfolio ? `\n📋 USER'S LIVE DELTA EXCHANGE PORTFOLIO:\n${deltaPortfolio}\n` : ""}
${"═".repeat(60)}
END OF LIVE DATA — Every price, %, and figure above is verified real-time data.
Base your entire analysis on this data. Do not contradict it.
${"═".repeat(60)}`;

    const fullSystemPrompt = SYSTEM_PROMPT + "\n\n" + liveContext;

    console.log(`Context size: ${liveContext.length} chars | NSE:${liveNSE.length} Stocks:${liveStocks.length} US:${liveUS.length} Crypto:${liveCrypto.length} Forex:${liveForex.length} Commodity:${liveCommodity.length} FII:${liveFIIDII.length} VIX:${liveVIX.length} News:${liveNews.length}`);

    // ═══════════════════════════════════════════
    // MULTI-PROVIDER AI GATEWAY (auto-detect available API key)
    // Priority: OPENROUTER > OPENAI > GROQ > LOVABLE (legacy)
    // ═══════════════════════════════════════════

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    interface ProviderConfig {
      name: string;
      url: string;
      key: string;
      models: { primary: string; fallback: string };
      extraHeaders?: Record<string, string>;
    }

    // Build list of available providers
    const providers: ProviderConfig[] = [];

    if (OPENROUTER_API_KEY) {
      providers.push({
        name: "OpenRouter",
        url: "https://openrouter.ai/api/v1/chat/completions",
        key: OPENROUTER_API_KEY,
        models: { primary: "openai/gpt-4o-mini", fallback: "meta-llama/llama-3.3-70b-instruct" },
        extraHeaders: { "HTTP-Referer": "https://nextbull.app", "X-Title": "NextBull GPT" },
      });
    }

    if (OPENAI_API_KEY) {
      providers.push({
        name: "OpenAI",
        url: "https://api.openai.com/v1/chat/completions",
        key: OPENAI_API_KEY,
        models: { primary: "gpt-4o", fallback: "gpt-4o-mini" },
      });
    }

    if (GROQ_API_KEY) {
      providers.push({
        name: "Groq",
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: GROQ_API_KEY,
        models: { primary: "llama-3.3-70b-versatile", fallback: "llama-3.1-8b-instant" },
      });
    }

    // Legacy Lovable fallback
    if (LOVABLE_API_KEY && providers.length === 0) {
      providers.push({
        name: "Lovable",
        url: "https://api.lovable.dev/v1/chat/completions",
        key: LOVABLE_API_KEY,
        models: { primary: "openai/gpt-4o", fallback: "google/gemini-2.5-flash" },
      });
    }

    if (providers.length === 0) {
      throw new Error(
        "No AI API key configured. Please set one of: OPENROUTER_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY in your Supabase secrets. " +
        "Get a free key at https://openrouter.ai or https://console.groq.com"
      );
    }

    // Call a provider with a specific model
    const callProvider = async (provider: ProviderConfig, model: string, systemPrompt: string, maxTokens = 4096): Promise<string> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000); // 55s timeout
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${provider.key}`,
          "Content-Type": "application/json",
          ...(provider.extraHeaders || {}),
        };

        const res = await fetch(provider.url, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((msg: { role: string; content: string }) => ({
                role: msg.role,
                content: msg.content,
              })),
            ],
            temperature: 0.08,
            max_tokens: maxTokens,
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          throw new Error(`${provider.name}/${model} HTTP ${res.status}: ${errText.slice(0, 300)}`);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error(`${provider.name}/${model} returned empty content`);
        return content;
      } finally {
        clearTimeout(timeout);
      }
    };

    // Try each provider in priority order, with primary then fallback model
    let finalAssistantMessage = "";
    let lastError = "";

    for (const provider of providers) {
      // Try primary model
      try {
        console.log(`Trying ${provider.name} / ${provider.models.primary}...`);
        finalAssistantMessage = await callProvider(provider, provider.models.primary, fullSystemPrompt);
        console.log(`✅ ${provider.name}/${provider.models.primary} succeeded (${finalAssistantMessage.length} chars)`);
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`❌ ${provider.name} primary failed:`, lastError);
      }

      // Try fallback model
      try {
        console.log(`Trying ${provider.name} / ${provider.models.fallback}...`);
        finalAssistantMessage = await callProvider(provider, provider.models.fallback, fullSystemPrompt);
        console.log(`✅ ${provider.name}/${provider.models.fallback} succeeded (${finalAssistantMessage.length} chars)`);
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`❌ ${provider.name} fallback failed:`, lastError);
      }
    }

    if (!finalAssistantMessage) {
      throw new Error(`All AI providers failed. Last error: ${lastError}`);
    }

    console.log("Generated NextBull GPT response successfully.");

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
