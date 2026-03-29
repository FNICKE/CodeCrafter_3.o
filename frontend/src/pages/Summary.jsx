import { useState, useEffect, useMemo } from 'react';
import { getStockSummary, getStockSymbols, getWatchlist } from '../api';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Newspaper,
  Search,
  Loader2,
  ExternalLink,
  Clock,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

function timeAgo(ts) {
  if (!ts) return '';
  const sec = typeof ts === 'number' ? ts : parseInt(ts, 10);
  const diff = Math.floor(Date.now() / 1000 - sec);
  if (diff < 120) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const predColor = (label) => {
  const l = (label || '').toLowerCase();
  if (l.includes('bull')) return 'var(--accent-green)';
  if (l.includes('bear')) return 'var(--accent-red)';
  return 'var(--accent-amber)';
};

const riskColor = (level) => {
  const l = (level || '').toLowerCase();
  if (l.startsWith('high')) return 'var(--accent-red)';
  if (l.includes('medium')) return 'var(--accent-amber)';
  return 'var(--accent-green)';
};

const EXCHANGE_OPTIONS = [{ code: 'US', label: 'United States (US)' }];

export default function Summary() {
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
    getWatchlist()
      .then((r) => setWatchlist(Array.isArray(r.data) ? r.data : []))
      .catch(() => setWatchlist([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setSymbolsMeta((m) => ({ ...m, loading: true, error: null }));
      try {
        const res = await getStockSymbols({ exchange });
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
          toast.error('Could not load stock list.');
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [exchange]);

  /** Full API list, optionally narrowed by filter (same idea as Portfolio search, but data is local). */
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
      toast.error('Choose a stock from the list (adjust the filter if needed).');
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const res = await getStockSummary(s);
      setData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load summary';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={28} style={{ color: 'var(--accent-cyan)' }} />
          Stock Summary
        </h1>
        <p className="page-subtitle">
          Prediction, latest headlines, risk level, and profit outlook — powered by live Finnhub data (not financial advice).
        </p>
      </div>

      <form onSubmit={run} className="card" style={{ marginBottom: 24 }}>
        {symbolsMeta.warning && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              fontSize: 13,
              color: 'var(--text-secondary)',
              background: 'rgba(212,165,116,0.12)',
              border: '1px solid rgba(212,165,116,0.28)',
            }}
          >
            {symbolsMeta.warning}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 200px' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Market</label>
            <select
              className="input"
              value={exchange}
              onChange={(e) => { setExchange(e.target.value); setSymbolFilter(''); }}
              style={{ width: '100%' }}
              id="summary-exchange"
            >
              {EXCHANGE_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>{o.label}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Search (optional)
              {symbolsMeta.count > 0 && (
                <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                  {' '}
                  — showing {visibleSymbols.length} of {symbolsMeta.count} loaded
                </span>
              )}
            </label>
            <input
              className="input"
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
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Quick pick (watchlist)</label>
            <select
              className="input"
              value={watchlistSelection}
              onChange={handleWatchlistPick}
              style={{ width: '100%', cursor: 'pointer' }}
              id="summary-watchlist-select"
            >
              <option value="">— Same as Portfolio —</option>
              {watchlist.map((w) => (
                <option key={w.symbol} value={w.symbol}>
                  {w.symbol}
                  {w.current != null ? `  ~$${Number(w.current).toFixed(2)}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              All stocks (API)
              {symbolsMeta.loading && (
                <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading list…
                </span>
              )}
              {symbolsMeta.error && (
                <span style={{ color: 'var(--accent-red)', marginLeft: 8 }}>{symbolsMeta.error}</span>
              )}
            </label>
            {visibleSymbols.length === 0 && symbolFilter.trim() ? (
              <div className="input" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                No symbols match “{symbolFilter.trim()}”. Clear search to see the full list.
              </div>
            ) : (
              <select
                className="input"
                value={visibleSymbols.some((s) => s.symbol === symbol) ? symbol : visibleSymbols[0]?.symbol || ''}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  setWatchlistSelection('');
                }}
                style={{ width: '100%', cursor: 'pointer' }}
                id="summary-symbol-select"
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
              className="btn btn-primary"
              disabled={loading || !symbol.trim() || visibleSymbols.length === 0}
              style={{ minWidth: 140 }}
            >
              {loading ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={18} />}
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, marginBottom: 0 }}>
          Same flow as Portfolio: quick watchlist + one dropdown with the <strong>full</strong> deduped US list from Finnhub (<code style={{ fontSize: 10 }}>/stock/symbol</code>), server-cached ~6h. Use search to narrow the dropdown; no manual ticker field.
        </p>
      </form>

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div className="card" style={{ borderLeft: `3px solid ${predColor(data.prediction?.label)}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Prediction
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: predColor(data.prediction?.label) }}>
                {data.prediction?.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
                Confidence ~{data.prediction?.confidence}% · {data.prediction?.horizon}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
                {data.prediction?.summary}
              </p>
              <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)' }}>
                {(data.prediction?.drivers || []).map((d, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{d}</li>
                ))}
              </ul>
              {data.prediction?.signalsUsed && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Score contributions (points)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <span>Momentum</span><span>{data.prediction.signalsUsed.momentumPoints}</span>
                    <span>Analyst mix</span><span>{data.prediction.signalsUsed.analystPoints}</span>
                    <span>Finnhub sentiment</span><span>{data.prediction.signalsUsed.finnhubSentimentPoints}</span>
                    <span>Headline keywords</span><span>{data.prediction.signalsUsed.headlineLexiconPoints}</span>
                    <span>Buzz adj.</span><span>{data.prediction.signalsUsed.buzzAdjustPoints}</span>
                  </div>
                </div>
              )}
              {data.prediction?.methodology && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
                  {data.prediction.methodology} {data.prediction.limitation}
                </p>
              )}
            </div>

            <div className="card" style={{ borderLeft: `3px solid ${riskColor(data.risk?.level)}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={18} style={{ color: riskColor(data.risk?.level) }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Risk
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: riskColor(data.risk?.level) }}>{data.risk?.level}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
                Score {data.risk?.score}/100
              </div>
              <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)' }}>
                {(data.risk?.factors || []).map((f, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{f}</li>
                ))}
              </ul>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>{data.risk?.disclaimer}</p>
            </div>

            <div className="card" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp size={18} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Profit outlook
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                {data.profit?.outlook || '—'}
              </div>
              {data.profit?.upsideVsMeanTargetPercent != null && (
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8, color: data.profit.upsideVsMeanTargetPercent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {data.profit.upsideVsMeanTargetPercent >= 0 ? '+' : ''}{data.profit.upsideVsMeanTargetPercent.toFixed(1)}% vs mean target
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.5 }}>
                {data.profit?.note}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{data.profit?.disclaimer}</p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{data.name} ({data.symbol})</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              {data.exchange || '—'} · {data.currency || 'USD'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last</span>
                <div style={{ fontSize: 20, fontWeight: 700 }}>${Number(data.quote?.current).toFixed(2)}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Change</span>
                <div style={{ fontSize: 16, fontWeight: 600, color: (data.quote?.changePercent ?? 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {data.quote?.changePercent != null ? `${data.quote.changePercent >= 0 ? '+' : ''}${data.quote.changePercent.toFixed(2)}%` : '—'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Prev close</span>
                <div style={{ fontSize: 16 }}>${data.quote?.previousClose != null ? Number(data.quote.previousClose).toFixed(2) : '—'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Newspaper size={20} style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontWeight: 600 }}>Latest news</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>(Finnhub company feed, last 7 days)</span>
            </div>
            {!data.news?.length ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No headlines returned for this symbol right now.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.news.map((article) => (
                  <div
                    key={article.id || article.url}
                    style={{
                      display: 'flex',
                      gap: 14,
                      paddingBottom: 12,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {article.image && (
                      <img
                        src={article.image}
                        alt=""
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{article.source}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                          <Clock size={10} /> {timeAgo(article.datetime)}
                        </span>
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}
                      >
                        {article.headline}
                        <ExternalLink size={12} style={{ marginLeft: 6, verticalAlign: 'middle', opacity: 0.6 }} />
                      </a>
                      {article.summary && (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.45 }}>
                          {article.summary.length > 220 ? `${article.summary.slice(0, 220)}…` : article.summary}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(212,165,116,0.08)', border: '1px solid rgba(212,165,116,0.2)' }}>
            <Shield size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Predictions combine momentum, analyst recommendation mix, and Finnhub news sentiment. They are educational only and can be wrong — always do your own research before trading.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
