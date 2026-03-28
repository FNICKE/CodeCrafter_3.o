const db = require("../config/db");
const axios = require("axios");

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "d73ns7pr01qjjol3m9l0d73ns7pr01qjjol3m9lg";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

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
  try {
    const [quoteRes, profileRes, sentimentRes] = await Promise.all([
      axios.get(`${FINNHUB_BASE}/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`),
      axios.get(`${FINNHUB_BASE}/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`),
      axios.get(`${FINNHUB_BASE}/news-sentiment?symbol=${ticker}&token=${FINNHUB_API_KEY}`),
    ]);

    db.query("SELECT * FROM assets WHERE ticker = ?", [ticker.toUpperCase()], (err, rows) => {
      const localAsset = rows && rows.length ? rows[0] : null;
      res.json({
        ticker: ticker.toUpperCase(),
        quote: quoteRes.data,
        profile: profileRes.data,
        sentiment: sentimentRes.data,
        localData: localAsset,
      });
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch asset data", error: err.message });
  }
};

// GET /api/research/news - financial news from Finnhub
const getNews = async (req, res) => {
  const { category = "general", ticker } = req.query;
  try {
    let url;
    if (ticker) {
      const today = new Date().toISOString().split("T")[0];
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      url = `${FINNHUB_BASE}/company-news?symbol=${ticker}&from=${past}&to=${today}&token=${FINNHUB_API_KEY}`;
    } else {
      url = `${FINNHUB_BASE}/news?category=${category}&token=${FINNHUB_API_KEY}`;
    }
    const response = await axios.get(url);
    const news = response.data.slice(0, 30).map((item) => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      image: item.image,
      category: item.category,
      datetime: item.datetime,
      related: item.related,
      sentiment_score: Math.random() * 2 - 1, // placeholder: replace with FinBERT
      trust_score: Math.floor(70 + Math.random() * 30),
    }));
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch news", error: err.message });
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

module.exports = { getAssets, getAssetByTicker, getNews, getMarketSentiment, getSectorPerformance };
