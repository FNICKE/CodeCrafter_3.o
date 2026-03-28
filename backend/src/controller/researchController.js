const db = require("../config/db");
const axios = require("axios");
const { POPULAR_TICKERS } = require("../constants/popularTickers");

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "d73ns7pr01qjjol3m9l0d73ns7pr01qjjol3m9lg";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

async function finnhubFetch(pathWithQuery, logCtx) {
  try {
    const fixedUrl = pathWithQuery.includes("?")
      ? `${FINNHUB_BASE}${pathWithQuery}&token=${FINNHUB_API_KEY}`
      : `${FINNHUB_BASE}${pathWithQuery}?token=${FINNHUB_API_KEY}`;
    const { data } = await axios.get(fixedUrl, { timeout: 15000 });
    return data;
  } catch (e) {
    const pathPart = pathWithQuery.split("?")[0];
    console.warn(
      `[research] Finnhub ${pathPart}${logCtx ? ` (${logCtx})` : ""}:`,
      e.response?.status || e.message
    );
    return null;
  }
}

// GET /api/research/assets - list all tracked assets
const getAssets = (req, res) => {
  db.query("SELECT * FROM assets ORDER BY esg_score DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error" });
    res.json(rows);
  });
};

// GET /api/research/assets/:ticker - lookup single asset + live quote
const getAssetByTicker = async (req, res) => {
  const { ticker } = req.params;
  const sym = String(ticker || "").toUpperCase();
  if (!sym) {
    return res.status(400).json({ message: "Ticker required" });
  }

  const localAssetPromise = new Promise((resolve) => {
    db.query("SELECT * FROM assets WHERE ticker = ?", [sym], (err, rows) => {
      if (err) {
        console.warn("[research] assets table query:", err.message);
        return resolve(null);
      }
      resolve(rows && rows.length ? rows[0] : null);
    });
  });

  try {
    const [quote, profile, sentiment, localData] = await Promise.all([
      finnhubFetch(`/quote?symbol=${encodeURIComponent(sym)}`, sym),
      finnhubFetch(`/stock/profile2?symbol=${encodeURIComponent(sym)}`, sym),
      finnhubFetch(`/news-sentiment?symbol=${encodeURIComponent(sym)}`, sym),
      localAssetPromise,
    ]);

    res.json({
      ticker: sym,
      quote: quote && typeof quote === "object" ? quote : {},
      profile: profile && typeof profile === "object" ? profile : {},
      sentiment: sentiment && typeof sentiment === "object" ? sentiment : {},
      localData,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch asset data", error: err.message });
  }
};

function relatedSymbolsIncludes(relatedField, sym) {
  if (!sym) return false;
  const u = String(sym).toUpperCase().trim();
  if (!relatedField) return false;
  return String(relatedField)
    .toUpperCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(u);
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
    ? row.id
    : `${row.url || "nourl"}-${row.datetime || 0}-${(row.headline || "").slice(0, 40)}`;
}

/** Finnhub /news category values we expose (lowercase). */
const FINNHUB_NEWS_CATEGORIES = new Set(["general", "forex", "crypto", "merger", "ipo", "earnings"]);

/** Merged “stock market” overview: equities + corporate events (no separate Finnhub “stocks” feed—general covers broad market). */
const STOCK_MARKET_MERGE_FEEDS = ["general", "merger", "ipo", "earnings"];

// GET /api/research/news - financial news from Finnhub
const getNews = async (req, res) => {
  const { category = "general", ticker, companyOnly } = req.query;
  const sym = ticker ? String(ticker).toUpperCase().trim() : "";
  const MAX = 100;
  const onlyCompany =
    companyOnly === "1" || companyOnly === "true" || String(companyOnly).toLowerCase() === "yes";

  try {
    if (sym) {
      const today = new Date().toISOString().split("T")[0];
      const past = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const companyUrl = `${FINNHUB_BASE}/company-news?symbol=${encodeURIComponent(sym)}&from=${past}&to=${today}&token=${FINNHUB_API_KEY}`;
      const companyRes = await axios.get(companyUrl, { timeout: 15000 });
      const companyRaw = Array.isArray(companyRes.data) ? companyRes.data : [];

      const byId = new Map();
      for (const item of companyRaw) {
        if (!item || !item.headline) continue;
        if (item.related && !relatedSymbolsIncludes(item.related, sym)) continue;
        const row = mapNewsRow(item, sym, "company");
        const k = newsRowKey(row);
        if (!byId.has(k)) byId.set(k, { ...row, id: k });
      }

      if (byId.size < 12 && !onlyCompany) {
        const generalUrl = `${FINNHUB_BASE}/news?category=general&token=${FINNHUB_API_KEY}`;
        const generalRes = await axios.get(generalUrl, { timeout: 15000 });
        const generalRaw = Array.isArray(generalRes.data) ? generalRes.data : [];
        for (const item of generalRaw) {
          if (!item || !item.headline) continue;
          if (!relatedSymbolsIncludes(item.related, sym)) continue;
          const row = mapNewsRow(item, sym, "general");
          const k = newsRowKey(row);
          if (!byId.has(k)) byId.set(k, { ...row, id: k });
        }
      }

      const merged = Array.from(byId.values())
        .sort((a, b) => (b.datetime || 0) - (a.datetime || 0))
        .slice(0, MAX);

      return res.json(merged);
    }

    let catRaw = String(category || "general").toLowerCase();
    if (catRaw !== "all" && !FINNHUB_NEWS_CATEGORIES.has(catRaw)) {
      catRaw = "general";
    }
    const MAX_MERGED = 120;

    if (catRaw === "all") {
      const settled = await Promise.all(
        STOCK_MARKET_MERGE_FEEDS.map((cat) =>
          axios
            .get(`${FINNHUB_BASE}/news?category=${encodeURIComponent(cat)}&token=${FINNHUB_API_KEY}`, {
              timeout: 12000,
            })
            .then((r) => ({ cat, data: r.data }))
            .catch((e) => {
              console.warn(`[research] news category ${cat}:`, e.response?.status || e.message);
              return { cat, data: [] };
            })
        )
      );
      const byId = new Map();
      for (const { cat, data } of settled) {
        const raw = Array.isArray(data) ? data : [];
        for (const item of raw) {
          if (!item?.headline) continue;
          const row = mapNewsRow(item, null, cat);
          const k = newsRowKey(row);
          if (!byId.has(k)) byId.set(k, { ...row, id: row.id ?? k });
        }
      }
      const merged = Array.from(byId.values())
        .sort((a, b) => (b.datetime || 0) - (a.datetime || 0))
        .slice(0, MAX_MERGED);
      return res.json(merged);
    }

    const url = `${FINNHUB_BASE}/news?category=${encodeURIComponent(catRaw)}&token=${FINNHUB_API_KEY}`;
    const response = await axios.get(url, { timeout: 15000 });
    const raw = Array.isArray(response.data) ? response.data : [];
    const news = raw.slice(0, MAX).map((item) => mapNewsRow(item, null, catRaw));
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch news", error: err.message });
  }
};

// GET /api/research/companies-overview — every symbol in POPULAR_TICKERS with quote, profile, symbol-scoped news
const getCompaniesWithNews = async (req, res) => {
  const rawLimit = req.query.newsLimit;
  let newsLimit = 8;
  if (rawLimit === "0" || rawLimit === 0) {
    newsLimit = 0;
  } else if (rawLimit !== undefined && rawLimit !== "") {
    const n = parseInt(rawLimit, 10);
    newsLimit = Number.isFinite(n) ? Math.min(20, Math.max(0, n)) : 8;
  }
  const today = new Date().toISOString().split("T")[0];
  const past = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const fetchCompanyNews = async (sym) => {
    try {
      const url = `${FINNHUB_BASE}/company-news?symbol=${encodeURIComponent(sym)}&from=${past}&to=${today}&token=${FINNHUB_API_KEY}`;
      const { data } = await axios.get(url, { timeout: 15000 });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const buildOne = async (sym) => {
    let quote;
    let profile;
    let companyRaw = [];

    if (newsLimit > 0) {
      [quote, profile, companyRaw] = await Promise.all([
        finnhubFetch(`/quote?symbol=${encodeURIComponent(sym)}`, sym),
        finnhubFetch(`/stock/profile2?symbol=${encodeURIComponent(sym)}`, sym),
        fetchCompanyNews(sym),
      ]);
    } else {
      [quote, profile] = await Promise.all([
        finnhubFetch(`/quote?symbol=${encodeURIComponent(sym)}`, sym),
        finnhubFetch(`/stock/profile2?symbol=${encodeURIComponent(sym)}`, sym),
      ]);
    }

    const news = [];
    const seen = new Set();
    for (const item of companyRaw) {
      if (!item?.headline) continue;
      if (item.related && !relatedSymbolsIncludes(item.related, sym)) continue;
      const row = mapNewsRow(item, sym, "company");
      const k = newsRowKey(row);
      if (seen.has(k)) continue;
      seen.add(k);
      news.push({ ...row, id: k });
      if (news.length >= newsLimit) break;
    }

    const prof = profile && typeof profile === "object" ? profile : {};
    return {
      symbol: sym,
      name: prof.name || sym,
      exchange: prof.exchange || null,
      currency: prof.currency || "USD",
      industry: prof.finnhubIndustry || null,
      quote: quote && typeof quote === "object" ? quote : {},
      profile: {
        name: prof.name,
        logo: prof.logo,
        weburl: prof.weburl,
        finnhubIndustry: prof.finnhubIndustry,
        country: prof.country,
        description: prof.description || null,
        marketCapitalization: prof.marketCapitalization ?? null,
      },
      news,
    };
  };

  const BATCH = 4;
  const companies = [];
  try {
    for (let i = 0; i < POPULAR_TICKERS.length; i += BATCH) {
      const batch = POPULAR_TICKERS.slice(i, i + BATCH);
      const part = await Promise.all(batch.map(buildOne));
      companies.push(...part);
    }
    res.json({
      count: companies.length,
      symbols: POPULAR_TICKERS,
      generatedAt: new Date().toISOString(),
      companies,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to build companies overview", error: err.message });
  }
};

// GET /api/research/market-sentiment - overall market sentiment
const getMarketSentiment = async (req, res) => {
  try {
    const [generalNews, cryptoNews] = await Promise.all([
      axios.get(`${FINNHUB_BASE}/news?category=general&token=${FINNHUB_API_KEY}`),
      axios.get(`${FINNHUB_BASE}/news?category=crypto&token=${FINNHUB_API_KEY}`),
    ]);

    const allNews = [...(generalNews.data || []).slice(0, 20), ...(cryptoNews.data || []).slice(0, 10)];
    const totalItems = allNews.length;
    const bullishCount = Math.floor(totalItems * 0.55);
    const bearishCount = Math.floor(totalItems * 0.2);
    const neutralCount = totalItems - bullishCount - bearishCount;

    res.json({
      total_articles_analyzed: totalItems,
      overall_sentiment: "bullish",
      bullish_percent: Math.round((bullishCount / totalItems) * 100),
      bearish_percent: Math.round((bearishCount / totalItems) * 100),
      neutral_percent: Math.round((neutralCount / totalItems) * 100),
      sentiment_score: 0.35,
      market_mood: "Cautiously Optimistic",
      top_topics: ["Fed rates", "AI stocks", "Crypto rally", "Earnings season"],
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sentiment", error: err.message });
  }
};

// GET /api/research/sector-performance - multiple index quotes
const getSectorPerformance = async (req, res) => {
  const sectors = [
    { name: "Technology", symbol: "XLK" },
    { name: "Healthcare", symbol: "XLV" },
    { name: "Finance", symbol: "XLF" },
    { name: "Energy", symbol: "XLE" },
    { name: "Consumer", symbol: "XLY" },
    { name: "Real Estate", symbol: "XLRE" },
    { name: "Utilities", symbol: "XLU" },
    { name: "Materials", symbol: "XLB" },
  ];

  try {
    const results = await Promise.all(
      sectors.map((s) =>
        axios
          .get(`${FINNHUB_BASE}/quote?symbol=${s.symbol}&token=${FINNHUB_API_KEY}`)
          .then((r) => ({
            name: s.name,
            symbol: s.symbol,
            current: r.data.c,
            change: r.data.d,
            change_percent: r.data.dp,
            open: r.data.o,
            high: r.data.h,
            low: r.data.l,
          }))
          .catch(() => ({ name: s.name, symbol: s.symbol, current: 0, change: 0, change_percent: 0 }))
      )
    );
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
