const fs = require('fs');
const path = require('path');

const summaryCode = `import { useState, useEffect, useMemo, useRef } from 'react';
import { apiGetStockSummary, apiGetStockSymbols, apiGetWatchlist } from '../api';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Newspaper,
  Search,
  Loader2,
  ExternalLink,
  Clock as ClockIcon,
  Shield,
  RefreshCw,
} from 'lucide-react';

const AI_CSS = \`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');

.inv-root {
  --blue:       #4f9cf9;
  --blue-dim:   rgba(79,156,249,.12);
  --blue-ring:  rgba(79,156,249,.25);
  --green:      #3ecf8e;
  --red:        #f87171;
  --amber:      #fbbf24;
  --cyan:       #22d3ee;
  --bg:         #060a10;
  --s1:         #0c1219;
  --s2:         #111a24;
  --s3:         #192130;
  --border:     rgba(255,255,255,.07);
  --border2:    rgba(255,255,255,.12);
  --text:       #dde5ef;
  --muted:      #4a5a6e;
  --muted2:     #7a8fa6;
  font-family: 'Syne', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding-bottom: 6rem;
  overflow: auto;
}

.inv-hero {
  position: relative;
  padding: 3rem 1.5rem 2rem;
  overflow: hidden;
}

.inv-card {
  background: var(--s1);
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  padding: 1.75rem;
  margin: 0 1.5rem 1.5rem;
}

.inv-input, .inv-select {
  background: var(--s2); border: 1px solid var(--border); border-radius: .625rem;
  padding: .7rem 1rem; color: var(--text);
  font-family: 'Syne', sans-serif; font-size: .875rem;
  transition: border-color .2s, box-shadow .2s;
  appearance: none;
}
.inv-input:focus, .inv-select:focus {
  outline: none; border-color: var(--blue-ring); box-shadow: 0 0 0 3px var(--blue-dim);
}

.inv-submit {
  background: var(--blue); color: #fff; border: none; border-radius: .75rem;
  padding: .8rem 1.75rem; font-family: 'Syne', sans-serif;
  font-weight: 700; font-size: .875rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: .6rem;
  transition: all .2s; width: 100%;
}
.inv-submit:hover:not(:disabled) { background: #3a8ae8; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,156,249,.25); }
.inv-submit:disabled { opacity: .45; cursor: not-allowed; }

.sp-news-list { display: flex; flex-direction: column; gap: 1rem; }
.sp-news-item {
  display: flex; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);
}
.sp-news-item:last-child { border-bottom: none; padding-bottom: 0; }
.sp-news-img { width: 68px; height: 68px; object-fit: cover; border-radius: .625rem; flex-shrink: 0; }
.sp-news-meta { font-family: 'JetBrains Mono', monospace; font-size: .62rem; color: var(--muted); display: flex; align-items: center; gap: .625rem; margin-bottom: .4rem; }
.sp-news-headline {
  font-size: .88rem; font-weight: 600; color: var(--text); line-height: 1.4;
  text-decoration: none; display: flex; align-items: flex-start; gap: .35rem;
}
.sp-news-headline:hover { color: var(--blue); }

.sp-kpi {
  background: var(--s1); border: 1px solid var(--border); border-radius: 1.125rem;
  padding: 1.5rem; position: relative; overflow: hidden;
}

@keyframes spin { to { transform: rotate(360deg); } }
.sp-spin { animation: spin .8s linear infinite; }
\`;

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor(Date.now() / 1000 - (typeof ts === 'number' ? ts : parseInt(ts, 10)));
  if (diff < 120) return \`\${diff}s ago\`;
  if (diff < 3600) return \`\${Math.floor(diff / 60)}m ago\`;
  if (diff < 86400) return \`\${Math.floor(diff / 3600)}h ago\`;
  return \`\${Math.floor(diff / 86400)}d ago\`;
}

function sentimentColor(s) {
  if (s === 'Very Positive' || s === 'Positive') return '#34d399';
  if (s === 'Very Negative' || s === 'Negative') return '#f87171';
  return '#5a6878';
}

const predColor = (label) => {
  const l = (label || '').toLowerCase();
  if (l.includes('bull')) return 'var(--green)';
  if (l.includes('bear')) return 'var(--red)';
  return 'var(--amber)';
};

const riskColor = (level) => {
  const l = (level || '').toLowerCase();
  if (l.startsWith('high')) return 'var(--red)';
  if (l.includes('medium')) return 'var(--amber)';
  return 'var(--green)';
};

const EXCHANGE_OPTIONS = [{ code: 'US', label: 'United States (US)' }];

export default function StockSummary() {
  const [symbol, setSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [symbols, setSymbols] = useState([]);
  const [symbolsMeta, setSymbolsMeta] = useState({
    exchange: 'US',
    count: 0,
    loading: true,
    error: null,
    warning: null,
    source: null,
  });
  const [symbolFilter, setSymbolFilter] = useState('');
  const [exchange, setExchange] = useState('US');
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistSelection, setWatchlistSelection] = useState('');

  useEffect(() => {
    const s = document.createElement('style'); s.innerHTML = AI_CSS;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  useEffect(() => {
    apiGetWatchlist()
      .then((r) => setWatchlist(Array.isArray(r.data) ? r.data : []))
      .catch(() => setWatchlist([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setSymbolsMeta((m) => ({ ...m, loading: true, error: null }));
      try {
        const res = await apiGetStockSymbols({ exchange });
        if (cancelled) return;
        const list = res.data?.symbols || [];
        setSymbols(list);
        setSymbolsMeta({
          exchange: res.data?.exchange || exchange,
          count: list.length,
          loading: false,
          error: null,
          warning: res.data?.warning || null,
          source: res.data?.source || null,
        });
        setSymbol((cur) => {
          if (list.some((s) => s.symbol === cur)) return cur;
          return list[0]?.symbol || cur;
        });
      } catch (e) {
        if (!cancelled) {
          setSymbolsMeta((m) => ({
            ...m,
            loading: false,
            error: e.message || 'Failed to load list',
            warning: null,
            source: null,
          }));
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [exchange]);

  const visibleSymbols = useMemo(() => {
    const t = symbolFilter.trim().toLowerCase();
    if (!symbols.length) return [];
    if (!t) return symbols;
    return symbols.filter(
      (s) =>
        s.symbol.toLowerCase().includes(t) ||
        (s.description && s.description.toLowerCase().includes(t))
    );
  }, [symbols, symbolFilter]);

  useEffect(() => {
    if (!visibleSymbols.length) return;
    if (!visibleSymbols.some((s) => s.symbol === symbol)) {
      setSymbol(visibleSymbols[0].symbol);
    }
  }, [visibleSymbols, symbol]);

  const handleWatchlistPick = (e) => {
    const sym = e.target.value;
    setWatchlistSelection(sym);
    if (!sym) return;
    const upper = sym.toUpperCase();
    if (symbols.some((s) => s.symbol === upper)) {
      setSymbol(upper);
      setSymbolFilter('');
    } else {
      setSymbolFilter(upper);
      setSymbol(upper);
    }
  };

  const run = async (e) => {
    e?.preventDefault();
    const s = symbol.trim().toUpperCase();
    if (!s || !visibleSymbols.some((x) => x.symbol === s)) {
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const res = await apiGetStockSummary(s);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inv-root">
      <div className="inv-hero">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '2rem', fontFamily: "'DM Serif Display', serif", margin: 0 }}>
          <Sparkles size={28} style={{ color: 'var(--blue)' }} />
          Stock Summary
        </h1>
        <p style={{ color: 'var(--muted2)', marginTop: '.5rem' }}>
          Prediction, latest headlines, risk level, and profit outlook — powered by live Finnhub data (not financial advice).
        </p>
      </div>

      <form onSubmit={run} className="inv-card" style={{ padding: '1.5rem', marginBottom: 24 }}>
        {symbolsMeta.warning && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              fontSize: 13,
              color: 'var(--amber)',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            {symbolsMeta.warning}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 200px' }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>Market</label>
            <select
              className="inv-select"
              value={exchange}
              onChange={(e) => { setExchange(e.target.value); setSymbolFilter(''); }}
              style={{ width: '100%' }}
            >
              {EXCHANGE_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>{o.label}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>
              Search (optional)
              {symbolsMeta.count > 0 && (
                <span style={{ fontWeight: 400, color: 'var(--muted2)' }}>
                  {' '}
                  — showing {visibleSymbols.length} of {symbolsMeta.count} loaded
                </span>
              )}
            </label>
            <input
              className="inv-input"
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              placeholder="Type symbol or company name to narrow…"
              style={{ width: '100%' }}
              disabled={symbolsMeta.loading}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 220px', minWidth: 0 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>Quick pick (watchlist)</label>
            <select
              className="inv-select"
              value={watchlistSelection}
              onChange={handleWatchlistPick}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              <option value="">— Same as Portfolio —</option>
              {watchlist.map((w) => (
                <option key={w.symbol} value={w.symbol}>
                  {w.symbol}
                  {w.current != null ? \`  ~$\${Number(w.current).toFixed(2)}\` : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>
              All stocks (API)
              {symbolsMeta.loading && (
                <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--blue)' }}>
                  <RefreshCw size={12} className="sp-spin" /> Loading list…
                </span>
              )}
              {symbolsMeta.error && (
                <span style={{ color: 'var(--red)', marginLeft: 8 }}>{symbolsMeta.error}</span>
              )}
            </label>
            {visibleSymbols.length === 0 && symbolFilter.trim() ? (
              <div className="inv-input" style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', background: 'var(--surface2)' }}>
                No symbols match “{symbolFilter.trim()}”. Clear search to see the full list.
              </div>
            ) : (
              <select
                className="inv-select"
                value={visibleSymbols.some((s) => s.symbol === symbol) ? symbol : visibleSymbols[0]?.symbol || ''}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  setWatchlistSelection('');
                }}
                style={{ width: '100%', cursor: 'pointer' }}
                disabled={(symbolsMeta.loading && symbols.length === 0) || visibleSymbols.length === 0}
              >
                {visibleSymbols.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.description}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              type="submit"
              className="inv-submit"
              disabled={loading || !symbol.trim() || visibleSymbols.length === 0}
              style={{ minWidth: 140 }}
            >
              {loading ? <RefreshCw size={16} className="sp-spin" /> : <Search size={16} />}
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>
      </form>

      {data && (
        <div style={{ padding: '0 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* Prediction */}
            <div className="sp-kpi" style={{ borderTop: \`3px solid \${predColor(data.prediction?.label)}\` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'DM Mono', monospace" }}>
                Prediction
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: predColor(data.prediction?.label) }}>
                {data.prediction?.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 6 }}>
                Confidence ~{data.prediction?.confidence}% · {data.prediction?.horizon}
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>
                {data.prediction?.summary}
              </p>
            </div>

            {/* Risk */}
            <div className="sp-kpi" style={{ borderTop: \`3px solid \${riskColor(data.risk?.level)}\` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={18} style={{ color: riskColor(data.risk?.level) }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'DM Mono', monospace" }}>
                  Risk
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: riskColor(data.risk?.level) }}>{data.risk?.level}</div>
              <div style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 6 }}>
                Score {data.risk?.score}/100
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>{data.risk?.disclaimer}</p>
            </div>

            {/* Profit */}
            <div className="sp-kpi" style={{ borderTop: '3px solid var(--blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp size={18} style={{ color: 'var(--blue)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'DM Mono', monospace" }}>
                  Profit outlook
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize', color: 'var(--text)' }}>
                {data.profit?.outlook || '—'}
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 10, lineHeight: 1.5 }}>
                {data.profit?.note}
              </p>
            </div>
          </div>

          <div className="inv-card" style={{ margin: '0 0 20px', padding: '1.5rem' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '1.2rem', fontFamily: "'DM Serif Display', serif" }}>{data.name} <span style={{color: 'var(--blue)', fontFamily: "'DM Mono', monospace", fontSize: '1rem' }}>({data.symbol})</span></div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              {data.exchange || '—'} · {data.currency || 'USD'}
            </div>
          </div>

          <div className="inv-card" style={{ margin: 0, padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Newspaper size={20} style={{ color: 'var(--blue)' }} />
              <span style={{ fontWeight: 600, fontFamily: "'Instrument Sans', sans-serif" }}>Latest news</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>(Finnhub company feed)</span>
            </div>
            {!data.news?.length ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>No headlines returned for this symbol right now.</div>
            ) : (
              <div className="sp-news-list">
                {data.news.map((article) => (
                  <div key={article.id || article.url} className="sp-news-item">
                    {article.image && (
                      <img src={article.image} alt="" className="sp-news-img" onError={(e) => { e.target.style.display = 'none'; }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sp-news-meta">
                        <span>{article.source}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ClockIcon size={10} /> {timeAgo(article.datetime)}
                        </span>
                      </div>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="sp-news-headline">
                        {article.headline}
                        <ExternalLink size={12} style={{ marginLeft: 6, opacity: 0.6 }} />
                      </a>
                      {article.summary && (
                        <p style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 6, lineHeight: 1.45 }}>
                          {article.summary.length > 220 ? \`\${article.summary.slice(0, 220)}…\` : article.summary}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'frontend/src/pages/StockSummary.jsx'), summaryCode);
console.log('Created StockSummary.jsx');
