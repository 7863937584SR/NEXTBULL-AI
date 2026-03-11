import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface RssItem {
  title: string;
  pubDate: string;
  description: string;
  link: string;
  source?: string;
}

/** Simple XML → items parser for Google News RSS */
function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const tag = (name: string): string => {
      const m = block.match(new RegExp(`<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${name}>|<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`));
      return (m?.[1] || m?.[2] || "").trim();
    };
    items.push({
      title: tag("title"),
      pubDate: tag("pubDate"),
      description: tag("description").replace(/<[^>]*>/g, "").trim(),
      link: tag("link"),
      source: tag("source"),
    });
  }
  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch multiple Google News RSS feeds in parallel
    const feeds = [
      {
        url: "https://news.google.com/rss/search?q=india+economic+data+RBI+GDP+CPI+inflation+rate+decision&hl=en-IN&gl=IN&ceid=IN:en",
        defaultCountry: "IN",
      },
      {
        url: "https://news.google.com/rss/search?q=US+economic+data+Fed+NFP+CPI+GDP+FOMC+treasury&hl=en-US&gl=US&ceid=US:en",
        defaultCountry: "US",
      },
      {
        url: "https://news.google.com/rss/search?q=global+economy+ECB+BOJ+central+bank+rate+decision&hl=en&gl=US&ceid=US:en",
        defaultCountry: "GL",
      },
    ];

    const results = await Promise.allSettled(
      feeds.map(async (feed) => {
        const res = await fetch(feed.url, {
          headers: { "User-Agent": UA },
        });
        if (!res.ok) throw new Error(`RSS ${res.status}`);
        const xml = await res.text();
        const items = parseRssXml(xml);
        return items.map((item) => ({
          ...item,
          defaultCountry: feed.defaultCountry,
        }));
      })
    );

    const allItems: Array<RssItem & { defaultCountry: string }> = [];
    for (const r of results) {
      if (r.status === "fulfilled") allItems.push(...r.value);
    }

    // De-duplicate by title
    const seen = new Set<string>();
    const unique = allItems.filter((item) => {
      const key = item.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Classify each item
    const events = unique.slice(0, 60).map((item) => {
      const titleLow = item.title.toLowerCase();

      // Country detection
      let country = item.defaultCountry;
      if (
        titleLow.match(
          /\bindia\b|rbi|nifty|sensex|rupee|sebi|indian/
        )
      )
        country = "IN";
      else if (
        titleLow.match(
          /\bus\b|\bu\.s\b|fed |fomc|dollar|nfp|payroll|treasury|wall street|nasdaq|s&p/
        )
      )
        country = "US";
      else if (titleLow.match(/ecb|euro(?:zone)?|eu /)) country = "EU";
      else if (titleLow.match(/japan|boj|yen|nikkei/)) country = "JP";
      else if (titleLow.match(/china|pboc|yuan|shanghai/)) country = "CN";
      else if (titleLow.match(/\buk\b|boe|sterling|pound|ftse/))
        country = "UK";

      // Impact classification
      let impact = "low";
      if (
        titleLow.match(
          /gdp|inflation|cpi|rate decision|nfp|payroll|employment|rbi|fed |fomc|interest rate|recession|crash/
        )
      )
        impact = "high";
      else if (
        titleLow.match(
          /pmi|trade|deficit|surplus|manufacturing|services|consumer|sentiment|housing|retail/
        )
      )
        impact = "medium";

      // Category
      let category = "Economy";
      if (titleLow.match(/gdp|growth/)) category = "GDP";
      else if (titleLow.match(/inflation|cpi|wpi|pce/)) category = "Inflation";
      else if (titleLow.match(/rate|monetary|rbi|fed|boj|ecb|boe/))
        category = "Monetary";
      else if (titleLow.match(/employ|job|payroll|nfp|unemployment/))
        category = "Employment";
      else if (titleLow.match(/trade|export|import|deficit/))
        category = "Trade";
      else if (titleLow.match(/pmi|manufactur|industrial|services/))
        category = "Manufacturing";
      else if (titleLow.match(/fiscal|tax|budget|revenue/))
        category = "Fiscal";
      else if (titleLow.match(/sentiment|consumer|confidence/))
        category = "Sentiment";
      else if (titleLow.match(/housing|real estate|mortgage/))
        category = "Housing";
      else if (titleLow.match(/oil|crude|energy|opec/)) category = "Energy";

      return {
        title: item.title.slice(0, 150),
        pubDate: item.pubDate,
        description: item.description?.slice(0, 250) || "",
        link: item.link,
        source: item.source || "",
        country,
        impact,
        category,
      };
    });

    return new Response(
      JSON.stringify({
        events,
        fetchedAt: new Date().toISOString(),
        totalItems: events.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("economic-calendar error:", msg);
    return new Response(
      JSON.stringify({ error: msg, events: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
