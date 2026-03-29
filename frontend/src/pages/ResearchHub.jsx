import { useCallback, useEffect, useRef, useState } from 'react';
import { getNews, getMarketSentiment } from '../api';
import NewsCard from '../components/NewsCard';
import {
  Newspaper, TrendingUp, BarChart3, RefreshCw,
  AlertTriangle, ChevronLeft, ChevronRight,
  Zap, GitMerge, Rocket, Activity, Wifi, WifiOff,
} from 'lucide-react';

const PAGE_SIZE = 12;

const CATEGORIES = [
  { key: 'all',      label: 'All Markets', icon: Activity   },
  { key: 'general',  label: 'Market News', icon: BarChart3  },
  { key: 'earnings', label: 'Earnings',    icon: TrendingUp },
  { key: 'merger',   label: 'M&A',         icon: GitMerge   },
  { key: 'ipo',      label: 'IPO',         icon: Rocket     },
];

const TICKER_TAPE = [
  'AAPL +1.2%','MSFT +0.8%','NVDA +3.4%','GOOGL -0.3%','AMZN +1.7%',
  'META +2.1%','TSLA -1.4%','JPM +0.6%','V +0.4%','MA +0.9%',
  'BRK.B +0.2%','XOM -0.7%','UNH +1.1%','JNJ -0.5%','PG +0.3%',
];

/* ─── Cache ─────────────────────────────────────────────────────────────────── */
const newsCache = new Map();
const CACHE_TTL  = 3 * 60 * 1000;

function cacheKey(cat, pg) { return `${cat}-${pg}`; }
function cacheGet(cat, pg) {
  const e = newsCache.get(cacheKey(cat, pg));
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { newsCache.delete(cacheKey(cat, pg)); return null; }
  return e;
}
function cacheSet(cat, pg, data, pagination) {
  newsCache.set(cacheKey(cat, pg), { data, pagination, ts: Date.now() });
}

/* ─── Styles — blue palette (matching Dashboard/Market/Screener) ──────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  .rh-root {
    --blue:        #3b9eff;
    --blue-dim:    #1a7ee0;
    --blue-glow:   rgba(59,158,255,.14);
    --blue-border: rgba(59,158,255,.22);
    --amber:       #ffb347;
    --obsidian:    #080b0f;
    --surface:     #0e1318;
    --surface2:    #141b22;
    --surface3:    #1c2630;
    --border:      rgba(255,255,255,.06);
    --text:        #e8edf2;
    --muted:       #5a6878;
    --muted2:      #8a9ab0;
    --red:         #f87171;
    --green:       #34d399;
    font-family: 'Instrument Sans', sans-serif;
    background: var(--obsidian);
    color: var(--text);
    min-height: 100vh;
  }

  /* ── Ticker ──────────────────────────────────────────────────────────────── */
  .rh-ticker-wrap { overflow: hidden; background: var(--surface); border-bottom: 1px solid var(--border); }
  .rh-ticker-inner { display: flex; width: max-content; animation: rhTick 40s linear infinite; }
  .rh-ticker-inner:hover { animation-play-state: paused; }
  @keyframes rhTick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .rh-ticker-item { padding: 5px 2rem; font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: .04em; white-space: nowrap; color: var(--muted2); }
  .rh-ticker-item.up   { color: var(--blue); }
  .rh-ticker-item.down { color: var(--red);  }

  /* ── Hero ────────────────────────────────────────────────────────────────── */
  .rh-hero { position: relative; padding: 3rem 0 2rem; overflow: hidden; }
  .rh-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 60% 80% at 10% 50%, rgba(59,158,255,.08) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 90% 20%, rgba(59,158,255,.05) 0%, transparent 70%);
    pointer-events: none;
  }
  .rh-hero-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(var(--border) 1px, transparent 1px),
                      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 100% at 10% 50%, black 20%, transparent 80%);
    opacity: .4;
  }
  .rh-eyebrow { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: .18em; text-transform: uppercase; color: var(--blue); margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
  .rh-eyebrow::before { content: ''; width: 2rem; height: 1px; background: var(--blue); display: inline-block; }
  .rh-title { font-family: 'DM Serif Display', serif; font-size: clamp(2.8rem, 6vw, 5rem); line-height: 1.05; letter-spacing: -.02em; margin: 0; }
  .rh-title em { font-style: italic; color: var(--blue); }
  .rh-subtitle { color: var(--muted2); font-size: clamp(.9rem, 2vw, 1.05rem); margin-top: .75rem; max-width: 40ch; line-height: 1.6; }

  /* Live dot */
  .rh-live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 0 0 rgba(59,158,255,.6); animation: rhPulse 2s ease-out infinite; flex-shrink: 0; }
  @keyframes rhPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,158,255,.6) } 50% { box-shadow: 0 0 0 6px rgba(59,158,255,0) } }

  /* ── Sentiment bars ──────────────────────────────────────────────────────── */
  .rh-sent-bar  { height: 5px; border-radius: 99px; overflow: hidden; background: var(--surface3); }
  .rh-sent-fill { height: 100%; border-radius: 99px; transition: width .8s cubic-bezier(.4,0,.2,1); }

  /* ── Category tabs ───────────────────────────────────────────────────────── */
  .rh-cat-tab { padding: .55rem 1.1rem; border-radius: .75rem; font-size: .82rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all .2s; display: flex; align-items: center; gap: .4rem; white-space: nowrap; }
  .rh-cat-tab.active  { background: var(--blue); color: #fff; box-shadow: 0 0 20px var(--blue-glow), 0 0 40px rgba(59,158,255,.1); }
  .rh-cat-tab.inactive { background: var(--surface2); color: var(--muted2); border-color: var(--border); }
  .rh-cat-tab.inactive:hover { background: var(--surface3); color: var(--text); border-color: var(--blue-border); }

  /* ── Skeleton ────────────────────────────────────────────────────────────── */
  .rh-skel { border-radius: 1.25rem; background: var(--surface); border: 1px solid var(--border); overflow: hidden; position: relative; height: 360px; }
  .rh-skel::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,.04) 50%, transparent 70%); background-size: 200% 100%; animation: rhShim 1.6s ease-in-out infinite; }
  @keyframes rhShim { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }

  /* ── News grid ───────────────────────────────────────────────────────────── */
  .rh-news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 1.25rem; }
  @media (min-width: 1280px) { .rh-news-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 768px) and (max-width: 1279px) { .rh-news-grid { grid-template-columns: repeat(2, 1fr); } }

  /* ── Pagination ──────────────────────────────────────────────────────────── */
  .rh-pg-btn { display: flex; align-items: center; gap: .35rem; padding: .55rem 1.1rem; border-radius: .75rem; font-size: .8rem; font-weight: 600; border: 1px solid var(--border); background: var(--surface2); color: var(--muted2); cursor: pointer; transition: all .2s; }
  .rh-pg-btn:not(:disabled):hover { background: var(--surface3); color: var(--text); border-color: var(--blue-border); }
  .rh-pg-btn:disabled { opacity: .35; cursor: not-allowed; }
  .rh-pg-pill { width: 2.2rem; height: 2.2rem; border-radius: .6rem; font-size: .8rem; font-weight: 600; border: 1px solid var(--border); background: var(--surface2); color: var(--muted2); cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; font-family: 'DM Mono', monospace; }
  .rh-pg-pill:hover { background: var(--surface3); color: var(--text); border-color: var(--blue-border); }
  .rh-pg-pill.active { background: var(--blue); color: #fff; border-color: var(--blue); box-shadow: 0 0 12px var(--blue-glow); }

  /* ── Buttons ─────────────────────────────────────────────────────────────── */
  .rh-load-more { display: flex; align-items: center; gap: .6rem; padding: .85rem 2.5rem; border-radius: 1rem; background: var(--blue); color: #fff; font-weight: 700; font-size: .9rem; cursor: pointer; border: none; transition: all .2s; box-shadow: 0 4px 24px var(--blue-glow); }
  .rh-load-more:hover:not(:disabled) { background: var(--blue-dim); box-shadow: 0 4px 32px rgba(59,158,255,.35); transform: translateY(-1px); }
  .rh-load-more:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .rh-refresh-btn { display: flex; align-items: center; gap: .5rem; padding: .55rem 1.1rem; border-radius: .75rem; font-size: .8rem; font-weight: 600; border: 1px solid var(--border); background: var(--surface2); color: var(--muted2); cursor: pointer; transition: all .2s; }
  .rh-refresh-btn:hover:not(:disabled) { background: var(--surface3); color: var(--text); border-color: var(--blue-border); }
  .rh-refresh-btn:disabled { opacity: .4; cursor: not-allowed; }

  /* ── Alert banner ────────────────────────────────────────────────────────── */
  .rh-alert { background: linear-gradient(135deg, rgba(255,179,71,.06), rgba(255,179,71,.02)); border: 1px solid rgba(255,179,71,.2); border-radius: 1rem; padding: 1rem 1.25rem; display: flex; gap: .875rem; align-items: flex-start; }

  /* ── Stat chips ──────────────────────────────────────────────────────────── */
  .rh-stat-chip { background: var(--surface2); border: 1px solid var(--border); border-radius: .75rem; padding: .6rem 1rem; display: flex; flex-direction: column; gap: .2rem; }
  .rh-stat-val  { font-family: 'DM Mono', monospace; font-size: 1.15rem; font-weight: 500; color: var(--blue); }
  .rh-stat-lbl  { font-size: .68rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); }

  /* ── Trending pill ───────────────────────────────────────────────────────── */
  .rh-trend-pill { display: inline-flex; align-items: center; gap: .35rem; padding: .3rem .8rem; background: var(--surface2); border: 1px solid var(--blue-border); border-radius: 99px; font-size: .75rem; color: var(--blue); font-weight: 500; }

  /* ── Empty state ─────────────────────────────────────────────────────────── */
  .rh-empty { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 1rem; border: 1px dashed var(--border); border-radius: 1.5rem; text-align: center; gap: 1rem; }

  /* ── Fade-up ─────────────────────────────────────────────────────────────── */
  @keyframes rhFadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
  .rh-fade-up { animation: rhFadeUp .4s ease both; }

  @keyframes rhSpin { to { transform: rotate(360deg) } }
  .rh-spin { animation: rhSpin 1s linear infinite; }

  /* ── Sidebar layout ──────────────────────────────────────────────────────── */
  .rh-main-grid { display: grid; grid-template-columns: minmax(0,1fr) 280px; gap: 2rem; align-items: start; }
  @media (max-width: 1024px) { .rh-main-grid { grid-template-columns: 1fr !important; } .rh-sidebar { display: none !important; } }

  /* Sidebar widget card */
  .rh-widget { background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; padding: 1.25rem; transition: border-color .2s; }
  .rh-widget:hover { border-color: var(--blue-border); }
  .rh-widget-lbl { font-family: 'DM Mono', monospace; font-size: .65rem; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); margin-bottom: .875rem; }

  /* Hide scrollbar utility */
  .rh-no-scroll::-webkit-scrollbar { display: none; }
`;

function injectStyles() {
  if (document.getElementById('rh-styles')) return;
  const s = document.createElement('style');
  s.id = 'rh-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─── Sub-components ─────────────────────────────────────────────────────────── */
function TickerTape() {
  const items = [...TICKER_TAPE, ...TICKER_TAPE];
  return (
    <div className="rh-ticker-wrap">
      <div className="rh-ticker-inner">
        {items.map((t, i) => (
          <span key={i} className={`rh-ticker-item ${t.includes('-') ? 'down' : 'up'}`}>
            {t} <span style={{ color: 'var(--border)', marginLeft: '1rem' }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SentimentWidget({ sentiment }) {
  if (!sentiment) return null;
  const {
    bullish_percent = 55, bearish_percent = 20,
    neutral_percent = 25, market_mood = '—',
    total_articles_analyzed = 0,
  } = sentiment;

  return (
    <div className="rh-widget" style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="rh-widget-lbl" style={{ marginBottom: 0 }}>Market Sentiment</div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.7rem', color: 'var(--blue)' }}>
          {total_articles_analyzed} articles
        </span>
      </div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem' }}>{market_mood}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
        {[
          { label: 'Bullish', pct: bullish_percent, color: 'var(--blue)'  },
          { label: 'Neutral', pct: neutral_percent, color: 'var(--muted2)'},
          { label: 'Bearish', pct: bearish_percent, color: 'var(--red)'   },
        ].map(({ label, pct, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.65rem', color: 'var(--muted)', width: '3rem', flexShrink: 0 }}>{label}</span>
            <div className="rh-sent-bar" style={{ flex: 1 }}>
              <div className="rh-sent-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.7rem', color, width: '2.5rem', textAlign: 'right' }}>{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function ResearchHub() {
  useEffect(() => { injectStyles(); }, []);

  const [news,        setNews]        = useState([]);
  const [sentiment,   setSentiment]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category,    setCategory]    = useState('all');
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState(null);
  const [error,       setError]       = useState(null);
  const [online,      setOnline]      = useState(navigator.onLine);
  const abortRef = useRef(null);
  const gridRef  = useRef(null);

  useEffect(() => {
    const up   = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online',  up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  const fetchPage = useCallback(async (cat, pg, isAppend = false) => {
    const cached = cacheGet(cat, pg);
    if (cached) {
      if (isAppend) setNews(p => [...p, ...cached.data]);
      else          setNews(cached.data);
      setPagination(cached.pagination);
      setLoading(false); setLoadingMore(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      if (isAppend) setLoadingMore(true);
      else          setLoading(true);
      setError(null);

      const res = await getNews({ category: cat, page: pg, limit: PAGE_SIZE });
      if (ctrl.signal.aborted) return;

      const items = Array.isArray(res?.data?.data) ? res.data.data
                  : Array.isArray(res?.data)        ? res.data
                  : [];
      const pag = res?.data?.pagination || null;

      cacheSet(cat, pg, items, pag);
      if (isAppend) setNews(p => [...p, ...items]);
      else          setNews(items);
      setPagination(pag);
    } catch (e) {
      if (e.name === 'CanceledError' || e.name === 'AbortError') return;
      setError('Failed to load news. Please try again.');
      if (!isAppend) setNews([]);
    } finally {
      if (!ctrl.signal.aborted) { setLoading(false); setLoadingMore(false); }
    }
  }, []);

  useEffect(() => {
    getMarketSentiment().then(r => setSentiment(r?.data || null)).catch(() => setSentiment(null));
  }, []);

  useEffect(() => {
    setPage(1); setNews([]);
    fetchPage(category, 1, false);
  }, [category, fetchPage]);

  const goPage = (pg) => {
    setPage(pg);
    fetchPage(category, pg, false);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLoadMore = () => { const next = page + 1; setPage(next); fetchPage(category, next, true); };
  const handleRefresh  = () => { newsCache.delete(cacheKey(category, page)); fetchPage(category, page, false); };

  const tp      = pagination?.totalPages ?? 1;
  const hasMore = pagination?.hasNextPage ?? false;

  const getPagePills = () => {
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', tp];
    if (page >= tp - 3) return [1, '…', tp - 4, tp - 3, tp - 2, tp - 1, tp];
    return [1, '…', page - 1, page, page + 1, '…', tp];
  };

  return (
    <div className="rh-root">
      <TickerTape />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Hero */}
        <div className="rh-hero">
          <div className="rh-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="rh-eyebrow">
              <span className="rh-live-dot" />
              Live Intelligence Feed
              {online
                ? <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--blue)', fontSize: '.62rem' }}><Wifi size={10} /> Online</span>
                : <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--red)',  fontSize: '.62rem' }}><WifiOff size={10} /> Offline</span>
              }
            </div>
            <h1 className="rh-title">Research<br /><em>Hub</em></h1>
            <p className="rh-subtitle">High-signal stock market intelligence — equities, M&amp;A, IPO &amp; earnings — in one unified feed.</p>
          </div>
        </div>

        {/* Alert */}
        <div className="rh-alert" style={{ marginBottom: '2rem' }}>
          <AlertTriangle size={16} style={{ color: 'var(--amber)', marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ color: 'var(--amber)', fontWeight: 600, fontSize: '.85rem', marginBottom: '.3rem' }}>
              The Fragmented Investment Ecosystem
            </p>
            <p style={{ color: 'var(--muted2)', fontSize: '.8rem', lineHeight: 1.65, margin: 0 }}>
              Critical financial data is scattered across dozens of sources — inconsistent, unreliable, and overwhelming in volume. This feed centralises stock-market intelligence so you can extract signal, not noise.
            </p>
          </div>
        </div>

        {/* Main grid */}
        <div className="rh-main-grid">

          {/* ── Left: feed ─────────────────────────────────────────────────── */}
          <div>
            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '.25rem' }} className="rh-no-scroll">
              {CATEGORIES.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => { if (key !== category) setCategory(key); }}
                  className={`rh-cat-tab ${key === category ? 'active' : 'inactive'}`}>
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            {/* Meta row */}
            <div ref={gridRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                {pagination && (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.72rem', color: 'var(--muted)' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{pagination.total}</span> articles
                    &nbsp;·&nbsp;page <span style={{ color: 'var(--text)' }}>{pagination.page}</span> / {pagination.totalPages}
                  </span>
                )}
                {loading && (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '.65rem', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <RefreshCw size={11} className="rh-spin" /> Loading
                  </span>
                )}
              </div>
              <button onClick={handleRefresh} disabled={loading || loadingMore} className="rh-refresh-btn">
                <RefreshCw size={13} className={loading ? 'rh-spin' : ''} />
                Refresh
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.875rem 1.25rem', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: '.875rem', fontSize: '.82rem', color: '#fca5a5' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                {error}
                <button onClick={handleRefresh} style={{ marginLeft: 'auto', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', fontSize: 'inherit' }}>Retry</button>
              </div>
            )}

            {/* Grid */}
            <div className="rh-news-grid">
              {loading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <div key={i} className="rh-skel" style={{ animationDelay: `${i * 0.04}s` }} />
                  ))
                : news.length === 0
                  ? (
                    <div className="rh-empty">
                      <div style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Newspaper size={28} style={{ color: 'var(--muted)' }} />
                      </div>
                      <div>
                        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', margin: '0 0 .4rem' }}>Quiet Market</p>
                        <p style={{ color: 'var(--muted2)', fontSize: '.85rem', margin: 0 }}>No headlines in this category right now. Try another filter.</p>
                      </div>
                      <button onClick={handleRefresh} className="rh-load-more" style={{ padding: '.6rem 1.5rem' }}>Try Refreshing</button>
                    </div>
                  )
                  : news.map((article, i) => (
                      <div key={article.id || `${article.url}-${i}`} className="rh-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}>
                        <NewsCard article={article} />
                      </div>
                    ))
              }
              {loadingMore && Array.from({ length: 3 }).map((_, i) => <div key={`more-${i}`} className="rh-skel" />)}
            </div>

            {/* Pagination */}
            {!loading && news.length > 0 && pagination && (
              <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
                {hasMore && (
                  <button onClick={handleLoadMore} disabled={loadingMore} className="rh-load-more">
                    {loadingMore
                      ? <><RefreshCw size={15} className="rh-spin" /> Loading…</>
                      : <><Zap size={15} /> Load More Articles</>
                    }
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button onClick={() => goPage(page - 1)} disabled={page <= 1 || loading} className="rh-pg-btn">
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
                    {getPagePills().map((pg, i) =>
                      pg === '…'
                        ? <span key={`el-${i}`} style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: '.75rem', padding: '0 .25rem' }}>…</span>
                        : <button key={pg} onClick={() => goPage(pg)} className={`rh-pg-pill ${pg === page ? 'active' : ''}`}>{pg}</button>
                    )}
                  </div>
                  <button onClick={() => goPage(page + 1)} disabled={!pagination.hasNextPage || loading} className="rh-pg-btn">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: sidebar ─────────────────────────────────────────────── */}
          <aside className="rh-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1.5rem' }}>

            <SentimentWidget sentiment={sentiment} />

            {sentiment?.top_topics?.length > 0 && (
              <div className="rh-widget">
                <div className="rh-widget-lbl">Trending Themes</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                  {sentiment.top_topics.map((t, i) => (
                    <span key={i} className="rh-trend-pill">
                      <TrendingUp size={11} /> {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rh-widget">
              <div className="rh-widget-lbl">Coverage</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.625rem' }}>
                {[
                  { val: '4',   lbl: 'Categories' },
                  { val: '60d', lbl: 'History'     },
                  { val: '5m',  lbl: 'Cache TTL'   },
                  { val: '12',  lbl: 'Per Page'    },
                ].map(({ val, lbl }) => (
                  <div key={lbl} className="rh-stat-chip">
                    <span className="rh-stat-val">{val}</span>
                    <span className="rh-stat-lbl">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div style={{ height: '4rem' }} />
      </div>
    </div>
  );
}