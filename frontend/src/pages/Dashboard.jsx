import { useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { getCompaniesWithNews } from '../api';
import NewsCard from '../components/NewsCard';
import {
  Building2, Globe, LineChart, Newspaper,
  Search, Sparkles, TrendingUp, TrendingDown,
  BarChart3, Activity, ExternalLink, X,
} from 'lucide-react';

/* ─── Inject styles once ────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  .db-root {
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

  /* ── Ticker tape ─────────────────────────────────────────────────────────── */
  .db-ticker-wrap { overflow: hidden; background: var(--surface); border-bottom: 1px solid var(--border); }
  .db-ticker-inner { display: flex; width: max-content; animation: dbTicker 40s linear infinite; }
  .db-ticker-inner:hover { animation-play-state: paused; }
  @keyframes dbTicker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .db-ticker-item { padding: 5px 1.75rem; font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: .04em; white-space: nowrap; color: var(--muted2); }
  .db-ticker-item.up   { color: var(--blue); }
  .db-ticker-item.down { color: var(--red); }
  .db-ticker-sep { color: var(--border); margin-left: 1rem; }

  /* ── Hero ────────────────────────────────────────────────────────────────── */
  .db-hero { position: relative; padding: 3rem 0 2.25rem; overflow: hidden; }
  .db-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 55% 80% at 5% 60%, rgba(59,158,255,.08) 0%, transparent 70%),
      radial-gradient(ellipse 35% 60% at 95% 15%, rgba(59,158,255,.05) 0%, transparent 70%);
    pointer-events: none;
  }
  .db-hero-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(var(--border) 1px, transparent 1px),
                      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 75% 100% at 5% 60%, black 20%, transparent 80%);
    opacity: .35;
  }

  .db-eyebrow { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: .18em; text-transform: uppercase; color: var(--blue); margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
  .db-eyebrow::before { content: ''; width: 2rem; height: 1px; background: var(--blue); display: inline-block; }
  .db-title { font-family: 'DM Serif Display', serif; font-size: clamp(2.6rem, 5.5vw, 4.5rem); line-height: 1.05; letter-spacing: -.02em; margin: 0; }
  .db-title em { font-style: italic; color: var(--blue); }
  .db-subtitle { color: var(--muted2); font-size: clamp(.85rem, 1.8vw, 1rem); margin-top: .75rem; max-width: 44ch; line-height: 1.6; }

  /* Live dot */
  .db-live { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 0 0 rgba(59,158,255,.6); animation: dbPulse 2s ease-out infinite; flex-shrink: 0; }
  @keyframes dbPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,158,255,.6) } 50% { box-shadow: 0 0 0 6px rgba(59,158,255,0) } }

  /* ── Search ──────────────────────────────────────────────────────────────── */
  .db-search-wrap { position: relative; width: 100%; max-width: 360px; }
  .db-search-box { display: flex; align-items: center; gap: .6rem; padding: .6rem 1rem; border-radius: .875rem; border: 1px solid var(--border); background: var(--surface2); transition: border-color .2s, box-shadow .2s; }
  .db-search-box:focus-within { border-color: var(--blue-border); box-shadow: 0 0 0 3px var(--blue-glow); }
  .db-search-input { flex: 1; border: none; background: transparent; color: var(--text); font-size: .85rem; outline: none; font-family: 'Instrument Sans', sans-serif; }
  .db-search-input::placeholder { color: var(--muted); }
  .db-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: var(--surface2); border: 1px solid var(--border); border-radius: 1rem; z-index: 40; padding: .5rem; max-height: 320px; overflow-y: auto; box-shadow: 0 16px 48px rgba(0,0,0,.4); }
  .db-dropdown::-webkit-scrollbar { width: 4px; }
  .db-dropdown::-webkit-scrollbar-track { background: transparent; }
  .db-dropdown::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 99px; }
  .db-suggest-item { width: 100%; text-align: left; padding: .6rem .875rem; border-radius: .6rem; display: flex; align-items: center; gap: .75rem; cursor: pointer; border: none; background: transparent; color: var(--text); transition: background .15s; }
  .db-suggest-item:hover { background: var(--surface3); }
  .db-suggest-sym { font-family: 'DM Mono', monospace; font-size: .8rem; font-weight: 500; color: var(--blue); min-width: 52px; }
  .db-suggest-name { font-size: .8rem; color: var(--muted2); }
  .db-suggest-ind { font-size: .7rem; color: var(--muted); display: block; }

  /* ── Company card ────────────────────────────────────────────────────────── */
  .db-company-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 1.25rem;
    margin-bottom: 1.5rem;
    overflow: hidden;
    transition: border-color .25s, box-shadow .25s;
  }
  .db-company-card:hover { border-color: var(--blue-border); }
  .db-company-card.highlighted { border-color: var(--blue); box-shadow: 0 0 0 1px var(--blue), 0 8px 40px var(--blue-glow); }

  /* Card top bar */
  .db-card-topbar { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
  .db-company-logo { width: 42px; height: 42px; border-radius: .75rem; object-fit: contain; background: #fff; flex-shrink: 0; }
  .db-symbol-badge { font-family: 'DM Mono', monospace; font-size: .65rem; color: var(--blue); text-transform: uppercase; letter-spacing: .1em; }
  .db-company-name { font-family: 'DM Serif Display', serif; font-size: 1.3rem; line-height: 1.2; color: var(--text); }
  .db-quote-chips { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: .25rem; }
  .db-chip { display: flex; flex-direction: column; }
  .db-chip-lbl { font-family: 'DM Mono', monospace; font-size: .58rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); }
  .db-chip-val { font-family: 'DM Mono', monospace; font-size: .95rem; font-weight: 500; color: var(--text); margin-top: 1px; }
  .db-chip-val.up   { color: var(--green); }
  .db-chip-val.down { color: var(--red); }
  .db-chip-val.blue { color: var(--blue); }

  /* Card body: 2-col grid */
  .db-card-body { display: grid; grid-template-columns: 1fr 1fr; }
  @media (max-width: 768px) { .db-card-body { grid-template-columns: 1fr; } }
  .db-panel { display: flex; flex-direction: column; max-height: min(52vh, 480px); min-height: 240px; }
  .db-panel + .db-panel { border-left: 1px solid var(--border); }
  @media (max-width: 768px) { .db-panel + .db-panel { border-left: none; border-top: 1px solid var(--border); } }

  /* Panel header */
  .db-panel-hdr { padding: .875rem 1.25rem; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .db-panel-hdr-title { font-size: .82rem; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: .5rem; }
  .db-panel-hdr-sub { font-size: .72rem; color: var(--muted); margin-top: .25rem; }

  /* Panel body scroll */
  .db-panel-body { flex: 1; min-height: 0; overflow-y: auto; padding: .875rem; display: flex; flex-direction: column; gap: .625rem; }
  .db-panel-body::-webkit-scrollbar { width: 3px; }
  .db-panel-body::-webkit-scrollbar-track { background: transparent; }
  .db-panel-body::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 99px; }

  /* Thesis bullets */
  .db-bullet { display: flex; gap: .75rem; padding: .75rem .875rem; border-radius: .875rem; background: var(--surface2); border: 1px solid var(--border); }
  .db-bullet-icon { width: 30px; height: 30px; border-radius: .6rem; background: var(--blue-glow); border: 1px solid var(--blue-border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .db-bullet-title { font-size: .75rem; font-weight: 700; color: var(--text); margin-bottom: .25rem; }
  .db-bullet-body { font-size: .75rem; color: var(--muted2); line-height: 1.55; }

  /* Skeleton */
  .db-skel { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; margin-bottom: 1.5rem; overflow: hidden; position: relative; }
  .db-skel::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,.04) 50%, transparent 70%); background-size: 200% 100%; animation: dbShimmer 1.6s ease-in-out infinite; }
  @keyframes dbShimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }

  /* Stat chips in header */
  .db-stat-chips { display: flex; gap: 1.5rem; margin-left: auto; flex-wrap: wrap; }
  @media (max-width: 640px) { .db-stat-chips { display: none; } }

  /* Fade in */
  @keyframes dbFadeUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
  .db-fade-up { animation: dbFadeUp .4s ease both; }

  /* Website link */
  .db-website-link { display: inline-flex; align-items: center; gap: .3rem; font-size: .72rem; color: var(--blue); text-decoration: none; margin-top: .4rem; font-family: 'DM Mono', monospace; }
  .db-website-link:hover { text-decoration: underline; }

  /* Empty/error */
  .db-empty { padding: 3rem 1.5rem; text-align: center; color: var(--muted2); font-size: .9rem; }
  .db-error { padding: 1.25rem; border-radius: 1rem; background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.2); color: var(--red); font-size: .85rem; }
`;

function injectStyles() {
  if (document.getElementById('db-styles')) return;
  const s = document.createElement('style');
  s.id = 'db-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const NEWS_PER_STOCK = 4;

const TICKER_TAPE = [
  'AAPL +1.2%','MSFT +0.8%','NVDA +3.4%','GOOGL -0.3%','AMZN +1.7%',
  'META +2.1%','TSLA -1.4%','JPM +0.6%','V +0.4%','MA +0.9%',
  'BRK.B +0.2%','XOM -0.7%','UNH +1.1%','JNJ -0.5%','PG +0.3%',
];

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function formatCap(n, currency = 'USD') {
  if (n == null || isNaN(Number(n))) return '—';
  let cap = Number(n);
  if (cap > 0 && cap < 1e12) cap *= 1e6;
  const [div, sfx] = cap >= 1e12 ? [1e12,'T'] : cap >= 1e9 ? [1e9,'B'] : cap >= 1e6 ? [1e6,'M'] : [1,''];
  const v = cap / div;
  return `${v < 10 ? v.toFixed(2) : v.toFixed(1)}${sfx} ${currency}`;
}

function formatPrice(c, currency) {
  if (c == null || c === 0) return '—';
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(c); }
  catch { return `${c}`; }
}

function buildThesis({ quote, profile, company }) {
  const bullets = [];
  const name = company?.name || profile?.name || 'This company';
  const desc = (profile?.description || '').trim();
  const industry = profile?.finnhubIndustry;
  const country = profile?.country;
  const dp = quote?.dp;
  const d = quote?.d;

  if (desc) {
    const short = desc.length > 300 ? `${desc.slice(0, 300).trim()}…` : desc;
    bullets.push({ icon: 'building', title: 'What they do', body: short });
  }
  if (industry) {
    bullets.push({ icon: 'globe', title: 'Sector positioning', body: `${name} operates in ${industry}${country ? ` (${country})` : ''}. Compare sector peers to understand relative growth drivers.` });
  }
  if (dp != null && typeof dp === 'number') {
    const dir = dp >= 0 ? 'up' : 'down';
    bullets.push({ icon: 'chart', title: 'Recent price action', body: `Stock is ${dir} ~${Math.abs(dp).toFixed(2)}% vs prior close${d != null ? ` (${d >= 0 ? '+' : ''}${d.toFixed(2)} on the day)` : ''}. Pair short-term moves with fundamentals and news flow.` });
  }
  if (!bullets.length) {
    bullets.push({ icon: 'sparkle', title: 'Snapshot', body: 'Limited profile data for this symbol — use the quote and headlines alongside it.' });
  }
  bullets.push({ icon: 'sparkle', title: 'Not financial advice', body: 'HackTrix surfaces data to help you learn. Always verify filings, risk, and your own goals before investing.' });
  return bullets;
}

function BulletIcon({ k }) {
  const sz = 14;
  const c = 'var(--blue)';
  if (k === 'building') return <Building2 size={sz} color={c} />;
  if (k === 'globe')    return <Globe size={sz} color={c} />;
  if (k === 'chart')    return <LineChart size={sz} color={c} />;
  if (k === 'news')     return <Newspaper size={sz} color={c} />;
  return <Sparkles size={sz} color={c} />;
}

/* ─── Ticker Tape ───────────────────────────────────────────────────────────── */
function TickerTape() {
  const items = [...TICKER_TAPE, ...TICKER_TAPE];
  return (
    <div className="db-ticker-wrap">
      <div className="db-ticker-inner">
        {items.map((t, i) => (
          <span key={i} className={`db-ticker-item ${t.includes('-') ? 'down' : 'up'}`}>
            {t} <span className="db-ticker-sep">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Company Card ──────────────────────────────────────────────────────────── */
function CompanyRow({ company, rowIndex, highlighted }) {
  const quote    = company.quote   || {};
  const prof     = company.profile || {};
  const currency = company.currency || prof.currency || 'USD';
  const newsFirst = rowIndex % 2 === 1;

  const thesis = buildThesis({ quote, profile: prof, company });

  const newsList = Array.isArray(company.news)
    ? [...company.news].sort((a, b) => (b.datetime || 0) - (a.datetime || 0)).slice(0, NEWS_PER_STOCK)
    : [];

  const dpUp = (quote.dp || 0) >= 0;

  // ── Stock Panel ──────────────────────────────────────────────────────────────
  const stockPanel = (
    <div className="db-panel">
      <div className="db-panel-hdr">
        <div className="db-panel-hdr-title">
          <BarChart3 size={14} color="var(--blue)" />
          Company Overview
        </div>
        <div className="db-panel-hdr-sub">Quote, profile &amp; context</div>
      </div>
      <div className="db-panel-body">
        {/* Quote chips */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', padding: '.25rem 0' }}>
          <div className="db-chip">
            <span className="db-chip-lbl">Last</span>
            <span className="db-chip-val blue">{formatPrice(quote.c, currency)}</span>
          </div>
          <div className="db-chip">
            <span className="db-chip-lbl">Change</span>
            <span className={`db-chip-val ${dpUp ? 'up' : 'down'}`}>
              {quote.d != null ? `${quote.d >= 0 ? '+' : ''}${quote.d.toFixed(2)}` : '—'}
              {quote.dp != null && <span style={{ fontSize: '.75rem', marginLeft: '.25rem' }}>({quote.dp >= 0 ? '+' : ''}{quote.dp.toFixed(2)}%)</span>}
            </span>
          </div>
          <div className="db-chip">
            <span className="db-chip-lbl">Mkt Cap</span>
            <span className="db-chip-val">{formatCap(prof.marketCapitalization, currency)}</span>
          </div>
          <div className="db-chip">
            <span className="db-chip-lbl">High</span>
            <span className="db-chip-val">{formatPrice(quote.h, currency)}</span>
          </div>
          <div className="db-chip">
            <span className="db-chip-lbl">Low</span>
            <span className="db-chip-val">{formatPrice(quote.l, currency)}</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '.25rem 0' }} />

        {/* Thesis bullets */}
        {thesis.map((t, i) => (
          <div key={i} className="db-bullet">
            <div className="db-bullet-icon"><BulletIcon k={t.icon} /></div>
            <div>
              <div className="db-bullet-title">{t.title}</div>
              <div className="db-bullet-body">{t.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── News Panel ───────────────────────────────────────────────────────────────
  const newsPanel = (
    <div className="db-panel">
      <div className="db-panel-hdr">
        <div className="db-panel-hdr-title">
          <Newspaper size={14} color="var(--blue)" />
          Latest — {company.symbol}
        </div>
        <div className="db-panel-hdr-sub">Company headlines, newest first</div>
      </div>
      <div className="db-panel-body">
        {newsList.length > 0
          ? newsList.map((article) => (
              <NewsCard key={`${company.symbol}-${article.id}`} article={article} compact />
            ))
          : <div className="db-empty">No company headlines for {company.symbol} right now.</div>
        }
      </div>
    </div>
  );

  return (
    <div
      id={`dash-company-${company.symbol}`}
      className={`db-company-card db-fade-up ${highlighted ? 'highlighted' : ''}`}
      style={{ scrollMarginTop: 100, animationDelay: `${Math.min(rowIndex, 6) * 0.06}s` }}
    >
      {/* Top bar: logo + name + quick stats */}
      <div className="db-card-topbar">
        {prof.logo && (
          <img src={prof.logo} alt="" className="db-company-logo"
            onError={(e) => { e.target.style.display = 'none'; }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="db-symbol-badge">{company.exchange || '—'} · {company.symbol} · {prof.finnhubIndustry || 'Equities'}</div>
          <div className="db-company-name">{company.name || company.symbol}</div>
          {prof.weburl && (
            <a href={prof.weburl} target="_blank" rel="noopener noreferrer" className="db-website-link">
              <ExternalLink size={10} /> {prof.weburl.replace(/^https?:\/\/(www\.)?/, '')}
            </a>
          )}
        </div>

        {/* Inline mini-quote badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
          <div style={{
            padding: '.35rem .75rem',
            borderRadius: '.75rem',
            background: dpUp ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)',
            border: `1px solid ${dpUp ? 'rgba(52,211,153,.25)' : 'rgba(248,113,113,.25)'}`,
            display: 'flex', alignItems: 'center', gap: '.4rem',
            fontFamily: "'DM Mono', monospace", fontSize: '.75rem',
            color: dpUp ? 'var(--green)' : 'var(--red)',
          }}>
            {dpUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {quote.dp != null ? `${quote.dp >= 0 ? '+' : ''}${quote.dp.toFixed(2)}%` : '—'}
          </div>
        </div>
      </div>

      {/* Two-panel body */}
      <div className="db-card-body">
        <div>{newsFirst ? newsPanel : stockPanel}</div>
        <div>{newsFirst ? stockPanel : newsPanel}</div>
      </div>
    </div>
  );
}

const MemoCompanyRow = React.memo(CompanyRow);

/* ─── Dashboard ─────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  useEffect(() => { injectStyles(); }, []);

  const [companies,         setCompanies]         = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [searchQ,           setSearchQ]           = useState('');
  const [searchOpen,        setSearchOpen]        = useState(false);
  const [highlightedSymbol, setHighlightedSymbol] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    getCompaniesWithNews({ newsLimit: NEWS_PER_STOCK })
      .then((r) => {
        if (cancelled) return;
        const rows = r.data?.companies;
        setCompanies(Array.isArray(rows) ? rows : []);
      })
      .catch((e) => {
        if (!cancelled) { setError(e?.response?.data?.message || e.message || 'Failed to load overview'); setCompanies([]); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const suggestions = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!companies.length) return [];
    if (!q) return companies.slice(0, 12);
    return companies.filter(c =>
      c.symbol.toLowerCase().includes(q) ||
      (c.name     && String(c.name).toLowerCase().includes(q)) ||
      (c.industry && String(c.industry).toLowerCase().includes(q))
    );
  }, [companies, searchQ]);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e) => { if (!searchRef.current?.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  const goToCompany = (symbol) => {
    const el = document.getElementById(`dash-company-${symbol}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHighlightedSymbol(symbol);
    setTimeout(() => setHighlightedSymbol(s => s === symbol ? null : s), 2400);
    setSearchQ(''); setSearchOpen(false);
  };

  return (
    <div className="db-root">
      <TickerTape />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.25rem' }}>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="db-hero">
          <div className="db-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="db-eyebrow">
              <span className="db-live" />
              Company Intelligence
            </div>
            <h1 className="db-title">
              Stock<br /><em>Dashboard</em>
            </h1>
            <p className="db-subtitle">
              Live quotes, company profiles &amp; latest headlines for tracked equities — side by side.
            </p>
          </div>
        </div>

        {/* ── Controls row ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { val: companies.length || '—', lbl: 'Companies' },
              { val: NEWS_PER_STOCK,          lbl: 'News/stock' },
              { val: '60d',                   lbl: 'History'    },
            ].map(({ val, lbl }) => (
              <div key={lbl}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1rem', fontWeight: 500, color: 'var(--blue)' }}>{val}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginTop: 1 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {!loading && companies.length > 0 && (
            <div className="db-search-wrap" ref={searchRef}>
              <div className="db-search-box">
                <Search size={15} color="var(--muted)" />
                <input
                  className="db-search-input"
                  placeholder="Search company or symbol…"
                  value={searchQ}
                  onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                />
                {searchQ && (
                  <button onClick={() => { setSearchQ(''); setSearchOpen(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--muted)' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              {searchOpen && suggestions.length > 0 && (
                <div className="db-dropdown">
                  {suggestions.map(c => (
                    <button key={c.symbol} className="db-suggest-item"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => goToCompany(c.symbol)}>
                      <span className="db-suggest-sym">{c.symbol}</span>
                      <span className="db-suggest-name">
                        {c.name}
                        {c.industry && <span className="db-suggest-ind">{c.industry}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Content ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[320, 360, 300].map((h, i) => (
              <div key={i} className="db-skel" style={{ height: h }} />
            ))}
          </div>
        ) : error ? (
          <div className="db-error">{error}</div>
        ) : companies.length === 0 ? (
          <div className="db-empty">No companies returned from the API.</div>
        ) : (
          companies.map((c, i) => (
            <MemoCompanyRow key={c.symbol} company={c} rowIndex={i} highlighted={highlightedSymbol === c.symbol} />
          ))
        )}

      </div>
    </div>
  );
}