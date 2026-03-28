const axios = require("axios");

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "d73ns7pr01qjjol3m9l0d73ns7pr01qjjol3m9lg";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

// GET /api/market/quote/:symbol
const getQuote = async (req, res) => {
  const { symbol } = req.params;
  try {
    const response = await axios.get(
      `${FINNHUB_BASE}/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`
    );
    res.json({ symbol: symbol.toUpperCase(), ...response.data });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch quote", error: err.message });
  }
};

// GET /api/market/candles/:symbol
const getCandles = async (req, res) => {
  const { symbol } = req.params;
  const range = req.query.range || "1mo"; // options: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y
  let interval = "1d";
  if (["1d", "5d"].includes(range)) interval = "5m"; // intraday for shorter ranges
  if (range === "1d") interval = "2m"; // highly responsive 1-day

  try {
    const response = await axios.get(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?range=${range}&interval=${interval}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
    );
    const result = response.data.chart.result[0];
    const t = result.timestamp || [];
    const c = result.indicators.quote[0].close || [];
    
    res.json({ s: "ok", t, c });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Return mostly flat mock line to prevent crashes if symbol not found on yahoo
      return res.json({ s: "no_data", t: [Date.now()/1000 - 86400, Date.now()/1000], c: [100, 100] });
    }
    console.error("Candles mapping failed:", err.message);
    res.status(500).json({ message: "Failed to fetch candles", error: err.message });
  }
};

// GET /api/market/watchlist - batch quotes for popular symbols
const getWatchlist = async (req, res) => {
  const symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", "AMD", "INTC"];
  try {
    const results = await Promise.all(
      symbols.map((sym) =>
        axios
          .get(`${FINNHUB_BASE}/quote?symbol=${sym}&token=${FINNHUB_API_KEY}`)
          .then((r) => ({
            symbol: sym,
            current: r.data.c,
            change: r.data.d,
            change_percent: r.data.dp,
            open: r.data.o,
            high: r.data.h,
            low: r.data.l,
            previous_close: r.data.pc,
          }))
          .catch(() => ({ symbol: sym, current: 0, change: 0, change_percent: 0 }))
      )
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch watchlist", error: err.message });
  }
};

// GET /api/market/search?q=apple
const searchSymbol = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query param q required" });
  try {
    const response = await axios.get(
      `${FINNHUB_BASE}/search?q=${encodeURIComponent(q)}&token=${FINNHUB_API_KEY}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};
const searchStocks = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query is required" });

  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${FINNHUB_API_KEY}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};

// GET /api/market/crypto
const getCryptoPrices = async (req, res) => {
  const cryptoSymbols = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "BINANCE:SOLUSDT", "BINANCE:XRPUSDT", "BINANCE:DOGEUSDT"];
  try {
    const results = await Promise.all(
      cryptoSymbols.map((sym) =>
        axios
          .get(`${FINNHUB_BASE}/quote?symbol=${sym}&token=${FINNHUB_API_KEY}`)
          .then((r) => ({
            symbol: sym.replace("BINANCE:", ""),
            current: r.data.c,
            change: r.data.d,
            change_percent: r.data.dp,
            high: r.data.h,
            low: r.data.l,
          }))
          .catch(() => ({ symbol: sym, current: 0, change: 0 }))
      )
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch crypto", error: err.message });
  }
  // Search stocks using Finnhub
// Get single quote (already exists as getQuote)
};

module.exports = { getQuote, getCandles, getWatchlist, searchSymbol, getCryptoPrices, searchStocks };
