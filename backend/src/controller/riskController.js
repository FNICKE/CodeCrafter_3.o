// controllers/riskController.js
// Real portfolio risk analysis: beta, concentration, sector exposure, VaR estimate, diversification score

const axios  = require('axios');
const db     = require('../config/db');
const cache  = require('../config/cache');

const FINNHUB_KEY  = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Sector mapping for common tickers ────────────────────────────────────────
const TICKER_SECTOR_MAP = {
  AAPL:'Technology', MSFT:'Technology', GOOGL:'Technology', META:'Technology',
  NVDA:'Technology', AMD:'Technology',  INTC:'Technology',  CRM:'Technology',
  ORCL:'Technology', ADBE:'Technology', TSLA:'Consumer Discretionary',
  AMZN:'Consumer Discretionary', NKE:'Consumer Discretionary', MCD:'Consumer Discretionary',
  JPM:'Financials',  BAC:'Financials',  GS:'Financials',    MS:'Financials',
  V:'Financials',    MA:'Financials',   WFC:'Financials',   C:'Financials',
  JNJ:'Healthcare',  PFE:'Healthcare',  UNH:'Healthcare',   ABBV:'Healthcare',
  MRK:'Healthcare',  LLY:'Healthcare',  TMO:'Healthcare',
  XOM:'Energy',      CVX:'Energy',      COP:'Energy',       SLB:'Energy',
  PG:'Consumer Staples', KO:'Consumer Staples', PEP:'Consumer Staples', WMT:'Consumer Staples',
  COST:'Consumer Staples', PM:'Consumer Staples',
  NEE:'Utilities',   DUK:'Utilities',   SO:'Utilities',
  AMT:'Real Estate', PLD:'Real Estate', SPG:'Real Estate',
  BA:'Industrials',  CAT:'Industrials', GE:'Industrials',   RTX:'Industrials',
  LIN:'Materials',   SHW:'Materials',   FCX:'Materials',
  BRK:'Financials',
};

// ── Approximate beta values (vs S&P 500) for common stocks ───────────────────
const BETA_TABLE = {
  AAPL:1.25, MSFT:0.90, GOOGL:1.05, META:1.30, NVDA:1.65, AMD:1.70,
  TSLA:2.00, AMZN:1.15, NFLX:1.40, CRM:1.20,  INTC:0.85, ORCL:0.80,
  JPM:1.10,  BAC:1.35,  GS:1.30,   MS:1.25,   V:0.95,    MA:0.95,
  JNJ:0.55,  PFE:0.65,  UNH:0.70,  ABBV:0.60, MRK:0.55,  LLY:0.55,
  XOM:0.85,  CVX:0.90,  COP:1.05,
  PG:0.45,   KO:0.50,   PEP:0.50,  WMT:0.55,  COST:0.65,
  NEE:0.50,  DUK:0.35,  SO:0.30,
  AMT:0.80,  PLD:0.85,  SPG:1.05,
  BA:1.35,   CAT:1.10,  GE:1.15,
};

// ── GET /api/risk/portfolio/:portfolioId ──────────────────────────────────────
const getPortfolioRisk = async (req, res) => {
  const { portfolioId } = req.params;
  if (!portfolioId) return res.status(400).json({ message: 'portfolioId required' });

  // ✅ FIX 1: Verify the portfolio belongs to the authenticated user
  const portfolioCheck = await new Promise((resolve, reject) => {
    db.query(
      'SELECT id FROM portfolios WHERE id = ? AND user_id = ? LIMIT 1',
      [portfolioId, req.user.id],
      (err, rows) => { if (err) reject(err); else resolve(rows || []); }
    );
  }).catch(() => []);

  if (!portfolioCheck.length) {
    return res.status(404).json({ message: 'Portfolio not found' });
  }

  // ✅ FIX 2: Correct table name — was 'holdings', should be 'portfolio_holdings'
  const holdings = await new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM portfolio_holdings WHERE portfolio_id = ?',
      [portfolioId],
      (err, rows) => { if (err) reject(err); else resolve(rows || []); }
    );
  }).catch(() => []);

  if (!holdings.length) {
    return res.json({
      error: false,
      message: 'No holdings found',
      risk: null,
    });
  }

  // ── Fetch live quotes for all holdings ─────────────────────────────────────
  const enriched = [];
  for (const h of holdings) {
    const sym = String(h.symbol || '').toUpperCase().replace(/\.(NS|BO|NSE)$/, '');
    let current = Number(h.current_price) || Number(h.purchase_price) || 0;

    try {
      // Use shared quote cache
      const quoteCk = `quote-${sym}`;
      let current_live = cache.get(quoteCk, cache.TTL.QUOTE);
      if (!current_live) {
        const { data } = await axios.get(
          `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(sym)}&token=${FINNHUB_KEY}`,
          { timeout: 8000 }
        );
        if (data?.c && data.c > 0) { current_live = data; cache.set(quoteCk, data); }
      }
      if (current_live?.c && current_live.c > 0) current = current_live.c;
    } catch {}

    const value    = Number(h.quantity) * current;
    const buyValue = Number(h.quantity) * Number(h.purchase_price);
    const pnl      = buyValue > 0 ? ((value - buyValue) / buyValue) * 100 : 0;
    const sector   = TICKER_SECTOR_MAP[sym] || 'Other';
    const beta     = BETA_TABLE[sym] ?? 1.0;

    enriched.push({
      symbol:         sym,
      name:           h.asset_name || sym,
      quantity:       Number(h.quantity),
      purchase_price: Number(h.purchase_price),
      current_price:  current,
      value,
      pnl_pct:        parseFloat(pnl.toFixed(2)),
      sector,
      beta,
    });

    await delay(150);
  }

  // ── Compute metrics ──────────────────────────────────────────────────────────
  const totalValue = enriched.reduce((s, h) => s + h.value, 0);

  // Weights
  const withWeights = enriched.map(h => ({
    ...h,
    weight: totalValue > 0 ? h.value / totalValue : 0,
  }));

  // Weighted portfolio beta
  const portfolioBeta = withWeights.reduce((s, h) => s + h.beta * h.weight, 0);

  // Sector exposure
  const sectorMap = {};
  for (const h of withWeights) {
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.weight;
  }
  const sectorExposure = Object.entries(sectorMap)
    .map(([sector, weight]) => ({ sector, weight: parseFloat((weight * 100).toFixed(1)) }))
    .sort((a, b) => b.weight - a.weight);

  // Concentration risk (Herfindahl-Hirschman Index — 0 to 10000)
  const hhi = withWeights.reduce((s, h) => s + Math.pow(h.weight * 100, 2), 0);
  const concentrationRisk =
    hhi > 2500 ? 'High'   :
    hhi > 1000 ? 'Medium' : 'Low';

  // Top holding weight
  const topHolding = withWeights.reduce((max, h) => h.weight > max.weight ? h : max, withWeights[0]);

  // Diversification score (0-100)
  const numSectors   = Object.keys(sectorMap).length;
  const numHoldings  = withWeights.length;
  const topWeight    = topHolding?.weight || 1;
  const divScore     = Math.round(
    Math.min(100,
      (numHoldings  / 20)  * 30 +
      (numSectors   / 10)  * 30 +
      (1 - topWeight)      * 25 +
      (1 - hhi / 10000)   * 15
    )
  );

  // Approximate 1-day Value at Risk (95% confidence, normal distribution)
  const MARKET_DAILY_VOL = 0.012;
  const var95 = totalValue * portfolioBeta * MARKET_DAILY_VOL * 1.645;

  // Overall risk rating
  const overallRisk =
    portfolioBeta > 1.5 ? 'Aggressive' :
    portfolioBeta > 1.1 ? 'Moderate-High' :
    portfolioBeta > 0.8 ? 'Moderate'       :
    portfolioBeta > 0.5 ? 'Conservative'   : 'Very Conservative';

  // Recommendations
  const recommendations = [];
  if (topWeight > 0.25) {
    recommendations.push({
      type: 'warning',
      title: 'High Concentration Risk',
      body: `${topHolding.symbol} makes up ${(topWeight * 100).toFixed(1)}% of your portfolio. Consider trimming to below 15-20%.`,
    });
  }
  if (numSectors < 3) {
    recommendations.push({
      type: 'warning',
      title: 'Low Sector Diversification',
      body: `You're exposed to only ${numSectors} sector${numSectors === 1 ? '' : 's'}. Spreading across 5+ sectors reduces unsystematic risk.`,
    });
  }
  if (portfolioBeta > 1.5) {
    recommendations.push({
      type: 'info',
      title: 'High Market Sensitivity',
      body: `Portfolio beta of ${portfolioBeta.toFixed(2)} means ~${(portfolioBeta * 100).toFixed(0)}% of S&P moves. Add low-beta defensives (Utilities, Consumer Staples) to reduce volatility.`,
    });
  }
  if (divScore < 40) {
    recommendations.push({
      type: 'warning',
      title: 'Low Diversification Score',
      body: `Your diversification score is ${divScore}/100. Aim for 15+ holdings across 5+ sectors for a well-balanced portfolio.`,
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      type: 'success',
      title: 'Portfolio Looks Balanced',
      body: `Good diversification across ${numSectors} sectors with a moderate beta of ${portfolioBeta.toFixed(2)}.`,
    });
  }

  res.json({
    error: false,
    total_value:           parseFloat(totalValue.toFixed(2)),
    num_holdings:          numHoldings,
    portfolio_beta:        parseFloat(portfolioBeta.toFixed(3)),
    overall_risk:          overallRisk,
    concentration_risk:    concentrationRisk,
    hhi:                   parseFloat(hhi.toFixed(0)),
    diversification_score: divScore,
    var_95_1day:           parseFloat(var95.toFixed(2)),
    sector_exposure:       sectorExposure,
    holdings:              withWeights.map(h => ({
      symbol:   h.symbol,
      name:     h.name,
      weight:   parseFloat((h.weight * 100).toFixed(1)),
      beta:     h.beta,
      sector:   h.sector,
      pnl_pct:  h.pnl_pct,
      value:    parseFloat(h.value.toFixed(2)),
    })),
    recommendations,
    generated_at: new Date().toISOString(),
  });
};

// ── GET /api/risk/benchmark ───────────────────────────────────────────────────
const getBenchmark = async (req, res) => {
  try {
    const ck = 'benchmark-spy';
    const hit = cache.get(ck, cache.TTL.QUOTE);
    if (hit) return res.json(hit);

    const { data } = await axios.get(
      `${FINNHUB_BASE}/quote?symbol=SPY&token=${FINNHUB_KEY}`,
      { timeout: 10000 }
    );
    const result = {
      symbol: 'SPY',
      name:   'S&P 500 ETF',
      price:  data?.c,
      change_pct: data?.dp,
      beta:   1.0,
      description: 'The S&P 500 benchmark. A portfolio beta > 1 moves more than the market; < 1 moves less.',
    };
    cache.set(ck, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch benchmark', error: err.message });
  }
};

module.exports = { getPortfolioRisk, getBenchmark };