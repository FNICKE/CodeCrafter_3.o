import { useEffect, useState } from 'react';
import { getWatchlist, getQuote, searchSymbol, getCandles } from '../api';
import StockCard from '../components/StockCard';
import {
  Search, TrendingUp, TrendingDown, Clock, Activity,
  BarChart3, X, ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';

/* ─── Shared theme injected once ────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  .mkt-root {
    --blue:        #3b9eff;
    --blue-dim:    #1a7ee0;
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
  .mkt-ticker-wrap { overflow: hidden; background: var(--surface); border-bottom: 1px solid var(--border); }
  .mkt-ticker-inner { display: flex; width: max-content; animation: mktTick 40s linear infinite; }
  .mkt-ticker-inner:hover { animation-play-state: paused; }
  @keyframes mktTick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .mkt-ticker-item { padding: 5px 1.75rem; font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: .04em; white-space: nowrap; }
  .mkt-ticker-item.up   { color: var(--blue); }
  .mkt-ticker-item.down { color: var(--red); }

  /* Hero */
  .mkt-hero { position: relative; padding: 3rem 0 2.25rem; overflow: hidden; }
  .mkt-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 55% 80% at 5% 60%, rgba(59,158,255,.08) 0%, transparent 70%),
      radial-gradient(ellipse 35% 60% at 95% 15%, rgba(59,158,255,.04) 0%, transparent 70%);
    pointer-events: none;
  }
  .mkt-hero-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(var(--border) 1px, transparent 1px),
                      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 75% 100% at 5% 60%, black 20%, transparent 80%);
    opacity: .35;
  }
  .mkt-eyebrow { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: .18em; text-transform: uppercase; color: var(--blue); margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
  .mkt-eyebrow::before { content: ''; width: 2rem; height: 1px; background: var(--blue); display: inline-block; }
  .mkt-title { font-family: 'DM Serif Display', serif; font-size: clamp(2.4rem, 5vw, 4.2rem); line-height: 1.05; letter-spacing: -.02em; margin: 0; }
  .mkt-title em { font-style: italic; color: var(--blue); }
  .mkt-subtitle { color: var(--muted2); font-size: .95rem; margin-top: .65rem; line-height: 1.6; }
  .mkt-live { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 0 0 rgba(59,158,255,.6); animation: mktPulse 2s ease-out infinite; flex-shrink: 0; }
  @keyframes mktPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,158,255,.6) } 50% { box-shadow: 0 0 0 6px rgba(59,158,255,0) } }

  /* Search */
  .mkt-search-box { display: flex; align-items: center; gap: .6rem; padding: .65rem 1rem; border-radius: .875rem; border: 1px solid var(--border); background: var(--surface2); transition: border-color .2s, box-shadow .2s; }
  .mkt-search-box:focus-within { border-color: var(--blue-border); box-shadow: 0 0 0 3px var(--blue-glow); }
  .mkt-search-input { flex: 1; border: none; background: transparent; color: var(--text); font-size: .9rem; outline: none; font-family: 'Instrument Sans', sans-serif; }
  .mkt-search-input::placeholder { color: var(--muted); }
  .mkt-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: var(--surface2); border: 1px solid var(--border); border-radius: 1rem; z-index: 50; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,.45); }
  .mkt-dropdown-item { width: 100%; text-align: left; padding: .75rem 1rem; border: none; background: transparent; color: var(--text); display: flex; align-items: center; gap: .75rem; cursor: pointer; border-bottom: 1px solid var(--border); transition: background .15s; }
  .mkt-dropdown-item:last-child { border-bottom: none; }
  .mkt-dropdown-item:hover { background: var(--surface3); }
  .mkt-sym { font-family: 'DM Mono', monospace; font-size: .8rem; font-weight: 500; color: var(--blue); min-width: 60px; }
  .mkt-desc { font-size: .8rem; color: var(--muted2); }

  /* Quote block */
  .mkt-quote-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; overflow: hidden; margin-bottom: 2rem; transition: border-color .25s; }
  .mkt-quote-card:hover { border-color: var(--blue-border); }
  .mkt-quote-hdr { padding: 1.5rem 1.5rem 0; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
  .mkt-price-big { font-family: 'DM Mono', monospace; font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 500; color: var(--text); line-height: 1; }
  .mkt-change-badge { display: inline-flex; align-items: center; gap: .4rem; padding: .35rem .85rem; border-radius: .75rem; font-family: 'DM Mono', monospace; font-size: .82rem; font-weight: 500; }
  .mkt-change-badge.up   { background: rgba(52,211,153,.1); border: 1px solid rgba(52,211,153,.25); color: var(--green); }
  .mkt-change-badge.down { background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.25); color: var(--red); }

  .mkt-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border-top: 1px solid var(--border); }
  @media (max-width: 640px) { .mkt-stats-grid { grid-template-columns: repeat(2, 1fr); } }
  .mkt-stat-cell { padding: .875rem 1.25rem; background: var(--surface); }
  .mkt-stat-lbl { font-family: 'DM Mono', monospace; font-size: .6rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); }
  .mkt-stat-val { font-family: 'DM Mono', monospace; font-size: .95rem; font-weight: 500; color: var(--text); margin-top: .25rem; }

  /* Range buttons */
  .mkt-range-wrap { display: flex; gap: .35rem; background: var(--surface2); padding: .3rem; border-radius: .75rem; border: 1px solid var(--border); }
  .mkt-range-btn { padding: .35rem .85rem; border-radius: .5rem; border: none; font-size: .75rem; font-weight: 700; cursor: pointer; transition: all .2s; background: transparent; color: var(--muted2); font-family: 'DM Mono', monospace; }
  .mkt-range-btn.active { background: var(--blue); color: #fff; box-shadow: 0 2px 8px rgba(59,158,255,.35); }
  .mkt-range-btn:not(.active):hover { color: var(--text); background: var(--surface3); }

  /* Chart section */
  .mkt-chart-section { padding: 1.25rem 1.5rem 1.5rem; }
  .mkt-chart-subhdr { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.25rem; }
  .mkt-chart-label { font-family: 'DM Mono', monospace; font-size: .7rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); display: flex; align-items: center; gap: .4rem; }
  .mkt-chart-empty { height: 300px; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--border); border-radius: 1rem; color: var(--muted); font-size: .85rem; }

  /* Watchlist section */
  .mkt-section-hdr { display: flex; align-items: center; gap: .625rem; margin-bottom: 1.25rem; }
  .mkt-section-title { font-family: 'DM Serif Display', serif; font-size: 1.5rem; }
  .mkt-watchlist-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 1rem; }
  .mkt-skel { background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; position: relative; overflow: hidden; }
  .mkt-skel::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,.04) 50%, transparent 70%); background-size: 200% 100%; animation: mktShim 1.6s ease-in-out infinite; }
  @keyframes mktShim { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }

  @keyframes mktFadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  .mkt-fade { animation: mktFadeUp .4s ease both; }

  .mkt-divider { height: 1px; background: var(--border); margin: 0; }
`;

const TICKER_ITEMS = ['AAPL +1.2%','MSFT +0.8%','NVDA +3.4%','GOOGL -0.3%','AMZN +1.7%','META +2.1%','TSLA -1.4%','JPM +0.6%','V +0.4%','MA +0.9%','BRK.B +0.2%','XOM -0.7%'];

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = css;
  document.head.appendChild(s);
}

function TickerTape() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="mkt-ticker-wrap">
      <div className="mkt-ticker-inner">
        {items.map((t, i) => (
          <span key={i} className={`mkt-ticker-item ${t.includes('-') ? 'down' : 'up'}`}>
            {t} <span style={{ color: 'var(--border)', marginLeft: '1rem' }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const RANGES = [
  { id: '1d',  label: '1D' },
  { id: '5d',  label: '1W' },
  { id: '1mo', label: '1M' },
  { id: '6mo', label: '6M' },
  { id: '1y',  label: '1Y' },
];

export default function Market() {
  useEffect(() => { injectStyles('mkt-styles', CSS); }, []);

  const [watchlist,     setWatchlist]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searchQ,       setSearchQ]       = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSymbol,setSelectedSymbol]= useState('AAPL');
  const [quoteData,     setQuoteData]     = useState(null);
  const [candleData,    setCandleData]    = useState([]);
  const [range,         setRange]         = useState('1mo');
  const [chartLoading,  setChartLoading]  = useState(false);

  useEffect(() => {
    getWatchlist().then(r => setWatchlist(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSymbol) return;
    setQuoteData(null);
    getQuote(selectedSymbol).then(r => setQuoteData(r.data)).catch(console.error);
  }, [selectedSymbol]);

  useEffect(() => {
    if (!selectedSymbol) return;
    setChartLoading(true);
    getCandles(selectedSymbol, { range })
      .then(r => {
        if (r.data.t && r.data.c) {
          const mapped = [];
          for (let i = 0; i < r.data.t.length; i++) {
            const price = r.data.c[i];
            if (price !== null) {
              const d = new Date(r.data.t[i] * 1000);
              const label = (range === '1d' || range === '5d')
                ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              mapped.push({ date: label, price });
            }
          }
          setCandleData(mapped);
        }
      })
      .catch(() => setCandleData([]))
      .finally(() => setChartLoading(false));
  }, [selectedSymbol, range]);

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await searchSymbol(q);
      setSearchResults(res.data.result?.slice(0, 6) || []);
    } catch { setSearchResults([]); }
  };

  const dpUp    = (quoteData?.dp ?? 0) >= 0;
  const lineClr = dpUp ? '#34d399' : '#f87171';

  return (
    <div className="mkt-root">
      <TickerTape />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Hero */}
        <div className="mkt-hero">
          <div className="mkt-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="mkt-eyebrow"><span className="mkt-live" /> Live Price Data</div>
            <h1 className="mkt-title">Market<br /><em>Explorer</em></h1>
            <p className="mkt-subtitle">Live high-resolution charts, quotes &amp; symbol screening</p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 500, marginBottom: '2rem' }}>
          <div className="mkt-search-box">
            <Search size={16} color="var(--blue)" />
            <input
              className="mkt-search-input"
              placeholder="Search any symbol — TSLA, INTC, Apple…"
              value={searchQ}
              onChange={e => handleSearch(e.target.value)}
              autoComplete="off"
            />
            {searchQ && (
              <button onClick={() => { setSearchQ(''); setSearchResults([]); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="mkt-dropdown">
              {searchResults.map((r, i) => (
                <button key={i} className="mkt-dropdown-item"
                  onClick={() => { setSelectedSymbol(r.symbol); setSearchQ(''); setSearchResults([]); }}>
                  <span className="mkt-sym">{r.symbol}</span>
                  <span className="mkt-desc">{r.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quote + Chart card */}
        {selectedSymbol && (
          <div className="mkt-quote-card mkt-fade">
            {/* Header */}
            <div className="mkt-quote-hdr">
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--blue)', marginBottom: '.5rem' }}>
                  {selectedSymbol}
                </div>
                {quoteData ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                    <span className="mkt-price-big">${quoteData.c?.toFixed(2)}</span>
                    <span className={`mkt-change-badge ${dpUp ? 'up' : 'down'}`}>
                      {dpUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {quoteData.d >= 0 ? '+' : ''}{quoteData.d?.toFixed(2)} ({quoteData.dp?.toFixed(2)}%)
                    </span>
                  </div>
                ) : (
                  <div style={{ width: 220, height: 42, background: 'var(--surface2)', borderRadius: '.75rem', animation: 'mktShim 1.6s ease-in-out infinite' }} />
                )}
              </div>
            </div>

            {/* Stats row */}
            {quoteData && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '1.25rem 0 0' }} />
                <div className="mkt-stats-grid">
                  {[['Open', quoteData.o], ['Prev Close', quoteData.pc], ['Day High', quoteData.h], ['Day Low', quoteData.l]].map(([l, v]) => (
                    <div key={l} className="mkt-stat-cell">
                      <div className="mkt-stat-lbl">{l}</div>
                      <div className="mkt-stat-val">${v?.toFixed(2) || '—'}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mkt-divider" />

            {/* Chart */}
            <div className="mkt-chart-section">
              <div className="mkt-chart-subhdr">
                <div className="mkt-chart-label">
                  <Clock size={13} color="var(--blue)" />
                  Real-Time &amp; Historical
                </div>
                <div className="mkt-range-wrap">
                  {RANGES.map(r => (
                    <button key={r.id} onClick={() => setRange(r.id)} className={`mkt-range-btn ${range === r.id ? 'active' : ''}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {chartLoading ? (
                <div style={{ height: 300, background: 'var(--surface2)', borderRadius: '1rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,.04) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: 'mktShim 1.6s ease-in-out infinite' }} />
                </div>
              ) : candleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={candleData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={lineClr} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={lineClr} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.03)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#5a6878', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                    <YAxis tick={{ fill: '#5a6878', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} domain={['auto','auto']} tickFormatter={v => `$${v.toFixed(1)}`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '.875rem', color: 'var(--text)', fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}
                      itemStyle={{ color: 'var(--blue)', fontFamily: "'DM Mono', monospace" }}
                      formatter={v => [`$${v.toFixed(2)}`, 'Price']}
                      labelStyle={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 11, marginBottom: 4 }}
                    />
                    <Area type="monotone" dataKey="price" stroke={lineClr} strokeWidth={2.5} fill="url(#mktGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: lineClr }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="mkt-chart-empty">Chart data unavailable for {selectedSymbol} in this range</div>
              )}
            </div>
          </div>
        )}

        {/* Watchlist */}
        <div className="mkt-section-hdr">
          <BarChart3 size={20} color="var(--blue)" />
          <h2 className="mkt-section-title">Market Movers <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Watchlist</em></h2>
        </div>
        <div className="mkt-watchlist-grid">
          {loading
            ? [1,2,3,4,5,6,7,8].map(i => <div key={i} className="mkt-skel" style={{ height: 110 }} />)
            : watchlist.map((s, i) => (
                <div key={s.symbol} className="mkt-fade" style={{ animationDelay: `${i * 0.04}s` }}>
                  <StockCard {...s} onClick={() => { setSelectedSymbol(s.symbol); window.scrollTo(0, 0); }} />
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}