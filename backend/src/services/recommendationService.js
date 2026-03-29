// services/recommendationService.js
// Optimized: centralized cache, parallel quote fetches, serial news to avoid 429

const axios = require("axios");
const cache = require("../config/cache");

const FINNHUB_KEY  = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE = "https://finnhub.io/api/v1";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Master watchlist ──────────────────────────────────────────────────────────
const TOP_STOCKS = [
  { symbol: "AAPL",  name: "Apple Inc.",         sector: "Technology" },
  { symbol: "NVDA",  name: "NVIDIA Corp.",        sector: "Technology" },
  { symbol: "MSFT",  name: "Microsoft Corp.",     sector: "Technology" },
  { symbol: "AMZN",  name: "Amazon.com Inc.",     sector: "Consumer"   },
  { symbol: "GOOGL", name: "Alphabet Inc.",       sector: "Technology" },
  { symbol: "META",  name: "Meta Platforms",      sector: "Technology" },
  { symbol: "TSLA",  name: "Tesla Inc.",          sector: "Auto/EV"    },
  { symbol: "JPM",   name: "JPMorgan Chase",      sector: "Financials" },
  { symbol: "V",     name: "Visa Inc.",           sector: "Financials" },
  { symbol: "UNH",   name: "UnitedHealth Group",  sector: "Healthcare" },
  { symbol: "XOM",   name: "Exxon Mobil",         sector: "Energy"     },
  { symbol: "JNJ",   name: "Johnson & Johnson",   sector: "Healthcare" },
];

// ── Static beta table ─────────────────────────────────────────────────────────
const BETA = {
  AAPL:1.25, NVDA:1.65, MSFT:0.90, AMZN:1.15, GOOGL:1.05,
  META:1.30, TSLA:2.00, JPM:1.10,  V:0.95,    UNH:0.70,
  XOM:0.85,  JNJ:0.55,
};

// ── Sentiment scoring ─────────────────────────────────────────────────────────
const POSITIVE_WORDS = ["surge","beat","record","growth","bullish","upgrade","profit","soar","gain","strong","rally","outperform","boost","buy","positive"];
const NEGATIVE_WORDS = ["fall","loss","miss","cut","decline","bearish","downgrade","drop","weak","risk","sell","negative","layoff","lawsuit","probe","fine"];

function scoreSentiment(headline = "") {
  const h = headline.toLowerCase();
  let score = 0;
  POSITIVE_WORDS.forEach((w) => { if (h.includes(w)) score++; });
  NEGATIVE_WORDS.forEach((w) => { if (h.includes(w)) score--; });
  return score;
}

function sentimentLabel(score) {
  if (score >= 2)  return "Very Positive";
  if (score === 1) return "Positive";
  if (score === 0) return "Neutral";
  if (score === -1) return "Negative";
  return "Very Negative";
}

// ── Verdict builder ───────────────────────────────────────────────────────────
function buildVerdict({ changePercent, sentimentScore, beta, priceVsHigh }) {
  const signals = [];
  let bullish = 0, bearish = 0;

  if (changePercent > 1.5)  { signals.push({ type: "bull", text: `Strong today (+${changePercent.toFixed(2)}%)` }); bullish++; }
  else if (changePercent < -1.5) { signals.push({ type: "bear", text: `Selling pressure (${changePercent.toFixed(2)}%)` }); bearish++; }
  else { signals.push({ type: "neutral", text: `Flat session (${changePercent.toFixed(2)}%)` }); }

  if (sentimentScore >= 2)  { signals.push({ type: "bull", text: "Very positive news flow" }); bullish++; }
  else if (sentimentScore >= 1) { signals.push({ type: "bull", text: "Positive recent news" }); bullish++; }
  else if (sentimentScore <= -2) { signals.push({ type: "bear", text: "Negative news sentiment" }); bearish += 2; }
  else if (sentimentScore <= -1) { signals.push({ type: "bear", text: "Cautious news tone" }); bearish++; }
  else { signals.push({ type: "neutral", text: "Neutral news sentiment" }); }

  if (beta >= 1.5) { signals.push({ type: "bear", text: `High volatility (β ${beta})` }); bearish++; }
  else if (beta <= 0.7) { signals.push({ type: "bull", text: `Defensive (β ${beta})` }); bullish++; }
  else { signals.push({ type: "neutral", text: `Moderate volatility (β ${beta})` }); }

  if (priceVsHigh != null) {
    const pct = priceVsHigh * 100;
    if (pct < 5)       { signals.push({ type: "bear", text: `Near 52-week high (${pct.toFixed(1)}% below)` }); bearish++; }
    else if (pct > 25) { signals.push({ type: "bull", text: `Well off 52-week high — room to grow` }); bullish++; }
  }

  const verdict    = bearish > bullish ? "AVOID" : bullish > bearish ? "BUY" : "HOLD";
  const confidence = Math.round((Math.max(bullish, bearish) / (bullish + bearish + 1)) * 100);
  return { verdict, confidence, bullish, bearish, signals };
}

// ── Enrich a single symbol (with per-symbol cache) ────────────────────────────
async function enrichSymbol(sym, name, sector, budgetInr) {
  const budgetUsd = budgetInr / 83;

  // 1. Quote — use shared quote cache (same key as marketController uses)
  const quoteCk = `quote-${sym}`;
  let q = cache.get(quoteCk, cache.TTL.QUOTE);
  if (!q) {
    try {
      const res = await axios.get(`${FINNHUB_BASE}/quote?symbol=${sym}&token=${FINNHUB_KEY}`, { timeout: 8000 });
      q = res.data;
      cache.set(quoteCk, q);
    } catch (e) {
      console.error(`[Rec] quote ${sym}:`, e.message);
      return null;
    }
  }

  if (!q?.c || q.c <= 0) return null;

  const price         = q.c;
  const changePercent = q.dp ?? 0;
  const high52        = q.h ?? price;
  const priceVsHigh   = high52 > 0 ? (high52 - price) / high52 : null;
  const maxShares     = Math.floor(budgetUsd / price);
  const beta          = BETA[sym] ?? 1.0;

  // 2. News — per-symbol cache 5 min
  const newsCk = `rec-news-${sym}`;
  let newsItems = cache.get(newsCk, cache.TTL.COMPANY_NEWS);
  let sentimentScore = 0;

  if (!newsItems) {
    const today = new Date().toISOString().split("T")[0];
    const past  = new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0];
    try {
      const nRes = await axios.get(
        `${FINNHUB_BASE}/company-news?symbol=${sym}&from=${past}&to=${today}&token=${FINNHUB_KEY}`,
        { timeout: 8000 }
      );
      const articles = (nRes.data || []).slice(0, 5);
      articles.forEach((n) => { sentimentScore += scoreSentiment(n.headline); });
      newsItems = articles.slice(0, 3).map((n) => ({
        headline:  n.headline,
        url:       n.url,
        source:    n.source,
        sentiment: sentimentLabel(scoreSentiment(n.headline)),
      }));
      cache.set(newsCk, { items: newsItems, score: sentimentScore });
    } catch {
      newsItems = [];
    }
  } else {
    // Restore cached shape
    sentimentScore = newsItems.score || 0;
    newsItems      = newsItems.items || newsItems;
  }

  // 3. Analyst recommendations — per-symbol cache 10 min
  const analystCk = `analyst-${sym}`;
  let analystData = cache.get(analystCk, 10 * 60 * 1000);
  let analystBuy = 0, analystSell = 0, analystHold = 0, analystLabel = "";

  if (!analystData) {
    try {
      const rRes = await axios.get(
        `${FINNHUB_BASE}/stock/recommendation?symbol=${sym}&token=${FINNHUB_KEY}`,
        { timeout: 8000 }
      );
      const latest = (rRes.data || [])[0];
      if (latest) {
        analystBuy  = (latest.buy || 0) + (latest.strongBuy || 0);
        analystSell = (latest.sell || 0) + (latest.strongSell || 0);
        analystHold = latest.hold || 0;
        const total = analystBuy + analystSell + analystHold;
        if (total > 0) {
          const buyPct = (analystBuy / total * 100).toFixed(0);
          analystLabel = `${buyPct}% analysts say Buy (${analystBuy}B / ${analystHold}H / ${analystSell}S)`;
        }
        analystData = { analystBuy, analystSell, analystHold, analystLabel };
        cache.set(analystCk, analystData);
      }
    } catch {}
  } else {
    ({ analystBuy, analystSell, analystHold, analystLabel } = analystData);
  }

  const { verdict, confidence, signals } = buildVerdict({ changePercent, sentimentScore, beta, priceVsHigh });
  const whyBest = verdict === "BUY"
    ? `${name} shows ${sentimentScore >= 1 ? "positive news momentum" : "steady fundamentals"} with ${analystBuy} analyst buy ratings. Beta of ${beta} indicates ${beta >= 1.3 ? "higher growth potential with risk" : "moderate market sensitivity"}.`
    : verdict === "AVOID"
    ? `${name} faces ${sentimentScore <= -1 ? "negative news headwinds" : "selling pressure"} currently. With ${analystSell} sell ratings and beta ${beta}, risk outweighs short-term reward.`
    : `${name} is in a consolidation phase. Fundamentals are intact but short-term momentum is mixed — worth watching.`;

  return {
    symbol: sym, name, sector, price, currency: "USD",
    changePercent: changePercent.toFixed(2),
    high52, low52: q.l ?? price,
    priceVsHigh: priceVsHigh != null ? (priceVsHigh * 100).toFixed(1) : null,
    maxShares, beta, sentimentScore, verdict, confidence, signals,
    analystLabel, analystBuy, analystSell, analystHold, whyBest,
    news: Array.isArray(newsItems) ? newsItems : (newsItems?.items || []),
    affordable: maxShares > 0,
  };
}

// ── Fetch quotes in parallel, news sequentially (respect rate limits) ─────────
async function enrichAll(stockList, budgetInr) {
  const results = [];

  // Phase 1: fetch all quotes in parallel batches of 6 (much faster)
  const QUOTE_BATCH = 6;
  const quoteCk_prefix = "quote-";
  for (let i = 0; i < stockList.length; i += QUOTE_BATCH) {
    const chunk = stockList.slice(i, i + QUOTE_BATCH);
    await Promise.all(
      chunk.map(async ({ symbol: sym }) => {
        const ck = `${quoteCk_prefix}${sym}`;
        if (!cache.get(ck, cache.TTL.QUOTE)) {
          try {
            const res = await axios.get(`${FINNHUB_BASE}/quote?symbol=${sym}&token=${FINNHUB_KEY}`, { timeout: 8000 });
            cache.set(ck, res.data);
          } catch {}
        }
      })
    );
    if (i + QUOTE_BATCH < stockList.length) await delay(200);
  }

  // Phase 2: enrich sequentially (news + analyst calls) with small delays
  for (const stock of stockList) {
    try {
      const enriched = await enrichSymbol(stock.symbol, stock.name, stock.sector, budgetInr);
      if (enriched) results.push(enriched);
      await delay(100);
    } catch (e) {
      console.error(`[Rec] ${stock.symbol}:`, e.message);
    }
  }

  return results;
}

// ── GET /api/recommendations/top ─────────────────────────────────────────────
const getTopStocks = async (req, res) => {
  try {
    const budgetInr = Number(req.query.budget) || 500000;
    const ck = `top-stocks-${budgetInr}`;
    const hit = cache.get(ck, cache.TTL.TOP_STOCKS);
    if (hit) return res.json(hit);

    const results = await enrichAll(TOP_STOCKS, budgetInr);

    results.sort((a, b) => {
      const order = { BUY: 0, HOLD: 1, AVOID: 2 };
      if (order[a.verdict] !== order[b.verdict]) return order[a.verdict] - order[b.verdict];
      return b.sentimentScore - a.sentimentScore;
    });

    const payload = { stocks: results, generated_at: new Date().toISOString() };
    cache.set(ck, payload);
    res.json(payload);
  } catch (err) {
    console.error("[TopStocks]", err);
    res.status(500).json({ error: "Failed to fetch top stocks" });
  }
};

// ── POST /api/recommendations ─────────────────────────────────────────────────
const getSmartRecommendations = async (req, res) => {
  try {
    const { budget, symbol: searchSym } = req.body;

    if (!budget || budget < 1000) {
      return res.status(400).json({ error: "Minimum budget is ₹1,000" });
    }

    const budgetInr = Number(budget);

    // Check cache unless a custom symbol was searched
    if (!searchSym) {
      const ck = `smart-rec-${budgetInr}`;
      const hit = cache.get(ck, cache.TTL.RECOMMENDATIONS);
      if (hit) return res.json(hit);
    }

    let stockList = TOP_STOCKS;
    if (searchSym) {
      const up = searchSym.toUpperCase();
      if (!TOP_STOCKS.find((s) => s.symbol === up)) {
        stockList = [{ symbol: up, name: up, sector: "Custom" }, ...TOP_STOCKS];
      } else {
        stockList = [
          TOP_STOCKS.find((s) => s.symbol === up),
          ...TOP_STOCKS.filter((s) => s.symbol !== up),
        ].filter(Boolean);
      }
    }

    const results = await enrichAll(stockList, budgetInr);

    results.sort((a, b) => {
      if (a.affordable !== b.affordable) return b.affordable ? 1 : -1;
      const order = { BUY: 0, HOLD: 1, AVOID: 2 };
      if (order[a.verdict] !== order[b.verdict]) return order[a.verdict] - order[b.verdict];
      return b.sentimentScore - a.sentimentScore;
    });

    const payload = {
      recommendations: results,
      budget: budgetInr,
      generated_at: new Date().toISOString(),
    };

    if (!searchSym) {
      cache.set(`smart-rec-${budgetInr}`, payload);
    }

    res.json(payload);
  } catch (err) {
    console.error("[Recommendations]", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
};

module.exports = { getSmartRecommendations, getTopStocks };