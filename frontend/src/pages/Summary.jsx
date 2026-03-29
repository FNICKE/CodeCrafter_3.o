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
  if (l.includes('bull')) return 'var(--green)';
  if (l.includes('bear')) return 'var(--red)';
  return '#f59e0b'; // amber
};

const riskColor = (level) => {
  const l = (level || '').toLowerCase();
  if (l.startsWith('high')) return 'var(--red)';
  if (l.includes('medium')) return '#f59e0b'; // amber
  return 'var(--green)';
};

const EXCHANGE_OPTIONS = [{ code: 'US', label: 'United States (US)' }];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  .sum-root {
    --blue:        #3b9eff;
    --blue-glow:   rgba(59,158,255,.14);
    --blue-border: rgba(59,158,255,.22);
    --obsidian:    #080b0f;
    --surface:     #0e1318;
    --surface2:    #141b22;
    --surface3:    #1c2630;
    --border:      rgba(255,255,255,.06);
    --text:        #e8edf2;
    --muted:       #5a6878;
    --muted2:      #8a9ab0;
    --green:       #34d399;
    --red:         #f87171;
    font-family: 'Instrument Sans', sans-serif;
    background: var(--obsidian);
    color: var(--text);
    min-height: 100vh;
    padding-bottom: 4rem;
  }

  /* Ticker */
  .sum-ticker-wrap { overflow: hidden; background: var(--surface); border-bottom: 1px solid var(--border); }
  .sum-ticker-inner { display: flex; width: max-content; animation: sumTick 42s linear infinite; }
  .sum-ticker-inner:hover { animation-play-state: paused; }
  @keyframes sumTick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .sum-ticker-item { padding: 5px 1.75rem; font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: .04em; white-space: nowrap; }
  .sum-ticker-item.up { color: var(--blue); } .sum-ticker-item.dn { color: var(--red); }

  /* Hero */
  .sum-hero { position: relative; padding: 3rem 0 2.25rem; overflow: hidden; }
  .sum-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 55% 80% at 5% 60%, rgba(59,158,255,.08) 0%, transparent 70%); pointer-events: none; }
  .sum-hero-grid { position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 75% 100% at 5% 60%, black 20%, transparent 80%); opacity: .35; }
  .sum-eyebrow { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: .18em; text-transform: uppercase; color: var(--blue); margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
  .sum-eyebrow::before { content: ''; width: 2rem; height: 1px; background: var(--blue); display: inline-block; }
  .sum-title { font-family: 'DM Serif Display', serif; font-size: clamp(2.4rem, 5vw, 4.2rem); line-height: 1.05; letter-spacing: -.02em; margin: 0; }
  .sum-title em { font-style: italic; color: var(--blue); }
  .sum-subtitle { color: var(--muted2); font-size: .95rem; margin-top: .65rem; line-height: 1.6; }
  .sum-live { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); animation: sumPulse 2s ease-out infinite; flex-shrink: 0; }
  @keyframes sumPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,158,255,.6) } 50% { box-shadow: 0 0 0 6px rgba(59,158,255,0) } }

  /* Cards */
  .sum-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; overflow: hidden; margin-bottom: 1.5rem; transition: border-color .25s; padding: 1.5rem; }
  .sum-card:hover { border-color: var(--blue-border); }
  .sum-card-hdr { padding: 0 0 1.25rem 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: .625rem; margin-bottom: 1.25rem; }
  .sum-card-title { font-family: 'DM Serif Display', serif; font-size: 1.3rem; }

  /* Form */
  .sum-input { width: 100%; padding: .6rem 1rem; background: var(--surface2); border: 1px solid var(--border); border-radius: .75rem; color: var(--text); font-size: .875rem; outline: none; font-family: 'Instrument Sans', sans-serif; transition: border-color .2s, box-shadow .2s; }
  .sum-input:focus { border-color: var(--blue-border); box-shadow: 0 0 0 3px var(--blue-glow); }
  .sum-input:disabled { opacity: 0.6; cursor: not-allowed; }
  .sum-input::placeholder { color: var(--muted); }
  
  .sum-btn-primary { display: inline-flex; justify-content: center; align-items: center; gap: .4rem; padding: .625rem 1.25rem; background: var(--blue); color: #fff; border: none; border-radius: .75rem; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s; font-family: 'Instrument Sans', sans-serif; }
  .sum-btn-primary:hover:not(:disabled) { background: var(--blue-dim, #1a7ee0); box-shadow: 0 4px 16px rgba(59,158,255,.3); }
  .sum-btn-primary:disabled { opacity: .45; cursor: not-allowed; }

  @keyframes sumFadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  .sum-fade { animation: sumFadeUp .4s ease both; }
`;

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

const TICKER_ITEMS = ['AAPL +1.2%','MSFT +0.8%','NVDA +3.4%','GOOGL -0.3%','AMZN +1.7%','META +2.1%','TSLA -1.4%'];

export default function Summary() {
  useEffect(() => { injectStyles('sum-styles', CSS); }, []);

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

  const tickerItemsList = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="sum-root">
      {/* Ticker */}
      <div className="sum-ticker-wrap">
        <div className="sum-ticker-inner">
          {tickerItemsList.map((t, i) => (
            <span key={i} className={`sum-ticker-item ${t.includes('-') ? 'dn' : 'up'}`}>
              {t} <span style={{ color: 'var(--border)', marginLeft: '1rem' }}>|</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.25rem' }}>
        {/* Hero */}
        <div className="sum-hero">
          <div className="sum-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="sum-eyebrow"><span className="sum-live" /> AI Analysis</div>
            <h1 className="sum-title">Stock<br /><em>Summary</em></h1>
            <p className="sum-subtitle">Prediction, latest headlines, risk level, and profit outlook — powered by live Finnhub data (not financial advice).</p>
          </div>
        </div>

        <div className="sum-fade">
          <form onSubmit={run} className="sum-card" style={{ marginBottom: 24 }}>
            {symbolsMeta.warning && (
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 10,
                  fontSize: 13,
                  color: '#f59e0b',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}
              >
                {symbolsMeta.warning}
              </div>
            )}
            <div style={{ display: 'none', flexWrap: 'wrap', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
              <div style={{ flex: '0 0 200px' }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>Market</label>
                <select
                  className="sum-input"
                  value={exchange}
                  onChange={(e) => { setExchange(e.target.value); setSymbolFilter(''); }}
                  id="summary-exchange"
                  style={{ cursor: 'pointer' }}
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
                    <span style={{ fontWeight: 400, color: 'var(--muted2)', textTransform: 'none', letterSpacing: 'normal', fontFamily: "'Instrument Sans', sans-serif" }}>
                      {' '}
                      — showing {visibleSymbols.length} of {symbolsMeta.count} loaded
                    </span>
                  )}
                </label>
                <input
                  className="sum-input"
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  placeholder="Type symbol or company name to narrow…"
                  disabled={symbolsMeta.loading}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: '0 0 220px', minWidth: 0 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>Quick pick (watchlist)</label>
                <select
                  className="sum-input"
                  value={watchlistSelection}
                  onChange={handleWatchlistPick}
                  style={{ cursor: 'pointer' }}
                  id="summary-watchlist-select"
                >
                  <option value="">Stocks</option>
                  {watchlist.map((w) => (
                    <option key={w.symbol} value={w.symbol}>
                      {w.symbol}
                      {w.current != null ? `  ~$${Number(w.current).toFixed(2)}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>
                  All stocks (API)
                  {symbolsMeta.loading && (
                    <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--blue)', textTransform: 'none', letterSpacing: 'normal', fontFamily: "'Instrument Sans', sans-serif" }}>
                      <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading list…
                    </span>
                  )}
                  {symbolsMeta.error && (
                    <span style={{ color: 'var(--red)', marginLeft: 8, textTransform: 'none', letterSpacing: 'normal', fontFamily: "'Instrument Sans', sans-serif" }}>{symbolsMeta.error}</span>
                  )}
                </label>
                {visibleSymbols.length === 0 && symbolFilter.trim() ? (
                  <div className="sum-input" style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', background: 'var(--surface2)' }}>
                    No symbols match “{symbolFilter.trim()}”. Clear search to see the full list.
                  </div>
                ) : (
                  <select
                    className="sum-input"
                    value={visibleSymbols.some((s) => s.symbol === symbol) ? symbol : visibleSymbols[0]?.symbol || ''}
                    onChange={(e) => {
                      setSymbol(e.target.value);
                      setWatchlistSelection('');
                    }}
                    style={{ cursor: 'pointer' }}
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
                  className="sum-btn-primary"
                  disabled={loading || !symbol.trim() || visibleSymbols.length === 0}
                  style={{ minWidth: 140, height: 42 }}
                >
                  {loading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={16} />}
                  {loading ? 'Analyzing…' : 'Analyze'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, marginBottom: 0 }}>
              Same flow as Portfolio: quick watchlist + one dropdown with the <strong>full</strong> deduped US list from Finnhub (<code style={{ fontSize: 10, background: 'var(--surface2)', padding: '2px 4px', borderRadius: 4 }}>/stock/symbol</code>), server-cached ~6h. Use search to narrow the dropdown; no manual ticker field.
            </p>
          </form>

          {data && (
            <div className="sum-fade" style={{ animationDelay: '0.1s' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div className="sum-card" style={{ borderLeft: `3px solid ${predColor(data.prediction?.label)}`, margin: 0 }}>
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
                  <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 12, color: 'var(--muted2)' }}>
                    {(data.prediction?.drivers || []).map((d, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{d}</li>
                    ))}
                  </ul>
                  {data.prediction?.signalsUsed && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--muted2)', marginBottom: 6 }}>Score contributions (points)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                        <span>Momentum</span><span style={{color: 'var(--text)'}}>{data.prediction.signalsUsed.momentumPoints}</span>
                        <span>Analyst mix</span><span style={{color: 'var(--text)'}}>{data.prediction.signalsUsed.analystPoints}</span>
                        <span>Finnhub sent</span><span style={{color: 'var(--text)'}}>{data.prediction.signalsUsed.finnhubSentimentPoints}</span>
                        <span>Headlines</span><span style={{color: 'var(--text)'}}>{data.prediction.signalsUsed.headlineLexiconPoints}</span>
                        <span>Buzz adj.</span><span style={{color: 'var(--text)'}}>{data.prediction.signalsUsed.buzzAdjustPoints}</span>
                      </div>
                    </div>
                  )}
                  {data.prediction?.methodology && (
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>
                      {data.prediction.methodology} {data.prediction.limitation}
                    </p>
                  )}
                </div>

                <div className="sum-card" style={{ borderLeft: `3px solid ${riskColor(data.risk?.level)}`, margin: 0 }}>
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
                  <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 12, color: 'var(--muted2)' }}>
                    {(data.risk?.factors || []).map((f, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{f}</li>
                    ))}
                  </ul>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>{data.risk?.disclaimer}</p>
                </div>

                <div className="sum-card" style={{ borderLeft: '3px solid var(--blue)', margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <TrendingUp size={18} style={{ color: 'var(--blue)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'DM Mono', monospace" }}>
                      Profit outlook
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize', color: 'var(--text)' }}>
                    {data.profit?.outlook || '—'}
                  </div>
                  {data.profit?.upsideVsMeanTargetPercent != null && (
                    <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8, color: data.profit.upsideVsMeanTargetPercent >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {data.profit.upsideVsMeanTargetPercent >= 0 ? '+' : ''}{data.profit.upsideVsMeanTargetPercent.toFixed(1)}% vs mean target
                    </div>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 10, lineHeight: 1.5 }}>
                    {data.profit?.note}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{data.profit?.disclaimer}</p>
                </div>
              </div>

              <div className="sum-card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem' }}>{data.name} <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--blue)', fontSize: '1rem' }}>({data.symbol})</span></div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                  {data.exchange || '—'} · {data.currency || 'USD'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>Last</span>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>${Number(data.quote?.current).toFixed(2)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>Change</span>
                    <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: (data.quote?.changePercent ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {data.quote?.changePercent != null ? `${data.quote.changePercent >= 0 ? '+' : ''}${data.quote.changePercent.toFixed(2)}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>Prev close</span>
                    <div style={{ fontSize: 20, fontFamily: "'DM Mono', monospace" }}>${data.quote?.previousClose != null ? Number(data.quote.previousClose).toFixed(2) : '—'}</div>
                  </div>
                </div>
              </div>

              <div className="sum-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Newspaper size={20} color="var(--blue)" />
                  <span style={{ fontWeight: 600 }}>Latest news</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>(Finnhub company feed, last 7 days)</span>
                </div>
                {!data.news?.length ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>No headlines returned for this symbol right now.</div>
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
                            style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '0.875rem', flexShrink: 0 }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{article.source}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                              <Clock size={10} /> {timeAgo(article.datetime)}
                            </span>
                          </div>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}
                          >
                            {article.headline}
                            <ExternalLink size={12} style={{ marginLeft: 6, verticalAlign: 'middle', opacity: 0.6 }} />
                          </a>
                          {article.summary && (
                            <p style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 6, lineHeight: 1.45 }}>
                              {article.summary.length > 220 ? `${article.summary.slice(0, 220)}…` : article.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: 14, borderRadius: '0.875rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Shield size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5, margin: 0 }}>
                  Predictions combine momentum, analyst recommendation mix, and Finnhub news sentiment. They are educational only and can be wrong — always do your own research before trading.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
