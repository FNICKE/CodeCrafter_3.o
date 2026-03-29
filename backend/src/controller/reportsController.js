// controllers/reportsController.js
// Aggregates analyst recommendations, earnings calendars, price targets, and SEC summaries

const axios = require('axios');

const FINNHUB_KEY  = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const EDGAR_BASE   = 'https://data.sec.gov';

// ✅ Removed 'Host' header — axios sets it automatically and manual override causes 404s
const SEC_HEADERS = {
  'User-Agent':      'HackTrix/1.0 research@hacktrix.com',
  'Accept-Encoding': 'gzip, deflate',
  'Accept':          'application/json',
};

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Cache ────────────────────────────────────────────────────────────────────
const _cache = new Map();
const TTL    = 8 * 60 * 1000; // 8 min

function cacheGet(k) {
  const e = _cache.get(k);
  if (!e) return null;
  if (Date.now() - e.ts > TTL) { _cache.delete(k); return null; }
  return e.value;
}
function cacheSet(k, v) { _cache.set(k, { value: v, ts: Date.now() }); }

async function finnhub(path) {
  try {
    const sep = path.includes('?') ? '&' : '?';
    const { data } = await axios.get(
      `${FINNHUB_BASE}${path}${sep}token=${FINNHUB_KEY}`,
      { timeout: 12000 }
    );
    return data;
  } catch (e) {
    console.warn(`[reports] finnhub ${path}:`, e.response?.status || e.message);
    return null;
  }
}

// ── GET /api/reports/analyst/:ticker ─────────────────────────────────────────
const getAnalystReport = async (req, res) => {
  const ticker = String(req.params.ticker || '').toUpperCase().trim();
  if (!ticker) return res.status(400).json({ message: 'Ticker required' });

  const ck = `analyst-${ticker}`;
  const cached = cacheGet(ck);
  if (cached) return res.json(cached);

  const [recommendations, priceTarget, epsSurprises, basicFinancials, peers] = await Promise.all([
    finnhub(`/stock/recommendation?symbol=${encodeURIComponent(ticker)}`),
    finnhub(`/stock/price-target?symbol=${encodeURIComponent(ticker)}`),
    finnhub(`/stock/earnings?symbol=${encodeURIComponent(ticker)}&limit=8`),
    finnhub(`/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all`),
    finnhub(`/stock/peers?symbol=${encodeURIComponent(ticker)}`),
  ]);

  const recTrend = Array.isArray(recommendations)
    ? recommendations.slice(0, 6).map(r => ({
        period:      r.period,
        strong_buy:  r.strongBuy,
        buy:         r.buy,
        hold:        r.hold,
        sell:        r.sell,
        strong_sell: r.strongSell,
        total:       (r.strongBuy + r.buy + r.hold + r.sell + r.strongSell),
      }))
    : [];

  const latestRec = recTrend[0] || null;
  let consensusRating = 'No Data';
  if (latestRec) {
    const bullish = latestRec.strong_buy + latestRec.buy;
    const bearish = latestRec.strong_sell + latestRec.sell;
    const total   = latestRec.total || 1;
    const bullPct = bullish / total;
    const bearPct = bearish / total;
    consensusRating =
      bullPct > 0.65 ? 'Strong Buy' :
      bullPct > 0.45 ? 'Buy'        :
      bearPct > 0.45 ? 'Sell'       :
      bearPct > 0.30 ? 'Weak Sell'  : 'Hold';
  }

  const earningsData = Array.isArray(epsSurprises)
    ? epsSurprises.map(e => ({
        period:       e.period,
        actual:       e.actual,
        estimate:     e.estimate,
        surprise:     e.surprise,
        surprise_pct: e.surprisePercent,
        beat: e.actual != null && e.estimate != null ? e.actual >= e.estimate : null,
      }))
    : [];

  const metrics    = basicFinancials?.metric || {};
  const keyMetrics = {
    pe_ttm:         metrics['peBasicExclExtraTTM'] ?? metrics['peTTM'] ?? null,
    ps_ttm:         metrics['psTTM']               ?? null,
    pb:             metrics['pbAnnual']             ?? null,
    ev_ebitda:      metrics['evEbitdaTTM']          ?? null,
    roe_ttm:        metrics['roeTTM']               ?? null,
    roa_ttm:        metrics['roaTTM']               ?? null,
    debt_equity:    metrics['totalDebt/totalEquityAnnual'] ?? null,
    current_ratio:  metrics['currentRatioAnnual']   ?? null,
    revenue_growth: metrics['revenueGrowthTTMYoy']  ?? null,
    eps_growth:     metrics['epsGrowthTTMYoy']      ?? null,
    dividend_yield: metrics['dividendYieldIndicatedAnnual'] ?? null,
    beta:           metrics['beta']                 ?? null,
    '52w_high':     metrics['52WeekHigh']           ?? null,
    '52w_low':      metrics['52WeekLow']            ?? null,
  };

  const result = {
    ticker,
    consensus_rating: consensusRating,
    price_target: priceTarget && typeof priceTarget === 'object' ? {
      target_high:   priceTarget.targetHigh,
      target_low:    priceTarget.targetLow,
      target_mean:   priceTarget.targetMean,
      target_median: priceTarget.targetMedian,
      analyst_count: priceTarget.lastUpdated,
    } : null,
    recommendation_trend: recTrend,
    earnings_history:     earningsData,
    key_metrics:          keyMetrics,
    peers: Array.isArray(peers) ? peers.slice(0, 8) : [],
    generated_at: new Date().toISOString(),
  };

  cacheSet(ck, result);
  res.json(result);
};

// ── GET /api/reports/earnings-calendar ───────────────────────────────────────
const getEarningsCalendar = async (req, res) => {
  const ck     = 'earnings-cal';
  const cached = cacheGet(ck);
  if (cached) return res.json(cached);

  const today   = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const data = await finnhub(`/calendar/earnings?from=${today}&to=${nextWeek}`);
    const earnings = (data?.earningsCalendar || []).map(e => ({
      symbol:  e.symbol,
      company: e.symbol,
      date:    e.date,
      time:    e.hour,
      eps_est: e.epsEstimate,
      rev_est: e.revenueEstimate,
      year:    e.year,
      quarter: e.quarter,
    }));
    const result = { earnings, total: earnings.length, from: today, to: nextWeek };
    cacheSet(ck, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch earnings calendar', error: err.message });
  }
};

// ── GET /api/reports/ipo-calendar ─────────────────────────────────────────────
const getIPOCalendar = async (req, res) => {
  const ck     = 'ipo-cal';
  const cached = cacheGet(ck);
  if (cached) return res.json(cached);

  const today  = new Date().toISOString().split('T')[0];
  const inThree = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const data = await finnhub(`/calendar/ipo?from=${today}&to=${inThree}`);
    const ipos = (data?.ipoCalendar || []).map(i => ({
      symbol:      i.symbol,
      company:     i.name,
      date:        i.date,
      price_low:   i.price?.split('-')[0]?.trim(),
      price_high:  i.price?.split('-')[1]?.trim() || i.price,
      price_raw:   i.price,
      shares:      i.numberOfShares,
      total_value: i.totalSharesValue,
      exchange:    i.exchange,
      status:      i.status,
    }));
    const result = { ipos, total: ipos.length };
    cacheSet(ck, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch IPO calendar', error: err.message });
  }
};

// ── GET /api/reports/sec/:ticker ──────────────────────────────────────────────
// ✅ Fixed: removed manual 'Host' header, improved error handling
const getSecSummary = async (req, res) => {
  const ticker = String(req.params.ticker || '').toUpperCase().trim();
  if (!ticker) return res.status(400).json({ message: 'Ticker required' });

  const ck     = `sec-${ticker}`;
  const cached = cacheGet(ck);
  if (cached) return res.json(cached);

  try {
    // Step 1: get CIK from ticker
    const { data: mapData } = await axios.get(
      `${EDGAR_BASE}/files/company_tickers.json`,
      { headers: SEC_HEADERS, timeout: 15000 }
    );

    let cik = null, companyName = ticker;
    for (const entry of Object.values(mapData || {})) {
      if (entry.ticker?.toUpperCase() === ticker) {
        cik = String(entry.cik_str).padStart(10, '0');
        companyName = entry.title;
        break;
      }
    }

    if (!cik) {
      // Return gracefully — not a 500
      return res.json({ ticker, found: false, filings: [], company: ticker, cik: null });
    }

    await delay(400); // be polite to SEC servers

    // Step 2: fetch filing submissions
    const { data: sub } = await axios.get(
      `${EDGAR_BASE}/submissions/CIK${cik}.json`,
      { headers: SEC_HEADERS, timeout: 15000 }
    );

    const recent = sub?.filings?.recent || {};
    const forms  = recent.form            || [];
    const dates  = recent.filingDate      || [];
    const accNos = recent.accessionNumber || [];
    const docs   = recent.primaryDocument || [];
    const periods= recent.reportDate      || [];

    const WANT = ['10-K', '10-Q', '8-K', 'DEF 14A'];
    const filings = [];

    for (let i = 0; i < forms.length && filings.length < 15; i++) {
      if (!WANT.includes(forms[i])) continue;
      const accNo = accNos[i]?.replace(/-/g, '') || '';
      const cikInt = parseInt(cik, 10);
      filings.push({
        form_type:   forms[i],
        file_date:   dates[i],
        period:      periods[i] || null,
        primary_doc: docs[i],
        url:         `https://www.sec.gov/Archives/edgar/data/${cikInt}/${accNo}/${docs[i]}`,
        browse_url:  `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${forms[i]}&dateb=&owner=include&count=10`,
      });
    }

    const result = { ticker, company: companyName, cik, found: true, filings };
    cacheSet(ck, result);
    res.json(result);

  } catch (err) {
    console.error(`[reports] getSecSummary(${ticker}):`, err.response?.status, err.message);
    // Return empty result instead of 500 so frontend degrades gracefully
    res.json({ ticker, found: false, filings: [], company: ticker, cik: null, error: err.message });
  }
};

// ── GET /api/reports/overview ─────────────────────────────────────────────────
const getReportsOverview = async (req, res) => {
  const ck     = 'reports-overview';
  const cached = cacheGet(ck);
  if (cached) return res.json(cached);

  const today  = new Date().toISOString().split('T')[0];
  const next7  = new Date(Date.now() +  7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const next90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [earnData, ipoData] = await Promise.all([
    finnhub(`/calendar/earnings?from=${today}&to=${next7}`),
    finnhub(`/calendar/ipo?from=${today}&to=${next90}`),
  ]);

  const result = {
    upcoming_earnings: earnData?.earningsCalendar?.length || 0,
    upcoming_ipos:     ipoData?.ipoCalendar?.length       || 0,
    generated_at:      new Date().toISOString(),
  };
  cacheSet(ck, result);
  res.json(result);
};

module.exports = {
  getAnalystReport,
  getEarningsCalendar,
  getIPOCalendar,
  getSecSummary,
  getReportsOverview,
};