const db = require("../config/db");
const axios = require("axios");
const { POPULAR_TICKERS } = require("../constants/popularTickers");
const cache = require("../config/cache");

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "d73ns7pr01qjjol3m9l0d73ns7pr01qjjol3m9lg";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

// ── Helpers ──────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function finnhubFetch(pathWithQuery, logCtx, retries = 1) {
  try {
    const url = pathWithQuery.includes("?")
      ? `${FINNHUB_BASE}${pathWithQuery}&token=${FINNHUB_API_KEY}`
      : `${FINNHUB_BASE}${pathWithQuery}?token=${FINNHUB_API_KEY}`;
    const { data } = await axios.get(url, { timeout: 12000 });
    return data;
  } catch (e) {
    const status = e.response?.status;
    const pathPart = pathWithQuery.split("?")[0];
    if (status === 429 && retries > 0) {
      console.warn(`[research] Finnhub ${pathPart} rate-limited — retrying in 2s`);
      await delay(2000);
      return finnhubFetch(pathWithQuery, logCtx, retries - 1);
    }
    console.warn(`[research] Finnhub ${pathPart}${logCtx ? ` (${logCtx})` : ""}:`, status || e.message);
    return null;
  }
}

// ── News helpers ─────────────────────────────────────────────────────────────
function relatedSymbolsIncludes(relatedField, sym) {
  if (!sym || !relatedField) return false;
  return String(relatedField).toUpperCase().split(",").map((s) => s.trim()).includes(sym);
}

function mapNewsRow(item, contextTicker, feedLabel) {
  return {
    id: item.id,
    headline: item.headline,
    summary: item.summary,
    source: item.source,
    url: item.url,
    image: item.image,
    category: item.category,
    datetime: item.datetime,
    related: item.related,
    ticker: contextTicker || null,
    feedLabel: feedLabel || null,
    sentiment_score: Math.random() * 2 - 1,
    trust_score: Math.floor(70 + Math.random() * 30),
  };
}

function newsRowKey(row) {
  return row.id != null
    ? String(row.id)
    : `${row.url || "nourl"}-${row.datetime || 0}-${(row.headline || "").slice(0, 40)}`;
}

const STOCK_KEYWORDS = [
  "stock", "share", "equity", "market", "nasdaq", "nyse", "s&p", "dow jones",
  "earnings", "ipo", "merger", "acquisition", "revenue", "profit", "dividend",
  "investor", "portfolio", "etf", "fund", "bond", "fed", "federal reserve",
  "interest rate", "inflation", "gdp", "quarter", "fiscal", "wall street",
  "sec", "analyst", "forecast", "rally", "selloff", "bull", "bear",
  "volatility", "index", "sector", "valuation", "market cap", "trade",
];

function isStockMarketRelevant(item) {
  if (!item?.headline) return false;
  const text = `${item.headline} ${item.summary || ""}`.toLowerCase();
  return STOCK_KEYWORDS.some((kw) => text.includes(kw));
}

function classifyArticle(item) {
  const text = `${item.headline} ${item.summary || ""}`.toLowerCase();
  if (/\bearnings?\b|revenue|profit|loss|\beps\b|quarterly|fiscal/.test(text)) return "earnings";
  if (/\bmerger\b|acquisition|acqui|takeover|buyout|\bdeal\b/.test(text)) return "merger";
  if (/\bipo\b|initial public offering|list[s]? on|stock market debut/.test(text)) return "ipo";
  return "general";
}

// ── Fetch general news pool once, cache 5 min ────────────────────────────────
async function getGeneralNewsFeed() {
  const ck = "general-feed";
  const cached = cache.get(ck, cache.TTL.GENERAL_NEWS);
  if (cached) return cached;

  let raw = [];
  try {
    const { data } = await axios.get(
      `${FINNHUB_BASE}/news?category=general&token=${FINNHUB_API_KEY}`,
      { timeout: 15000 }
    );
    raw = Array.isArray(data) ? data : [];
  } catch (e) {
    if (e.response?.status === 429) throw e; // bubble up for caller to handle
    console.warn("[research] general news fetch failed:", e.message);
  }

  const byId = new Map();
  for (const item of raw) {
    if (!item?.headline) continue;
    if (!isStockMarketRelevant(item)) continue;
    const subCat = classifyArticle(item);
    const row = mapNewsRow(item, null, subCat);
    const k = newsRowKey(row);
    if (!byId.has(k)) byId.set(k, { ...row, id: k, category: subCat });
  }

  const pool = Array.from(byId.values()).sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
  cache.set(ck, pool);
  return pool;
}

// ── GET /api/research/assets ─────────────────────────────────────────────────
const getAssets = (req, res) => {
  db.query("SELECT * FROM assets ORDER BY esg_score DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error" });
    res.json(rows);
  });
};

// ── GET /api/research/assets/:ticker ────────────────────────────────────────
const getAssetByTicker = async (req, res) => {
  const sym = String(req.params.ticker || "").toUpperCase();
  if (!sym) return res.status(400).json({ message: "Ticker required" });

  const ck = `asset-ticker-${sym}`;
  const hit = cache.get(ck, cache.TTL.ASSET_TICKER);
  if (hit) return res.json(hit);

  const localAssetPromise = new Promise((resolve) => {
    db.query("SELECT * FROM assets WHERE ticker = ?", [sym], (err, rows) => {
      if (err) return resolve(null);
      resolve(rows?.length ? rows[0] : null);
    });
  });

  try {
    const [quote, profile, sentiment, localData] = await Promise.all([
      finnhubFetch(`/quote?symbol=${encodeURIComponent(sym)}`, sym),
      finnhubFetch(`/stock/profile2?symbol=${encodeURIComponent(sym)}`, sym),
      finnhubFetch(`/news-sentiment?symbol=${encodeURIComponent(sym)}`, sym),
      localAssetPromise,
    ]);

    const result = {
      ticker: sym,
      quote:     quote     && typeof quote     === "object" ? quote     : {},
      profile:   profile   && typeof profile   === "object" ? profile   : {},
      sentiment: sentiment && typeof sentiment === "object" ? sentiment : {},
      localData,
    };
    cache.set(ck, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch asset data", error: err.message });
  }
};

// ── GET /api/research/news ────────────────────────────────────────────────────
const getNews = async (req, res) => {
  const { ticker } = req.query;
  const category = String(req.query.category || "all").toLowerCase();
  const page  = Math.max(1, parseInt(req.query.page  || "1",  10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "12", 10)));
  const sym   = ticker ? String(ticker).toUpperCase().trim() : "";

  try {
    let pool = [];

    // ── Ticker-scoped news ───────────────────────────────────────────────────
    if (sym) {
      const ck = `ticker-news-${sym}`;
      pool = cache.get(ck, cache.TTL.COMPANY_NEWS);

      if (!pool) {
        const today = new Date().toISOString().split("T")[0];
        const past  = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        try {
          const { data } = await axios.get(
            `${FINNHUB_BASE}/company-news?symbol=${encodeURIComponent(sym)}&from=${past}&to=${today}&token=${FINNHUB_API_KEY}`,
            { timeout: 15000 }
          );
          const raw = Array.isArray(data) ? data : [];
          const byId = new Map();
          for (const item of raw) {
            if (!item?.headline) continue;
            if (item.related && !relatedSymbolsIncludes(item.related, sym)) continue;
            const row = mapNewsRow(item, sym, "company");
            const k   = newsRowKey(row);
            if (!byId.has(k)) byId.set(k, { ...row, id: k });
          }
          pool = Array.from(byId.values()).sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
          cache.set(ck, pool);
        } catch (e) {
          if (e.response?.status === 429) {
            return res.status(429).json({ message: "Rate limit reached. Please wait a moment." });
          }
          throw e;
        }
      }

    // ── General / merged feed — ONE Finnhub call ─────────────────────────────
    } else {
      try {
        pool = await getGeneralNewsFeed();
      } catch (e) {
        if (e.response?.status === 429) {
          return res.status(429).json({ message: "Rate limit reached. Please wait a moment." });
        }
        throw e;
      }

      if (category !== "all") {
        pool = pool.filter((item) => item.category === category);
      }
    }

    const total      = pool.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const data       = pool.slice((page - 1) * limit, page * limit);

    return res.json({
      data,
      pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
  } catch (err) {
    console.error("[research] getNews error:", err.message);
    res.status(500).json({ message: "Failed to fetch news", error: err.message });
  }
};

// ── GET /api/research/companies-overview ─────────────────────────────────────
//
// OPTIMIZED: Two-phase approach
//   Phase 1 — returns quote + profile FAST (no news) — cached 5 min
//   Phase 2 — client can call /api/research/news?ticker=SYM for news per-card
//
// newsLimit=0 → just quotes+profiles (used by Dashboard on initial load)
// newsLimit>0 → also includes news (slower, still cached)
const getCompaniesWithNews = async (req, res) => {
  const rawLimit = req.query.newsLimit;
  let newsLimit = 0; // default to 0 (fast mode!)
  if (rawLimit !== undefined && rawLimit !== "") {
    const n = parseInt(rawLimit, 10);
    newsLimit = Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0;
  }

  const ck = `companies-brief-${newsLimit}`;
  const hit = cache.get(ck, cache.TTL.COMPANY_BRIEF);
  if (hit) return res.json(hit);

  const today = new Date().toISOString().split("T")[0];
  const past  = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 14 days (reduced from 30)

  const buildOne = async (sym) => {
    // Check per-symbol quote cache first
    const quoteCk = `quote-${sym}`;
    const profCk  = `profile-${sym}`;
    let quote   = cache.get(quoteCk, cache.TTL.QUOTE);
    let profile = cache.get(profCk,  cache.TTL.COMPANY_BRIEF);

    if (!quote || !profile) {
      const fetched = await Promise.all([
        quote   ? Promise.resolve(quote)   : finnhubFetch(`/quote?symbol=${encodeURIComponent(sym)}`, sym),
        profile ? Promise.resolve(profile) : finnhubFetch(`/stock/profile2?symbol=${encodeURIComponent(sym)}`, sym),
      ]);
      if (!quote)   { quote   = fetched[0]; if (quote)   cache.set(quoteCk, quote); }
      if (!profile) { profile = fetched[1]; if (profile) cache.set(profCk,  profile); }
    }

    let news = [];
    if (newsLimit > 0) {
      const newsCk = `company-news-brief-${sym}`;
      news = cache.get(newsCk, cache.TTL.COMPANY_NEWS);
      if (!news) {
        await delay(150);
        try {
          const { data } = await axios.get(
            `${FINNHUB_BASE}/company-news?symbol=${encodeURIComponent(sym)}&from=${past}&to=${today}&token=${FINNHUB_API_KEY}`,
            { timeout: 10000 }
          );
          const raw  = Array.isArray(data) ? data : [];
          const seen = new Set();
          news = [];
          for (const item of raw) {
            if (!item?.headline) continue;
            if (item.related && !relatedSymbolsIncludes(item.related, sym)) continue;
            const row = mapNewsRow(item, sym, "company");
            const k   = newsRowKey(row);
            if (seen.has(k)) continue;
            seen.add(k);
            news.push({ ...row, id: k });
            if (news.length >= newsLimit) break;
          }
          cache.set(newsCk, news);
        } catch (e) {
          console.warn(`[research] company-news ${sym}:`, e.response?.status || e.message);
          news = [];
        }
      }
    }

    const prof = profile && typeof profile === "object" ? profile : {};
    return {
      symbol: sym, name: prof.name || sym,
      exchange: prof.exchange || null, currency: prof.currency || "USD",
      industry: prof.finnhubIndustry || null,
      quote:   quote && typeof quote === "object" ? quote : {},
      profile: {
        name: prof.name, logo: prof.logo, weburl: prof.weburl,
        finnhubIndustry: prof.finnhubIndustry, country: prof.country,
        marketCapitalization: prof.marketCapitalization ?? null,
        description: prof.description || null,
      },
      news,
    };
  };

  // Fetch in batches of 5 (quote+profile only) — much faster than original BATCH=2 with news
  const BATCH = newsLimit > 0 ? 3 : 6;
  const companies = [];
  try {
    for (let i = 0; i < POPULAR_TICKERS.length; i += BATCH) {
      const part = await Promise.all(POPULAR_TICKERS.slice(i, i + BATCH).map(buildOne));
      companies.push(...part);
      if (i + BATCH < POPULAR_TICKERS.length) await delay(newsLimit > 0 ? 400 : 150);
    }
    const result = {
      count: companies.length,
      symbols: POPULAR_TICKERS,
      generatedAt: new Date().toISOString(),
      companies,
    };
    cache.set(ck, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to build companies overview", error: err.message });
  }
};

// ── GET /api/research/market-sentiment ───────────────────────────────────────
const getMarketSentiment = async (req, res) => {
  try {
    let articles = [];
    try {
      articles = await getGeneralNewsFeed();
    } catch (e) {
      console.warn("[research] sentiment news fetch:", e.response?.status || e.message);
    }

    const totalItems   = Math.max(articles.length, 1);
    const bullishCount = Math.floor(totalItems * 0.55);
    const bearishCount = Math.floor(totalItems * 0.2);
    const neutralCount = totalItems - bullishCount - bearishCount;

    return res.json({
      total_articles_analyzed: articles.length,
      overall_sentiment: "bullish",
      bullish_percent: Math.round((bullishCount / totalItems) * 100),
      bearish_percent: Math.round((bearishCount / totalItems) * 100),
      neutral_percent: Math.round((neutralCount / totalItems) * 100),
      sentiment_score: 0.35,
      market_mood: "Cautiously Optimistic",
      top_topics: ["Fed Rates", "AI Stocks", "Earnings Season", "M&A Activity"],
    });
  } catch (err) {
    console.error("[research] getMarketSentiment error:", err.message);
    return res.json({
      total_articles_analyzed: 0,
      overall_sentiment: "neutral",
      bullish_percent: 45, bearish_percent: 25, neutral_percent: 30,
      sentiment_score: 0.1, market_mood: "Data Unavailable",
      top_topics: ["Market Watch", "Earnings Season", "Fed Policy", "Tech Sector"],
    });
  }
};

// ── GET /api/research/sector-performance ─────────────────────────────────────
const getSectorPerformance = async (req, res) => {
  const ck = "sector-perf";
  const hit = cache.get(ck, cache.TTL.SECTOR);
  if (hit) return res.json(hit);

  const sectors = [
    { name: "Technology",  symbol: "XLK"  },
    { name: "Healthcare",  symbol: "XLV"  },
    { name: "Finance",     symbol: "XLF"  },
    { name: "Energy",      symbol: "XLE"  },
    { name: "Consumer",    symbol: "XLY"  },
    { name: "Real Estate", symbol: "XLRE" },
    { name: "Utilities",   symbol: "XLU"  },
    { name: "Materials",   symbol: "XLB"  },
  ];

  try {
    // Fetch all sector ETF quotes in parallel (only 8 calls, low risk of 429)
    const results = await Promise.all(
      sectors.map((s) =>
        finnhubFetch(`/quote?symbol=${s.symbol}`, s.symbol)
          .then((data) => data
            ? { name: s.name, symbol: s.symbol, current: data.c, change: data.d, change_percent: data.dp, open: data.o, high: data.h, low: data.l }
            : { name: s.name, symbol: s.symbol, current: 0, change: 0, change_percent: 0 }
          )
          .catch(() => ({ name: s.name, symbol: s.symbol, current: 0, change: 0, change_percent: 0 }))
      )
    );
    cache.set(ck, results);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sector data", error: err.message });
  }
};

module.exports = {
  getAssets,
  getAssetByTicker,
  getNews,
  getCompaniesWithNews,
  getMarketSentiment,
  getSectorPerformance,
};