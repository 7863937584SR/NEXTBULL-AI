import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ────────────────── RSS FEED PARSER ──────────────────
function parseRSSItems(xml: string, source: string, category: string, maxItems = 8): any[] {
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < maxItems) {
        const block = match[1];
        const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] ||
            block.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const link = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
        const desc = block.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/)?.[1] ||
            block.match(/<description>(.*?)<\/description>/)?.[1] || '';

        if (title) {
            items.push({
                title: title.replace(/<[^>]*>/g, '').trim(),
                description: desc.replace(/<[^>]*>/g, '').trim().slice(0, 200),
                source,
                category,
                url: link,
                publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            });
            count++;
        }
    }

    return items;
}

// ────────────────── REDDIT FETCHER ──────────────────
async function fetchReddit(subreddit: string, category: string, limit = 6): Promise<any[]> {
    try {
        const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}&raw_json=1`, {
            headers: { "User-Agent": UA },
        });
        if (!res.ok) return [];
        const data = await res.json();

        return (data?.data?.children || [])
            .filter((c: any) => !c.data.stickied && c.data.title)
            .map((c: any) => ({
                title: c.data.title,
                description: (c.data.selftext || '').slice(0, 200),
                source: `r/${subreddit}`,
                category,
                url: `https://reddit.com${c.data.permalink}`,
                publishedAt: new Date(c.data.created_utc * 1000).toISOString(),
                upvotes: c.data.ups,
                comments: c.data.num_comments,
            }));
    } catch (e) {
        console.error(`Reddit r/${subreddit} error:`, e);
        return [];
    }
}

// ────────────────── RSS FETCHER ──────────────────
async function fetchRSS(url: string, source: string, category: string, maxItems = 8): Promise<any[]> {
    try {
        const res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" },
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRSSItems(xml, source, category, maxItems);
    } catch (e) {
        console.error(`RSS ${source} error:`, e);
        return [];
    }
}

// ────────────────── MAIN HANDLER ──────────────────
serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log("Fetching market news from multiple sources...");

        // Fetch from all sources in parallel
        const [
            googleIndiaMarket,
            googleGlobalMarket,
            googleNifty,
            moneycontrolRSS,
            etMarketsRSS,
            redditIndianStocks,
            redditWallStreet,
            redditStocks,
            liveMintRSS,
        ] = await Promise.allSettled([
            // Google News RSS feeds
            fetchRSS(
                "https://news.google.com/rss/search?q=indian+stock+market+NSE+BSE&hl=en-IN&gl=IN&ceid=IN:en",
                "Google News", "indian", 10
            ),
            fetchRSS(
                "https://news.google.com/rss/search?q=global+stock+market+wall+street+nasdaq&hl=en-US&gl=US&ceid=US:en",
                "Google News", "global", 8
            ),
            fetchRSS(
                "https://news.google.com/rss/search?q=NIFTY+SENSEX+RBI+SEBI&hl=en-IN&gl=IN&ceid=IN:en",
                "Google News", "indian", 6
            ),
            // MoneyControl RSS
            fetchRSS(
                "https://www.moneycontrol.com/rss/marketreports.xml",
                "MoneyControl", "indian", 8
            ),
            // Economic Times Markets
            fetchRSS(
                "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
                "Economic Times", "indian", 8
            ),
            // Reddit
            fetchReddit("IndianStockMarket", "indian", 8),
            fetchReddit("wallstreetbets", "global", 6),
            fetchReddit("stocks", "global", 6),
            // LiveMint Markets
            fetchRSS(
                "https://www.livemint.com/rss/markets",
                "LiveMint", "indian", 6
            ),
        ]);

        // Collect all successful results
        const allNews: any[] = [];
        const results = [
            googleIndiaMarket, googleGlobalMarket, googleNifty,
            moneycontrolRSS, etMarketsRSS,
            redditIndianStocks, redditWallStreet, redditStocks,
            liveMintRSS,
        ];

        for (const result of results) {
            if (result.status === "fulfilled" && Array.isArray(result.value)) {
                allNews.push(...result.value);
            }
        }

        // Deduplicate by title similarity (exact match)
        const seen = new Set<string>();
        const unique = allNews.filter(item => {
            const key = item.title.toLowerCase().trim().slice(0, 60);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Sort by publishedAt (newest first)
        unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        const sourceCounts: Record<string, number> = {};
        for (const item of unique) {
            sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
        }

        console.log(`Fetched ${unique.length} unique news items from:`, sourceCounts);

        return new Response(
            JSON.stringify({
                news: unique,
                fetchedAt: new Date().toISOString(),
                sources: Object.keys(sourceCounts),
                totalItems: unique.length,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error("Market news fetch error:", msg);
        return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
