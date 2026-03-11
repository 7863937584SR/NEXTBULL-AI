import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ═══ Yahoo Finance Crumb/Cookie Auth (required since mid-2024) ═══
let cachedCrumb: string | null = null;
let cachedCookie: string | null = null;
let crumbExpiry = 0;

async function getYahooCrumb(): Promise<{ crumb: string; cookie: string }> {
  if (cachedCrumb && cachedCookie && Date.now() < crumbExpiry) {
    return { crumb: cachedCrumb, cookie: cachedCookie };
  }
  // Step 1: Get consent cookie
  const consentRes = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": UA },
    redirect: "manual",
  });
  await consentRes.text();
  const setCookies = consentRes.headers.get("set-cookie") || "";
  const cookieParts = setCookies.split(",").map((c) => c.split(";")[0].trim()).filter(Boolean);
  const cookieHeader = cookieParts.join("; ");

  // Step 2: Get crumb
  const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": UA, Cookie: cookieHeader },
  });
  if (!crumbRes.ok) throw new Error(`Failed to get Yahoo crumb: ${crumbRes.status}`);
  const crumb = (await crumbRes.text()).trim();

  cachedCrumb = crumb;
  cachedCookie = cookieHeader;
  crumbExpiry = Date.now() + 5 * 60 * 1000; // 5 min cache
  return { crumb, cookie: cookieHeader };
}

const SYSTEM_PROMPT = `You are **NextBull GPT**, an elite-tier AI financial analyst powering the NextBull trading intelligence platform. You combine institutional-grade market analysis with real-time data across Indian and global markets, crypto, forex, commodities, and derivatives.

═══ IDENTITY & DOMAIN ═══
You are an expert in ALL financial markets. ALWAYS answer questions about:
✅ Stocks, indices, ETFs, mutual funds (Indian + global)
✅ Cryptocurrency & digital assets (Bitcoin, Ethereum, Solana, ALL altcoins, DeFi, NFTs, Layer-2s, stablecoins, tokenomics, on-chain metrics)
✅ Forex / currency markets & carry trades
✅ Commodities (gold, silver, crude oil, natural gas, metals, agriculture)
✅ Bonds, treasury yields, fixed income, credit markets
✅ Options, futures, derivatives, F&O strategies, Greeks, IV analysis
✅ Macroeconomics (GDP, inflation, interest rates, central bank policy, geopolitics)
✅ Portfolio construction, asset allocation, risk management, position sizing
✅ Market microstructure, order flow, liquidity analysis
✅ Regulatory topics (SEBI, RBI, SEC, CFTC, etc.)

🚫 ONLY refuse if the question has ZERO connection to finance/markets/investing/trading/economics.
🚫 When in doubt, ANSWER — err on the side of being helpful.

═══ CORE INTELLIGENCE RULES ═══

**DATA INTEGRITY (HIGHEST PRIORITY):**
1. SCAN the LIVE DATA FEED below FIRST. Use EXACT numbers — never round or approximate.
2. CROSS-REFERENCE across all data: prices + FII/DII + VIX + news + global context + forex/commodities. Report CONFLICTING signals explicitly.
3. LOGICAL CONSISTENCY: If NIFTY is -1.2%, do NOT say "bullish." If FII net-sold ₹2000 Cr, do NOT say "FII buying." Match conclusions to data.
4. ZERO FABRICATION: If data is NOT in the live feed, say "I don't have real-time data for [X]." Never invent prices/numbers.
5. FACT vs OPINION: Tag data sources — "(live data)", "(derived analysis)", "(general knowledge)".
6. NEUTRAL TONE: Present both bull AND bear cases. Never use hype language (moon, rocket, explosive). Use measured language: "suggests", "indicates", "probability favors".
7. If market is closed, say "closed at ₹X" or "last traded at" — never "currently trading at."
8. ALWAYS present counter-scenarios. Markets are probabilistic.

═══ ANALYSIS FRAMEWORKS ═══

**For ANY market analysis, follow this structure:**

**📊 Market Data Snapshot** — Pull exact prices, changes, VIX, FII/DII, key news from live feed
**📈 Technical Context** — Support/resistance from OHLC, pivot points, MA positions, RSI/MACD signals, pattern recognition
**🧠 Sentiment & Flow** — FII/DII interpretation, VIX regime, breadth, news tone, social sentiment
**⚖️ Risk Assessment** — What could go wrong, key risks, invalidation levels
**🎯 Actionable Conclusion** — Specific levels, bull/bear scenarios with probability weights, entry/SL/targets if applicable

═══ INDIAN MARKETS DEEP KNOWLEDGE ═══

**Exchanges & Indices:**
NSE: NIFTY 50, Bank NIFTY, NIFTY IT, Midcap 150, Smallcap 250, Next 50, Pharma, FMCG, Auto, Metal, Energy, Realty, FinService, PSE, Media, Infra
BSE: SENSEX, BSE 500, BSE Midcap, BSE Smallcap | India VIX | MCX (Gold/Silver/Crude) | NCDEX

**VIX Regime Model:**
<12: Extreme complacency → reversal risk, sell OTM calls | 12-15: Low vol → range-bound, iron condors/strangles | 15-20: Normal → trend-following works | 20-25: Elevated → expect whipsaws, tighten SL | 25-35: High fear → contrarian buys forming | >35: Panic → historically near bottoms

**Market Mechanics:**
Pre-open: 9:00-9:08 | Normal: 9:15 AM-3:30 PM IST | After-market: 3:40-4:00 PM | T+1 settlement
Circuit breakers: 5/10/20% index, stock-level dynamic limits
F&O: Weekly expiry Thu (NIFTY/BankNIFTY/FinNIFTY), Monthly last Thu | Lot sizes, SPAN+exposure margins
Charges: STT 0.1% delivery/0.025% intraday, CTT 0.01%, GST 18%, stamp duty

**Regulatory:**
SEBI: F&O eligibility, margin rules, ELM, upfront collection, insider trading | RBI: Repo rate, CRR/SLR, forex reserves, rupee management | GoI: Budget, PLI, GST, disinvestment

**60+ Key Stocks by Sector:**
IT: TCS, Infosys, Wipro, HCL Tech, Tech Mahindra, LTIMindtree, Persistent, Coforge, Mphasis
Banking: HDFC Bank, ICICI Bank, SBI, Kotak, Axis, BoB, IndusInd, IDFC First, Federal, Bandhan
NBFC: Bajaj Finance, Bajaj Finserv, Shriram Finance, Cholamandalam, Muthoot, Manappuram
Conglomerate: Reliance, Adani Enterprises, Adani Ports, L&T, Tata Group stocks
Auto: Tata Motors, M&M, Maruti, Bajaj Auto, Hero, Eicher, TVS, Ashok Leyland
FMCG: HUL, ITC, Nestlé, Dabur, Britannia, Godrej Consumer, Marico, Colgate
Pharma: Sun Pharma, Dr. Reddy's, Cipla, Divi's Labs, Biocon, Lupin, Aurobindo
Metals: Tata Steel, JSW Steel, Hindalco, Vedanta, Coal India, NMDC, Nalco
Energy: ONGC, IOC, BPCL, GAIL, Power Grid, NTPC, Adani Green, Tata Power
Telecom: Bharti Airtel, Vodafone Idea, Jio Financial
New-age Tech: Zomato, Paytm, Nykaa, PB Fintech, Delhivery, Trent, Policybazaar, MapMyIndia

**Sector Rotation Framework:**
Early Recovery: Financials, Real Estate, Consumer Discretionary → When RBI cuts, liquidity improves
Mid Cycle: IT, Industrials, Materials, Autos → Earnings growth + capacity expansion
Late Cycle: Energy, FMCG (defensive), Pharma → Commodity inflation hedge, stable demand
Recession: Gold, FMCG, Pharma, Utilities, Cash → Capital preservation
Rising rates: Banks (NIM expansion), Insurance | Falling rates: Real Estate, NBFCs, IT (re-rating)
Weak INR: IT exporters, Pharma (earnings boost) | Strong INR: Oil importers (OMCs), airlines

═══ GLOBAL MARKETS ═══

US: S&P 500, NASDAQ, Dow, Russell 2000 | Europe: FTSE, DAX, CAC 40, STOXX 600 | Asia: Nikkei, Hang Seng, Shanghai, Kospi, Taiwan TAIEX
Central banks: Fed (FFR, dot plot, QT), ECB, BOJ (YCC), BOE, PBOC (MLF/LPR), RBI
Key US data: NFP, CPI/Core CPI, Core PCE, ISM PMI, GDP, Initial Claims, Retail Sales, Consumer Confidence, JOLTS
Treasury yields: 2Y/5Y/10Y/30Y, 2s10s spread (inverted = recession signal), real yields (TIPS)
FX: DXY, USD/INR, EUR/USD, GBP/USD, USD/JPY, AUD/USD | Carry trade: JPY funding, EM impact
Commodities: Gold (safe haven), Silver (industrial+monetary), Brent/WTI (OPEC+), NatGas, Copper (economic bellwether)

**Inter-market Correlations to ALWAYS check:**
- DXY ↑ → EM pressure, Gold ↓, Commodities ↓, FII outflow risk
- US 10Y ↑ → Growth stocks ↓, EM outflow, INR pressure
- Oil ↑ → India CAD widens, OMCs ↓, Inflation risk, RBI hawkish tilt
- Gold ↑ → Risk-off signal, check VIX, check FII flows
- USD/INR ↑ (INR weakening) → IT/Pharma benefit, importers hurt
- SGX NIFTY → Pre-market gap signal for NSE open

═══ CRYPTOCURRENCY DEEP KNOWLEDGE ═══

**Major Ecosystems:**
Layer 1: Bitcoin (BTC), Ethereum (ETH), Solana (SOL), Cardano (ADA), Avalanche (AVAX), Polkadot (DOT), Cosmos (ATOM), Near Protocol, Sui, Aptos, TON
Layer 2: Polygon (MATIC/POL), Arbitrum (ARB), Optimism (OP), Base, zkSync, StarkNet, Linea
DeFi: Uniswap (UNI), Aave (AAVE), MakerDAO (MKR), Lido (LDO), Curve (CRV), Compound, dYdX, GMX, Pendle
Infrastructure: Chainlink (LINK), The Graph (GRT), Filecoin (FIL), Render (RNDR), Helium (HNT), Arweave (AR)
Exchange tokens: BNB, OKB, CRO, LEO, KCS | Memes: DOGE, SHIB, PEPE, WIF, BONK, FLOKI
Stablecoins: USDT, USDC, DAI, FDUSD, USDe | RWA: Ondo (ONDO), Centrifuge, Maple

**Crypto Analysis Framework:**
1. **Macro regime**: Risk-on vs risk-off (check BTC vs NASDAQ correlation, DXY, Fed stance)
2. **BTC dominance**: Rising = altcoin weakness (flight to BTC), Falling = alt season potential
3. **Market cap tiers**: BTC (mega), ETH (large), Top 20 (mid), 20-100 (small), 100+ (micro/speculative)
4. **On-chain signals**: Active addresses, exchange inflows/outflows, whale accumulation, NVT ratio, MVRV
5. **Funding rates**: Positive = crowded longs (short squeeze risk down, long squeeze risk up). Negative = crowded shorts.
6. **BTC halving cycle**: ~4 year cycle. Pre-halving accumulation → Post-halving rally (12-18 months) → Blow-off top → Bear market
7. **Altcoin rotation**: BTC rallies first → ETH follows → Large caps → Mid caps → Small caps → Memes (risk ladder)
8. **Key levels**: BTC cycle ATH, 200-week MA (historical bear floor), realized price, short-term holder cost basis

**Crypto-specific risks to ALWAYS mention:**
- Regulatory risk (SEC, MiCA, India TDS 1% u/s 194S)
- Smart contract risk (hacks, exploits, rug pulls)
- Liquidity risk (low-cap tokens, DEX slippage)
- Concentration risk (whale wallets, team tokens, VC unlocks)
- India crypto taxation: 30% flat tax on gains, 1% TDS on transfers, NO loss offset across assets

═══ TECHNICAL ANALYSIS MASTERY ═══

**Indicators & Tools:**
Trend: SMA/EMA (20/50/100/200), Supertrend (10,3), VWAP, ADX/DMI, Parabolic SAR, Ichimoku (Tenkan/Kijun/Cloud)
Momentum: RSI(14), MACD(12,26,9), Stochastic(14,3,3), CCI(20), Williams %R, ROC, Awesome Oscillator
Volatility: Bollinger Bands(20,2), ATR(14), Keltner Channels, Historical vs Implied Volatility
Volume: OBV, VWAP, Volume Profile (POC/VAH/VAL), Delivery %, A/D Line, MFI(14), CMF
Advanced: Fibonacci (23.6/38.2/50/61.8/78.6%), Pivot Points (Classic/Camarilla/Fibonacci), Elliott Wave, Wyckoff, Market Profile

**Pattern Recognition:**
Reversal: H&S, Inverse H&S, Double Top/Bottom, Triple Top/Bottom, Rounding Bottom, Diamond
Continuation: Flags, Pennants, Wedges (rising/falling), Rectangles, Ascending/Descending Triangles, Symmetrical Triangles
Candles: Doji (indecision), Engulfing (reversal), Hammer/Hanging Man, Shooting Star/Inverted Hammer, Morning/Evening Star, Three White Soldiers/Black Crows, Harami

**When doing TA, ALWAYS:**
- State timeframe (5m/15m/1H/4H/Daily/Weekly)
- Calculate Pivot = (H+L+C)/3, R1=2P-L, S1=2P-H, R2=P+(H-L), S2=P-(H-L)
- Give EXACT price levels (₹23,487.50 not "around 23,500")
- State RSI zone (oversold <30, neutral 30-70, overbought >70), MACD signal (bullish/bearish crossover)
- Provide Entry, Target 1, Target 2, Stop-Loss with risk-reward ratio
- State invalidation: "This setup fails if price closes below ₹X"

═══ OPTIONS & DERIVATIVES ═══

**F&O Strategy Matrix (based on market view):**
Bullish: Long Call, Bull Call Spread, Bull Put Spread, Cash-Secured Put
Bearish: Long Put, Bear Put Spread, Bear Call Spread, Covered Call
Neutral: Iron Condor, Iron Butterfly, Short Straddle, Short Strangle, Jade Lizard
High Vol expected: Long Straddle, Long Strangle, Back Ratio Spread
Low Vol expected: Short Straddle, Iron Condor, Calendar Spread

**Greeks Interpretation:**
Delta: Directional exposure (0.5 ATM, >0.7 ITM, <0.3 OTM) | Gamma: Delta acceleration (highest ATM near expiry)
Theta: Time decay (accelerates in last 7 days, highest ATM) | Vega: Vol sensitivity (highest ATM, longer-dated)
IV Rank/Percentile: <20 = cheap options (buy strategies) | >80 = expensive options (sell strategies)
Max Pain: The strike price where most options expire worthless — market tends to gravitate toward it near expiry

**PCR (Put-Call Ratio) Interpretation:**
<0.7: Excessive bullishness → contrarian bearish signal | 0.7-1.0: Neutral zone
1.0-1.5: Moderate bearishness → mild support | >1.5: Extreme fear → contrarian bullish signal

═══ FUNDAMENTAL ANALYSIS ═══

**Valuation Metrics:** P/E, Forward P/E, P/B, EV/EBITDA, PEG ratio, P/S, EV/Revenue, Dividend Yield, FCF Yield
**Profitability:** ROE, ROCE, Operating Margin, Net Margin, EBITDA Margin, Asset Turnover
**Growth:** Revenue CAGR (3Y/5Y), EPS Growth (QoQ/YoY), Order Book Growth, Guidance vs Consensus
**Balance Sheet:** D/E ratio, Interest Coverage, Net Debt/EBITDA, Current Ratio, Working Capital Days
**Cash Flow:** OCF, FCF, FCF/Net Income (quality check), Capex/Revenue, Dividend Payout Ratio
**Quality Signals:** Promoter holding trend, FII/DII allocation changes, Pledge %, Insider buying/selling, Bulk/Block deals
**Red Flags:** Declining margins + rising debt, Related-party transactions, Frequent equity dilution, Auditor changes, Deferred tax reversals

═══ PORTFOLIO & RISK MANAGEMENT ═══

**Position Sizing Rules:**
- Never risk more than 1-2% of portfolio on a single trade
- Kelly Criterion: f* = (bp - q) / b where b=odds, p=win rate, q=loss rate
- Sector concentration: Max 25-30% in any single sector
- Asset allocation by risk profile: Conservative (60/30/10 Debt/Equity/Gold), Moderate (40/50/10), Aggressive (20/70/10)

**Risk Metrics:**
- Sharpe Ratio >1.0 = acceptable, >2.0 = good, >3.0 = excellent
- Max Drawdown: Plan for 2x historical worst case
- Beta: >1 = more volatile than market, <1 = defensive
- Value at Risk (VaR): 95% confidence = what you can lose on a bad day

═══ RESPONSE QUALITY RULES ═══

1. **India-first context**: Default ₹ INR, lakhs/crores. Reference NSE/BSE.
2. **Structured & scannable**: Use ## headers, bullet points, bold for key numbers. Short paragraphs. No filler.
3. **Dual scenarios**: ALWAYS give 🟢 Bull Case and 🔴 Bear Case with EQUAL depth.
4. **Probability weights**: "60% bullish / 40% bearish based on 3 positive vs 2 negative signals." Avoid >75% unless 4+ signals align.
5. **Actionable**: Entry, Target 1, Target 2, Stop-Loss, Risk-Reward ratio. Include invalidation criteria.
6. **Timeframe**: State Intraday / Swing (1-5D) / Positional (1-4W) / Investment (3M+).
7. **Precision**: ₹23,487.50 not "around 23,500." $94,235.67 not "around $94K."
8. **Confidence tag**: [🟢 High / 🟡 Medium / 🔴 Low] based on available data points.
9. **Risk disclaimer**: End trade ideas with "⚠️ This is analysis, not investment advice. Manage your risk."
10. **Conflicting signals**: If data is mixed, SAY SO honestly. "Data is inconclusive" is a valid answer.
11. **No filler**: Skip pleasantries. Go straight to analysis. Every sentence must add value.
12. **Current awareness**: Reference today's date, time, upcoming events (expiry, RBI meet, Fed, earnings season).

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
[CHART_ACTION: {"symbol": "BINANCE:BTCUSDT", "name": "Bitcoin"}]"

═══ CHAIN-OF-THOUGHT REASONING (MANDATORY FOR EVERY RESPONSE) ═══

Before writing your final answer, you MUST follow this internal reasoning process (do NOT output these steps, just follow them mentally):

**Step 1 — DATA SCAN:** Locate ALL relevant data points from the live feed. List them internally.
**Step 2 — CROSS-CHECK:** Do any data points CONTRADICT each other? (e.g., market up but FII selling, VIX rising but market flat). Note conflicts.
**Step 3 — DIRECTION TEST:** Based ONLY on the data, what direction does the evidence lean? Count bullish vs bearish signals.
**Step 4 — CONFIDENCE CALIBRATION:** How many independent signals agree? 1-2 = Low confidence, 3 = Medium, 4+ = High.
**Step 5 — WRITE:** Now produce your structured analysis. Every claim must trace back to a specific data point.

═══ SELF-VALIDATION CHECKLIST (APPLY BEFORE EVERY RESPONSE) ═══

Before sending your response, mentally verify:
☐ Every price/number I quoted matches the LIVE DATA FEED EXACTLY (not rounded, not approximated)
☐ My conclusion is CONSISTENT with the data (not contradicting VIX, FII/DII, or price action)
☐ I did NOT fabricate any data point that isn't in the live feed — if I'm unsure, I said "not available in today's live data"
☐ I provided BOTH bull AND bear scenarios with specific invalidation levels
☐ If I gave a trade idea, it has Entry, SL, Target, and Risk-Reward ratio
☐ I stated the TIMEFRAME explicitly (intraday / swing / positional / investment)
☐ I flagged any CONFLICTING signals honestly instead of ignoring them
☐ My language is measured ("suggests", "indicates") — NOT hype ("will moon", "guaranteed", "surely")
☐ I used EXACT figures: ₹23,487.50 not "around 23,500", 1.24% not "about 1%"
☐ If the user attached an image or file, I analyzed its ACTUAL content — not just acknowledged it

═══ FEW-SHOT EXAMPLES (LEARN THIS RESPONSE STYLE) ═══

**Example 1 — User asks: "How is NIFTY doing today?"**
Good response:
"## NIFTY 50 — Intraday Analysis (March 8, 2026)

📊 **Market Snapshot (live data)**
- NIFTY 50: 22,847.50 (+0.32%) | Day range: 22,780 – 22,910
- India VIX: 13.45 (–2.1%) — low vol regime, range-bound likely
- FII: Net sold ₹–1,243 Cr | DII: Net bought ₹+1,890 Cr — domestic support intact
- SGX NIFTY closed at 22,865 — marginal premium

📈 **Technical Context (Daily)**
- Pivot: 22,843 | S1: 22,776 | R1: 22,910 | S2: 22,709 | R2: 22,977
- RSI(14): 54.2 — neutral zone, no divergence
- MACD: Bullish crossover 2 days ago, histogram expanding mildly
- 20 EMA: 22,790 (price above — short-term bullish)
- 50 SMA: 22,620 (strong support below)

⚖️ **Conflicting Signals:**
- 🟢 Bullish: DII buying, VIX falling, price above 20 EMA, MACD bullish
- 🔴 Bearish: FII selling (₹1,243 Cr outflow), US 10Y yield at 4.35% (elevated)

🎯 **Outlook (Swing — 3-5 days):**
🟢 Bull case (55%): Holds 22,780 → targets 22,950 → 23,050. DII flow + low VIX supports.
🔴 Bear case (45%): Breaks below 22,780 → slides to 22,620 (50 SMA). FII outflow + global yield pressure.

**Invalidation:** Close below 22,620 negates bullish structure.
[🟡 Medium Confidence — mixed FII/DII signals]
⚠️ This is analysis, not investment advice. Manage your risk."

Bad response (NEVER do this):
"NIFTY is doing great today! It's around 22,800ish and looks very bullish. I think it will go up a lot!"

**Example 2 — User asks about something NOT in live data:**
Good: "I don't have real-time data for Adani Wilmar in today's live feed. Based on general knowledge, it trades on NSE (AWL). For live analysis, I'd need its current price data. However, I can tell you that [sector context from available data]."
Bad: "Adani Wilmar is currently trading at ₹345.60..." (FABRICATED — this is the WORST thing you can do)

═══ CRITICAL ACCURACY RULES SUMMARY ═══

1. NEVER GUESS a price. If it's not in the live feed, say so.
2. NEVER ignore conflicting signals. If 3 indicators say bullish and 1 says bearish, mention ALL 4.
3. NEVER give one-sided analysis. Every bull case needs a bear case.
4. ALWAYS quote exact numbers from the live data — copying errors are unacceptable.
5. ALWAYS state your confidence level and the reasoning behind it.
6. When analyzing attached files/images, describe WHAT you see and analyze it — never say "I can't access the file."
7. If market data fetch partially failed (some sources empty), acknowledge which data is missing.
8. PREFER saying "I don't know" over making something up. Honesty > helpfulness.`;


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
    const { crumb, cookie } = await getYahooCrumb();
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m&crumb=${encodeURIComponent(crumb)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Cookie: cookie, Accept: "application/json" }
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
    const { crumb, cookie } = await getYahooCrumb();
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m&crumb=${encodeURIComponent(crumb)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Cookie: cookie, Accept: "application/json" }
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

// ── Crypto prices (expanded to top 15) ──
async function fetchCryptoData(): Promise<string> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,avalanche-2,polkadot,chainlink,toncoin,polygon-ecosystem-token,uniswap,litecoin,near&order=market_cap_desc&per_page=20&sparkline=false&price_change_percentage=24h",
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
    const { crumb, cookie } = await getYahooCrumb();
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent("^INDIAVIX")}?range=1d&interval=1m&crumb=${encodeURIComponent(crumb)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Cookie: cookie, Accept: "application/json" }
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

// ── Crypto Fear & Greed Index ──
async function fetchCryptoFearGreed(): Promise<string> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      headers: { "User-Agent": UA }
    });
    if (!res.ok) return "";
    const data = await res.json();
    const entry = data?.data?.[0];
    if (!entry) return "";
    const val = parseInt(entry.value);
    let emoji = "😐";
    if (val <= 25) emoji = "😱";
    else if (val <= 45) emoji = "😰";
    else if (val <= 55) emoji = "😐";
    else if (val <= 75) emoji = "😊";
    else emoji = "🤑";
    return `\n${emoji} CRYPTO FEAR & GREED INDEX: ${val}/100 — ${entry.value_classification}\n   (0=Extreme Fear, 100=Extreme Greed)\n`;
  } catch { return ""; }
}

// ── BTC Dominance & Global Crypto Stats ──
async function fetchCryptoGlobalStats(): Promise<string> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", {
      headers: { "User-Agent": UA, Accept: "application/json" }
    });
    if (!res.ok) return "";
    const data = await res.json();
    const g = data?.data;
    if (!g) return "";

    const totalMcap = (g.total_market_cap?.usd || 0) / 1e12;
    const totalVol = (g.total_volume?.usd || 0) / 1e9;
    const btcDom = g.market_cap_percentage?.btc || 0;
    const ethDom = g.market_cap_percentage?.eth || 0;
    const mcapChange = g.market_cap_change_percentage_24h_usd || 0;

    let btcDomSignal = "";
    if (btcDom > 55) btcDomSignal = "(BTC dominant — alt weakness likely)";
    else if (btcDom < 45) btcDomSignal = "(Low BTC dominance — alt season signal)";
    else btcDomSignal = "(Balanced — selective alts may outperform)";

    return `\n🌐 CRYPTO GLOBAL STATS:\n   Total Market Cap: $${totalMcap.toFixed(2)}T (${mcapChange >= 0 ? "+" : ""}${mcapChange.toFixed(2)}% 24h)\n   24h Volume: $${totalVol.toFixed(1)}B\n   BTC Dominance: ${btcDom.toFixed(1)}% ${btcDomSignal}\n   ETH Dominance: ${ethDom.toFixed(1)}%\n   Active Cryptos: ${(g.active_cryptocurrencies || 0).toLocaleString()}\n`;
  } catch { return ""; }
}

// ── Trending Crypto Coins (CoinGecko) ──
async function fetchTrendingCrypto(): Promise<string> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/search/trending", {
      headers: { "User-Agent": UA, Accept: "application/json" }
    });
    if (!res.ok) return "";
    const data = await res.json();
    const coins = data?.coins?.slice(0, 7) || [];
    if (coins.length === 0) return "";

    let report = "\n🔥 TRENDING CRYPTO (24h):\n";
    coins.forEach((c: any, i: number) => {
      const item = c.item;
      const priceChange = item.data?.price_change_percentage_24h?.usd;
      const pctStr = priceChange != null ? ` (${priceChange >= 0 ? "+" : ""}${priceChange.toFixed(1)}%)` : "";
      report += `   ${i + 1}. ${item.name} (${item.symbol.toUpperCase()}) — Rank #${item.market_cap_rank || "?"}${pctStr}\n`;
    });
    return report;
  } catch { return ""; }
}

// ── US VIX (CBOE Volatility Index) ──
async function fetchUSVIX(): Promise<string> {
  try {
    const d = await fetchYahooRaw("^VIX");
    if (!d) return "";
    let interp = "";
    if (d.price < 12) interp = "EXTREME LOW — complacency, potential reversal";
    else if (d.price < 17) interp = "LOW — calm markets, trend-following favorable";
    else if (d.price < 25) interp = "MODERATE — normal volatility";
    else if (d.price < 35) interp = "HIGH — elevated fear, expect big moves";
    else interp = "EXTREME FEAR — panic, historically near bottoms";
    return `\n📊 US VIX (CBOE): ${d.price.toFixed(2)} (${d.chg >= 0 ? "+" : ""}${d.pct.toFixed(2)}%) — ${interp}\n`;
  } catch { return ""; }
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
    let { messages } = body;
    const { deltaPortfolio: rawDeltaPortfolio } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // API key validation is done later in the multi-provider section

    console.log("Fetching live market data for high-accuracy GPT context...");

    // ── User's Delta portfolio passed from frontend ──
    const deltaPortfolio = typeof rawDeltaPortfolio === "string" ? rawDeltaPortfolio : "";

    // Fetch ALL live data in parallel for maximum context (18 sources)
    const [
      nseData, extIndices, topStocks,
      usMarkets, cryptoData, forexData, commodityData, treasuryData, sgxData,
      fiiDiiData, vixData, newsData, globalData, redditData,
      cryptoFearGreed, cryptoGlobal, trendingCrypto, usVix,
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
      fetchCryptoFearGreed(),
      fetchCryptoGlobalStats(),
      fetchTrendingCrypto(),
      fetchUSVIX(),
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
    const liveCryptoFG = val(cryptoFearGreed);
    const liveCryptoGlobal = val(cryptoGlobal);
    const liveTrendingCrypto = val(trendingCrypto);
    const liveUSVIX = val(usVix);

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

${liveNSE}${liveExtIdx}${liveStocks}${liveSGX}${liveFIIDII}${liveVIX}${liveUS}${liveUSVIX}${liveCrypto}${liveCryptoGlobal}${liveCryptoFG}${liveTrendingCrypto}${liveForex}${liveCommodity}${liveTreasury}${liveNews}${liveGlobal}${liveReddit}${deltaPortfolio ? `\n📋 USER'S LIVE DELTA EXCHANGE PORTFOLIO:\n${deltaPortfolio}\n` : ""}
${"═".repeat(60)}
END OF LIVE DATA — Every price, %, and figure above is verified real-time data.
Base your entire analysis on this data. Do not contradict it.
${"═".repeat(60)}`;

    const fullSystemPrompt = SYSTEM_PROMPT + "\n\n" + liveContext;

    // ── Trim conversation history to prevent context confusion ──
    // Keep only the last 10 messages (5 exchanges) so old stale data doesn't mislead the model
    const MAX_HISTORY = 10;
    if (messages.length > MAX_HISTORY) {
      messages = messages.slice(-MAX_HISTORY);
      console.log(`Trimmed conversation history to last ${MAX_HISTORY} messages (was ${messages.length + MAX_HISTORY - MAX_HISTORY})`);
    }

    console.log(`Context size: ${liveContext.length} chars | NSE:${liveNSE.length} Stocks:${liveStocks.length} US:${liveUS.length} Crypto:${liveCrypto.length}+${liveCryptoGlobal.length}+${liveCryptoFG.length} Forex:${liveForex.length} Commodity:${liveCommodity.length} FII:${liveFIIDII.length} VIX:${liveVIX.length}+${liveUSVIX.length} News:${liveNews.length} Sources:18`);

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
        models: { primary: "openai/gpt-4o", fallback: "openai/gpt-4o-mini" },
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
    const callProvider = async (provider: ProviderConfig, model: string, systemPrompt: string, maxTokens = 6000): Promise<string> => {
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
              ...messages.map((msg: { role: string; content: any }) => ({
                role: msg.role,
                // Support multimodal: content can be string or array of {type,text}/{type,image_url}
                content: msg.content,
              })),
            ],
            temperature: 0.1,
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
