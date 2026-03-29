const axios = require("axios");
const { POPULAR_TICKERS } = require("../constants/popularTickers");
const cache = require("../config/cache");

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "d73ns7pr01qjjol3m9l0d73ns7pr01qjjol3m9lg";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

// ── Finnhub helper with built-in retry on 429 ────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function finnhubGet(url, retries = 1) {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    return data;
  } catch (e) {
    if (e.response?.status === 429 && retries > 0) {
      await delay(1500);
      return finnhubGet(url, retries - 1);
    }
    throw e;
  }
}

// GET /api/market/quote/:symbol
const getQuote = async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  const ck = `quote-${sym}`;
  const hit = cache.get(ck, cache.TTL.QUOTE);
  if (hit) return res.json(hit);

  try {
    const data = await finnhubGet(
      `${FINNHUB_BASE}/quote?symbol=${sym}&token=${FINNHUB_API_KEY}`
    );
    const result = { symbol: sym, ...data };
    cache.set(ck, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quote", error: err.message });
  }
};

// GET /api/market/candles/:symbol
const getCandles = async (req, res) => {
  const { symbol } = req.params;
  const range = req.query.range || "1mo";
  let interval = "1d";
  if (["1d", "5d"].includes(range)) interval = "5m";
  if (range === "1d") interval = "2m";

  const ck = `candles-${symbol.toUpperCase()}-${range}`;
  const hit = cache.get(ck, cache.TTL.QUOTE);
  if (hit) return res.json(hit);

  try {
    const response = await axios.get(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?range=${range}&interval=${interval}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }, timeout: 12000 }
    );
    const result = response.data.chart.result[0];
    const t = result.timestamp || [];
    const c = result.indicators.quote[0].close || [];
    const payload = { s: "ok", t, c };
    cache.set(ck, payload);
    res.json(payload);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.json({ s: "no_data", t: [Date.now() / 1000 - 86400, Date.now() / 1000], c: [100, 100] });
    }
    console.error("Candles mapping failed:", err.message);
    res.status(500).json({ message: "Failed to fetch candles", error: err.message });
  }
};

// GET /api/market/watchlist — batch quotes for popular symbols
const getWatchlist = async (req, res) => {
  const ck = "watchlist-all";
  const hit = cache.get(ck, cache.TTL.WATCHLIST);
  if (hit) return res.json(hit);

  const symbols = POPULAR_TICKERS;
  try {
    // Fetch in batches of 5 to avoid rate limiting
    const BATCH = 5;
    const allResults = [];
    for (let i = 0; i < symbols.length; i += BATCH) {
      const chunk = symbols.slice(i, i + BATCH);
      const batchResults = await Promise.all(
        chunk.map((sym) =>
          finnhubGet(`${FINNHUB_BASE}/quote?symbol=${sym}&token=${FINNHUB_API_KEY}`)
            .then((r) => ({
              symbol: sym,
              current: r.c,
              change: r.d,
              change_percent: r.dp,
              open: r.o,
              high: r.h,
              low: r.l,
              previous_close: r.pc,
            }))
            .catch(() => ({ symbol: sym, current: 0, change: 0, change_percent: 0 }))
        )
      );
      allResults.push(...batchResults);
      if (i + BATCH < symbols.length) await delay(300);
    }
    cache.set(ck, allResults);
    res.json(allResults);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch watchlist", error: err.message });
  }
};

// GET /api/market/search?q=apple
const searchSymbol = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query param q required" });

  const ck = `search-${q.toLowerCase()}`;
  const hit = cache.get(ck, 10 * 60 * 1000); // 10 min cache for search results
  if (hit) return res.json(hit);

  try {
    const data = await finnhubGet(
      `${FINNHUB_BASE}/search?q=${encodeURIComponent(q)}&token=${FINNHUB_API_KEY}`
    );
    cache.set(ck, data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};

const searchStocks = searchSymbol; // alias

// GET /api/market/crypto
const getCryptoPrices = async (req, res) => {
  const ck = "crypto-prices";
  const hit = cache.get(ck, cache.TTL.CRYPTO);
  if (hit) return res.json(hit);

  const cryptoSymbols = [
    "BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "BINANCE:SOLUSDT",
    "BINANCE:XRPUSDT", "BINANCE:DOGEUSDT",
  ];
  try {
    const results = await Promise.all(
      cryptoSymbols.map((sym) =>
        finnhubGet(`${FINNHUB_BASE}/quote?symbol=${sym}&token=${FINNHUB_API_KEY}`)
          .then((r) => ({
            symbol: sym.replace("BINANCE:", ""),
            current: r.c,
            change: r.d,
            change_percent: r.dp,
            high: r.h,
            low: r.l,
          }))
          .catch(() => ({ symbol: sym.replace("BINANCE:", ""), current: 0, change: 0 }))
      )
    );
    cache.set(ck, results);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch crypto", error: err.message });
  }
};

// GET /api/market/symbols?exchange=US  — curated popular symbols list
// Uses POPULAR_TICKERS + a set of well-known US equities; avoids Finnhub full list (rate-limited)
const CURATED_SYMBOLS = [
  // Mega-cap tech
  { symbol: 'AAPL',  description: 'Apple Inc.' },
  { symbol: 'MSFT',  description: 'Microsoft Corp.' },
  { symbol: 'GOOGL', description: 'Alphabet Inc.' },
  { symbol: 'AMZN',  description: 'Amazon.com Inc.' },
  { symbol: 'META',  description: 'Meta Platforms Inc.' },
  { symbol: 'NVDA',  description: 'NVIDIA Corp.' },
  { symbol: 'TSLA',  description: 'Tesla Inc.' },
  { symbol: 'NFLX',  description: 'Netflix Inc.' },
  { symbol: 'AMD',   description: 'Advanced Micro Devices' },
  { symbol: 'INTC',  description: 'Intel Corp.' },
  { symbol: 'CRM',   description: 'Salesforce Inc.' },
  { symbol: 'ADBE',  description: 'Adobe Inc.' },
  { symbol: 'ORCL',  description: 'Oracle Corp.' },
  { symbol: 'QCOM',  description: 'Qualcomm Inc.' },
  { symbol: 'AVGO',  description: 'Broadcom Inc.' },
  // Financials
  { symbol: 'JPM',   description: 'JPMorgan Chase & Co.' },
  { symbol: 'BAC',   description: 'Bank of America Corp.' },
  { symbol: 'GS',    description: 'Goldman Sachs Group' },
  { symbol: 'MS',    description: 'Morgan Stanley' },
  { symbol: 'V',     description: 'Visa Inc.' },
  { symbol: 'MA',    description: 'Mastercard Inc.' },
  { symbol: 'WFC',   description: 'Wells Fargo & Co.' },
  { symbol: 'BRK.B', description: 'Berkshire Hathaway B' },
  { symbol: 'AXP',   description: 'American Express Co.' },
  // Healthcare
  { symbol: 'JNJ',   description: 'Johnson & Johnson' },
  { symbol: 'UNH',   description: 'UnitedHealth Group' },
  { symbol: 'PFE',   description: 'Pfizer Inc.' },
  { symbol: 'ABBV',  description: 'AbbVie Inc.' },
  { symbol: 'MRK',   description: 'Merck & Co.' },
  { symbol: 'LLY',   description: 'Eli Lilly and Co.' },
  { symbol: 'TMO',   description: 'Thermo Fisher Scientific' },
  // Energy
  { symbol: 'XOM',   description: 'Exxon Mobil Corp.' },
  { symbol: 'CVX',   description: 'Chevron Corp.' },
  { symbol: 'COP',   description: 'ConocoPhillips' },
  { symbol: 'SLB',   description: 'Schlumberger Ltd.' },
  // Consumer
  { symbol: 'WMT',   description: 'Walmart Inc.' },
  { symbol: 'COST',  description: 'Costco Wholesale Corp.' },
  { symbol: 'PG',    description: 'Procter & Gamble Co.' },
  { symbol: 'KO',    description: 'Coca-Cola Co.' },
  { symbol: 'PEP',   description: 'PepsiCo Inc.' },
  { symbol: 'NKE',   description: 'Nike Inc.' },
  { symbol: 'MCD',   description: 'McDonald\'s Corp.' },
  { symbol: 'SBUX',  description: 'Starbucks Corp.' },
  { symbol: 'DIS',   description: 'Walt Disney Co.' },
  // Industrials / Other
  { symbol: 'BA',    description: 'Boeing Co.' },
  { symbol: 'GE',    description: 'General Electric Co.' },
  { symbol: 'CAT',   description: 'Caterpillar Inc.' },
  { symbol: 'RTX',   description: 'Raytheon Technologies' },
  { symbol: 'NEE',   description: 'NextEra Energy Inc.' },
  { symbol: 'T',     description: 'AT&T Inc.' },
  { symbol: 'VZ',    description: 'Verizon Communications' },
  { symbol: 'SPY',   description: 'SPDR S&P 500 ETF' },
  { symbol: 'QQQ',   description: 'Invesco QQQ ETF' },
  { symbol: 'IWM',   description: 'iShares Russell 2000 ETF' },
];

const getSymbols = (req, res) => {
  const exchange = (req.query.exchange || 'US').toUpperCase();
  res.json({
    exchange,
    count: CURATED_SYMBOLS.length,
    symbols: CURATED_SYMBOLS,
    source: 'curated',
    warning: null,
  });
};

module.exports = { getQuote, getCandles, getWatchlist, searchSymbol, getCryptoPrices, searchStocks, getSymbols };
