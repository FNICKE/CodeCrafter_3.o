const axios = require("axios");

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

/**
 * GET /api/regulatory/filings?symbol=AAPL&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Surfaces SEC / regulatory filings via Finnhub (centralized regulatory view).
 */
const getFilings = async (req, res) => {
  const symbol = (req.query.symbol || "").trim().toUpperCase();
  if (!symbol || symbol.length > 12) {
    return res.status(400).json({ message: "Valid symbol query param required" });
  }
  const to = req.query.to || new Date().toISOString().split("T")[0];
  const from =
    req.query.from ||
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  try {
    const url = `${FINNHUB_BASE}/stock/filings?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
    const { data } = await axios.get(url);
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    const normalized = list.slice(0, 50).map((f) => ({
      symbol: f.symbol || symbol,
      form: f.form || f.type || "—",
      filed_date: f.filedDate || f.filed_date || null,
      accepted_date: f.acceptedDate || null,
      report_url: f.reportUrl || f.report_url || f.link || null,
      title: f.form ? `${f.form} filing` : "Regulatory filing",
    }));
    res.json({
      symbol,
      from,
      to,
      count: normalized.length,
      filings: normalized,
      source: "finnhub_stock_filings",
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch filings",
      error: err.response?.data || err.message,
    });
  }
};

module.exports = { getFilings };
