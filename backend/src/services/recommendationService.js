// services/recommendationService.js
// Enhanced: top stocks shown on load, buy/avoid verdict, news sentiment, peer comparison

const axios = require("axios");

const FINNHUB_KEY  = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE = "https://finnhub.io/api/v1";
const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Master watchlist shown by default ────────────────────────────────────────
const TOP_STOCKS = [
  { symbol: "AAPL",  name: "Apple Inc.",         sector: "Technology" },
  { symbol: "NVDA",  name: "NVIDIA Corp.",        sector: "Technology" },
  { symbol: "MSFT",  name: "Microsoft Corp.",     sector: "Technology" },
  { symbol: "AMZN",  name: "Amazon.com Inc.",     sector: "Consumer" },
  { symbol: "GOOGL", name: "Alphabet Inc.",       sector: "Technology" },
  { symbol: "META",  name: "Meta Platforms",      sector: "Technology" },
  { symbol: "TSLA",  name: "Tesla Inc.",          sector: "Auto/EV" },
  { symbol: "JPM",   name: "JPMorgan Chase",      sector: "Financials" },
  { symbol: "V",     name: "Visa Inc.",           sector: "Financials" },
  { symbol: "UNH",   name: "UnitedHealth Group",  sector: "Healthcare" },
  { symbol: "XOM",   name: "Exxon Mobil",         sector: "Energy" },
  { symbol: "JNJ",   name: "Johnson & Johnson",   sector: "Healthcare" },
];

// ── Static beta table ─────────────────────────────────────────────────────────
const BETA = {
  AAPL:1.25, NVDA:1.65, MSFT:0.90, AMZN:1.15, GOOGL:1.05,
  META:1.30, TSLA:2.00, JPM:1.10,  V:0.95,    UNH:0.70,
  XOM:0.85,  JNJ:0.55,
};

// ── Sentiment scoring from news headlines ─────────────────────────────────────
const POSITIVE_WORDS = ["surge","beat","record","growth","bullish","upgrade","profit","soar","gain","strong","rally","outperform","boost","buy","positive"];
const NEGATIVE_WORDS = ["fall","loss","miss","cut","decline","bearish","downgrade","drop","weak","risk","sell","negative","layoff","lawsuit","probe","fine"];

function scoreSentiment(headline = "") {
  const h = headline.toLowerCase();
  let score = 0;
  POSITIVE_WORDS.forEach(w => { if (h.includes(w)) score++; });
  NEGATIVE_WORDS.forEach(w => { if (h.includes(w)) score--; });
  return score;
}

function sentimentLabel(score) {
  if (score >= 2)  return "Very Positive";
  if (score === 1) return "Positive";
  if (score === 0) return "Neutral";
  if (score === -1) return "Negative";
  return "Very Negative";
}

// ── Generate buy/avoid verdict ────────────────────────────────────────────────
function buildVerdict({ changePercent, sentimentScore, beta, rsi, priceVsHigh }) {
  const signals = [];
  let bullish = 0, bearish = 0;

  // Momentum
  if (changePercent > 1.5)  { signals.push({ type: "bull", text: `Strong today (+${changePercent.toFixed(2)}%)` }); bullish++; }
  else if (changePercent < -1.5) { signals.push({ type: "bear", text: `Selling pressure (${changePercent.toFixed(2)}%)` }); bearish++; }
  else { signals.push({ type: "neutral", text: `Flat session (${changePercent.toFixed(2)}%)` }); }

  // Sentiment
  if (sentimentScore >= 2)  { signals.push({ type: "bull", text: "Very positive news flow" }); bullish++; }
  else if (sentimentScore >= 1) { signals.push({ type: "bull", text: "Positive recent news" }); bullish++; }
  else if (sentimentScore <= -2) { signals.push({ type: "bear", text: "Negative news sentiment" }); bearish += 2; }
  else if (sentimentScore <= -1) { signals.push({ type: "bear", text: "Cautious news tone" }); bearish++; }
  else { signals.push({ type: "neutral", text: "Neutral news sentiment" }); }

  // Beta / volatility
  if (beta >= 1.5) { signals.push({ type: "bear", text: `High volatility (β ${beta})` }); bearish++; }
  else if (beta <= 0.7) { signals.push({ type: "bull", text: `Defensive (β ${beta})` }); bullish++; }
  else { signals.push({ type: "neutral", text: `Moderate volatility (β ${beta})` }); }

  // RSI if available
  if (rsi) {
    if (rsi < 35)       { signals.push({ type: "bull", text: `Oversold — RSI ${rsi.toFixed(0)}` }); bullish++; }
    else if (rsi > 70)  { signals.push({ type: "bear", text: `Overbought — RSI ${rsi.toFixed(0)}` }); bearish++; }
    else                { signals.push({ type: "neutral", text: `RSI neutral (${rsi.toFixed(0)})` }); }
  }

  // Price vs 52-week high
  if (priceVsHigh != null) {
    const pct = priceVsHigh * 100;
    if (pct < 5)        { signals.push({ type: "bear", text: `Near 52-week high (${pct.toFixed(1)}% below)` }); bearish++; }
    else if (pct > 25)  { signals.push({ type: "bull", text: `Well off 52-week high — room to grow` }); bullish++; }
  }

  const verdict = bearish > bullish ? "AVOID" : bullish > bearish ? "BUY" : "HOLD";
  const confidence = Math.round((Math.max(bullish, bearish) / (bullish + bearish + 1)) * 100);

  return { verdict, confidence, bullish, bearish, signals };
}

// ── Core enrichment for a single symbol ──────────────────────────────────────
async function enrichSymbol(sym, name, sector, budgetInr) {
  const budgetUsd = budgetInr / 83;

  // Quote
  const qRes = await axios.get(`${FINNHUB_BASE}/quote?symbol=${sym}&token=${FINNHUB_KEY}`, { timeout: 8000 });
  const q = qRes.data;
  if (!q?.c || q.c <= 0) return null;

  const price         = q.c;
  const changePercent = q.dp ?? 0;
  const high52        = q.h ?? price;
  const low52         = q.l ?? price;
  const priceVsHigh   = high52 > 0 ? (high52 - price) / high52 : null;
  const maxShares     = Math.floor(budgetUsd / price);
  const beta          = BETA[sym] ?? 1.0;

  // News (last 4 days)
  const today = new Date().toISOString().split("T")[0];
  const past  = new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0];
  let newsItems = [];
  let sentimentScore = 0;

  try {
    const nRes = await axios.get(
      `${FINNHUB_BASE}/company-news?symbol=${sym}&from=${past}&to=${today}&token=${FINNHUB_KEY}`,
      { timeout: 8000 }
    );
    const articles = (nRes.data || []).slice(0, 5);
    articles.forEach(n => { sentimentScore += scoreSentiment(n.headline); });
    newsItems = articles.slice(0, 3).map(n => ({
      headline:  n.headline,
      url:       n.url,
      source:    n.source,
      sentiment: sentimentLabel(scoreSentiment(n.headline)),
    }));
  } catch {}

  // Recommendation trend (buy/sell/hold from analysts)
  let analystBuy = 0, analystSell = 0, analystHold = 0, analystLabel = "";
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
    }
  } catch {}

  // Verdict
  const { verdict, confidence, signals } = buildVerdict({
    changePercent,
    sentimentScore,
    beta,
    priceVsHigh,
  });

  // Why best narrative
  const whyBest = verdict === "BUY"
    ? `${name} shows ${sentimentScore >= 1 ? "positive news momentum" : "steady fundamentals"} with ${analystBuy} analyst buy ratings. Beta of ${beta} indicates ${beta >= 1.3 ? "higher growth potential with risk" : "moderate market sensitivity"}.`
    : verdict === "AVOID"
    ? `${name} faces ${sentimentScore <= -1 ? "negative news headwinds" : "selling pressure"} currently. With ${analystSell} sell ratings and beta ${beta}, risk outweighs short-term reward.`
    : `${name} is in a consolidation phase. Fundamentals are intact but short-term momentum is mixed — worth watching.`;

  return {
    symbol:        sym,
    name,
    sector,
    price,
    currency:      "USD",
    changePercent: changePercent.toFixed(2),
    high52,
    low52,
    priceVsHigh:   priceVsHigh != null ? (priceVsHigh * 100).toFixed(1) : null,
    maxShares,
    beta,
    sentimentScore,
    verdict,
    confidence,
    signals,
    analystLabel,
    analystBuy,
    analystSell,
    analystHold,
    whyBest,
    news: newsItems,
    affordable: maxShares > 0,
  };
}

// ── GET top stocks (no budget filter — show all with affordability tag) ───────
const getTopStocks = async (req, res) => {
  try {
    const budgetInr = Number(req.query.budget) || 500000; // default ₹5L for display
    const results = [];

    for (const stock of TOP_STOCKS) {
      try {
        const enriched = await enrichSymbol(stock.symbol, stock.name, stock.sector, budgetInr);
        if (enriched) results.push(enriched);
        await delay(120);
      } catch (e) {
        console.error(`[TopStocks] ${stock.symbol}:`, e.message);
      }
    }

    // Sort: BUY verdict first, then by sentiment score
    results.sort((a, b) => {
      const order = { BUY: 0, HOLD: 1, AVOID: 2 };
      if (order[a.verdict] !== order[b.verdict]) return order[a.verdict] - order[b.verdict];
      return b.sentimentScore - a.sentimentScore;
    });

    res.json({ stocks: results, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error("[TopStocks]", err);
    res.status(500).json({ error: "Failed to fetch top stocks" });
  }
};

// ── POST /api/recommendations — budget-based filtered recommendations ─────────
const getSmartRecommendations = async (req, res) => {
  try {
    const { budget, symbol: searchSym } = req.body;

    if (!budget || budget < 1000) {
      return res.status(400).json({ error: "Minimum budget is ₹1,000" });
    }

    const budgetInr = Number(budget);
    let stockList = TOP_STOCKS;

    // If user searched a specific symbol, add it if not in list
    if (searchSym) {
      const up = searchSym.toUpperCase();
      if (!TOP_STOCKS.find(s => s.symbol === up)) {
        stockList = [{ symbol: up, name: up, sector: "Custom" }, ...TOP_STOCKS];
      } else {
        // Put searched symbol first
        stockList = [
          TOP_STOCKS.find(s => s.symbol === up),
          ...TOP_STOCKS.filter(s => s.symbol !== up),
        ].filter(Boolean);
      }
    }

    const results = [];
    for (const stock of stockList) {
      try {
        const enriched = await enrichSymbol(stock.symbol, stock.name, stock.sector, budgetInr);
        if (enriched) results.push(enriched);
        await delay(120);
      } catch (e) {
        console.error(`[Rec] ${stock.symbol}:`, e.message);
      }
    }

    // Sort: affordable + BUY first
    results.sort((a, b) => {
      if (a.affordable !== b.affordable) return b.affordable ? 1 : -1;
      const order = { BUY: 0, HOLD: 1, AVOID: 2 };
      if (order[a.verdict] !== order[b.verdict]) return order[a.verdict] - order[b.verdict];
      return b.sentimentScore - a.sentimentScore;
    });

    res.json({
      recommendations: results,
      budget: budgetInr,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Recommendations]", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
};

module.exports = { getSmartRecommendations, getTopStocks };