import { useState, useEffect } from 'react';
import API from '../api';
import {
  TrendingUp, TrendingDown, ExternalLink, Search,
  ShieldCheck, ShieldX, Minus, ChevronDown, ChevronUp,
  Zap, BarChart2, Newspaper, RefreshCw, Info,
} from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  .sp-root {
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
    --amber:       #f59e0b;
    font-family: 'Instrument Sans', sans-serif;
    background: var(--obsidian);
    color: var(--text);
    min-height: 100vh;
    padding-bottom: 4rem;
  }

  /* Ticker */
  .sp-ticker-wrap { overflow: hidden; background: var(--surface); border-bottom: 1px solid var(--border); }
  .sp-ticker-inner { display: flex; width: max-content; animation: spTick 42s linear infinite; }
  .sp-ticker-inner:hover { animation-play-state: paused; }
  @keyframes spTick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .sp-ticker-item { padding: 5px 1.75rem; font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: .04em; white-space: nowrap; }
  .sp-ticker-item.up { color: var(--blue); }
  .sp-ticker-item.dn { color: var(--red); }

  /* Hero */
  .sp-hero { position: relative; padding: 3rem 0 2.25rem; overflow: hidden; }
  .sp-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 55% 80% at 5% 60%, rgba(59,158,255,.08) 0%, transparent 70%); pointer-events: none; }
  .sp-hero-grid { position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 75% 100% at 5% 60%, black 20%, transparent 80%); opacity: .35; }
  .sp-eyebrow { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: .18em; text-transform: uppercase; color: var(--blue); margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
  .sp-eyebrow::before { content: ''; width: 2rem; height: 1px; background: var(--blue); display: inline-block; }
  .sp-title { font-family: 'DM Serif Display', serif; font-size: clamp(2.4rem, 5vw, 4.2rem); line-height: 1.05; letter-spacing: -.02em; margin: 0; }
  .sp-title em { font-style: italic; color: var(--blue); }
  .sp-subtitle { color: var(--muted2); font-size: .95rem; margin-top: .65rem; line-height: 1.6; }
  .sp-live { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); animation: spPulse 2s ease-out infinite; flex-shrink: 0; }
  @keyframes spPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,158,255,.6) } 50% { box-shadow: 0 0 0 6px rgba(59,158,255,0) } }

  /* Cards */
  .sp-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; overflow: hidden; margin-bottom: 1.5rem; transition: border-color .25s; }
  .sp-card:hover { border-color: var(--blue-border); }
  .sp-card-hdr { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: .625rem; }
  .sp-card-title { font-family: 'DM Serif Display', serif; font-size: 1.3rem; }
  .sp-card-body { padding: 1.5rem; }

  /* Form */
  .sp-form-grid { display: grid; grid-template-columns: 1fr 1fr auto; gap: .875rem; align-items: end; }
  @media (max-width: 700px) { .sp-form-grid { grid-template-columns: 1fr; } }
  .sp-label { display: block; font-size: .72rem; font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin-bottom: .5rem; }
  .sp-input { width: 100%; padding: .6rem 1rem; background: var(--surface2); border: 1px solid var(--border); border-radius: .75rem; color: var(--text); font-size: .875rem; outline: none; font-family: 'Instrument Sans', sans-serif; transition: border-color .2s, box-shadow .2s; box-sizing: border-box; }
  .sp-input:focus { border-color: var(--blue-border); box-shadow: 0 0 0 3px var(--blue-glow); }
  .sp-input::placeholder { color: var(--muted); }
  .sp-input-wrap { position: relative; }
  .sp-input-icon { position: absolute; left: .875rem; top: 50%; transform: translateY(-50%); pointer-events: none; }
  .sp-input-wrap .sp-input { padding-left: 2.5rem; }

  /* Button */
  .sp-btn-primary { display: inline-flex; align-items: center; gap: .4rem; padding: .625rem 1.25rem; background: var(--blue); color: #fff; border: none; border-radius: .75rem; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s; font-family: 'Instrument Sans', sans-serif; white-space: nowrap; height: 42px; }
  .sp-btn-primary:hover:not(:disabled) { background: #1a7ee0; box-shadow: 0 4px 16px rgba(59,158,255,.3); }
  .sp-btn-primary:disabled { opacity: .45; cursor: not-allowed; }

  /* Metrics row */
  .sp-metrics { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .sp-metric { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.25rem; transition: border-color .2s; }
  .sp-metric:hover { border-color: var(--blue-border); }
  .sp-metric-lbl { font-family: 'DM Mono', monospace; font-size: .6rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin-bottom: .5rem; }
  .sp-metric-val { font-family: 'DM Mono', monospace; font-size: 1.5rem; font-weight: 500; }
  .sp-metric-sub { font-size: .72rem; color: var(--muted2); margin-top: .35rem; }

  /* Grid */
  .sp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
  @media (max-width: 700px) { .sp-grid { grid-template-columns: 1fr; } }

  /* Stock card */
  .sp-stock-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; overflow: hidden; display: flex; flex-direction: column; transition: border-color .25s, transform .2s, box-shadow .2s; }
  .sp-stock-card:hover { border-color: var(--blue-border); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,.3); }
  .sp-stock-card.verdict-buy   { border-top: 2px solid var(--green); }
  .sp-stock-card.verdict-avoid { border-top: 2px solid var(--red); }
  .sp-stock-card.verdict-hold  { border-top: 2px solid var(--amber); }
  .sp-stock-card.not-affordable { opacity: .55; }

  .sp-stock-top { padding: 1.25rem 1.25rem .875rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
  .sp-stock-name { font-family: 'DM Serif Display', serif; font-size: 1.05rem; line-height: 1.2; }
  .sp-stock-sym { font-family: 'DM Mono', monospace; font-size: .68rem; color: var(--blue); margin-top: .2rem; font-weight: 500; }
  .sp-sector-badge { font-family: 'DM Mono', monospace; font-size: .58rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); background: var(--surface2); border: 1px solid var(--border); padding: .2rem .5rem; border-radius: 99px; margin-top: .4rem; display: inline-block; }
  .sp-price-col { text-align: right; flex-shrink: 0; }
  .sp-price-val { font-family: 'DM Mono', monospace; font-size: 1.4rem; font-weight: 500; line-height: 1; }
  .sp-price-change { font-family: 'DM Mono', monospace; font-size: .75rem; display: flex; align-items: center; gap: 3px; justify-content: flex-end; margin-top: .3rem; }
  .sp-price-inr { font-family: 'DM Mono', monospace; font-size: .65rem; color: var(--muted); margin-top: .2rem; }

  .sp-verdict-strip { padding: .6rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: .75rem; border-top: 1px solid var(--border); }
  .sp-verdict-strip.buy   { background: rgba(52,211,153,.07); }
  .sp-verdict-strip.avoid { background: rgba(248,113,113,.07); }
  .sp-verdict-strip.hold  { background: rgba(245,158,11,.07); }
  .sp-verdict-badge { display: flex; align-items: center; gap: .45rem; font-family: 'Instrument Sans', sans-serif; font-weight: 700; font-size: .82rem; }
  .sp-verdict-meta { font-family: 'DM Mono', monospace; font-size: .65rem; color: var(--muted2); }

  .sp-signals { padding: .875rem 1.25rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: .4rem; }
  .sp-signal { display: flex; align-items: center; gap: .5rem; font-size: .78rem; color: var(--muted2); }
  .sp-signal-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  .sp-shares { margin: 0 1.25rem .875rem; padding: .875rem 1rem; background: var(--surface2); border: 1px solid var(--border); border-radius: .875rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .sp-shares-lbl { font-family: 'DM Mono', monospace; font-size: .6rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin-bottom: .3rem; }
  .sp-shares-val { font-family: 'DM Mono', monospace; font-size: 1.6rem; font-weight: 500; color: var(--green); line-height: 1; }
  .sp-shares-unit { font-size: .73rem; color: var(--muted2); }
  .sp-no-afford { font-family: 'DM Mono', monospace; font-size: .72rem; color: var(--red); }

  .sp-analyst { margin: 0 1.25rem .875rem; padding: .5rem .875rem; background: var(--surface2); border: 1px solid var(--border); border-radius: .75rem; font-family: 'DM Mono', monospace; font-size: .68rem; color: var(--muted2); display: flex; align-items: center; gap: .5rem; }

  .sp-section-lbl { font-family: 'DM Mono', monospace; font-size: .6rem; text-transform: uppercase; letter-spacing: .1em; color: var(--blue); margin-bottom: .4rem; }
  .sp-why { padding: 0 1.25rem .75rem; }
  .sp-why-text { font-size: .8rem; color: var(--muted2); line-height: 1.65; }

  .sp-news { padding: 0 1.25rem 1.25rem; }
  .sp-news-item { display: flex; gap: .625rem; padding: .6rem .75rem; background: var(--surface2); border: 1px solid var(--border); border-radius: .75rem; margin-bottom: .4rem; text-decoration: none; transition: border-color .15s; }
  .sp-news-item:hover { border-color: var(--blue-border); }
  .sp-news-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .sp-news-headline { font-size: .75rem; color: var(--text); line-height: 1.45; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .sp-news-meta { font-family: 'DM Mono', monospace; font-size: .6rem; color: var(--muted); margin-top: .2rem; }

  .sp-expand-btn { width: 100%; padding: .6rem; background: none; border: none; border-top: 1px solid var(--border); color: var(--muted2); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .35rem; font-family: 'DM Mono', monospace; font-size: .68rem; transition: color .15s, background .15s; }
  .sp-expand-btn:hover { background: var(--surface2); color: var(--text); }

  .sp-skel { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; position: relative; overflow: hidden; }
  .sp-skel::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,.04) 50%, transparent 70%); background-size: 200% 100%; animation: spShim 1.6s ease-in-out infinite; }
  @keyframes spShim { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }

  @keyframes spFadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  .sp-fade { animation: spFadeUp .4s ease both; }

  .sp-error { padding: 1rem 1.25rem; background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.2); border-radius: 1rem; color: var(--red); font-family: 'DM Mono', monospace; font-size: .8rem; margin-bottom: 1.5rem; }

  .sp-back-btn { background: none; border: 1px solid var(--border); border-radius: .5rem; color: var(--muted2); cursor: pointer; padding: .3rem .75rem; font-family: 'DM Mono', monospace; font-size: .68rem; transition: all .15s; }
  .sp-back-btn:hover { border-color: var(--blue-border); color: var(--text); }

  .sp-legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: .3rem; vertical-align: middle; }

  @keyframes spSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  .sp-spin { animation: spSpin 1s linear infinite; }
`;

const TICKER_ITEMS = [
  'AAPL +1.2%','MSFT +0.8%','NVDA +3.4%','GOOGL -0.3%',
  'AMZN +1.7%','META +2.1%','TSLA -1.4%','JPM +0.5%','V +0.9%','UNH -0.6%',
];

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style'); s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

function sentimentColor(s) {
  if (s === 'Very Positive' || s === 'Positive') return '#34d399';
  if (s === 'Very Negative' || s === 'Negative') return '#f87171';
  return '#5a6878';
}

function StockCard({ stock, budgetInr, delay = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const verdictClass       = stock.verdict === 'BUY' ? 'verdict-buy' : stock.verdict === 'AVOID' ? 'verdict-avoid' : 'verdict-hold';
  const verdictStripClass  = stock.verdict === 'BUY' ? 'buy'         : stock.verdict === 'AVOID' ? 'avoid'         : 'hold';
  const verdictColor       = stock.verdict === 'BUY' ? 'var(--green)': stock.verdict === 'AVOID' ? 'var(--red)'    : 'var(--amber)';
  const VerdictIcon        = stock.verdict === 'BUY' ? ShieldCheck   : stock.verdict === 'AVOID' ? ShieldX         : Minus;
  const verdictLabel       = stock.verdict === 'BUY' ? 'Buy Signal'  : stock.verdict === 'AVOID' ? 'Avoid Now'     : 'Hold / Watch';

  const changePos = parseFloat(stock.changePercent) >= 0;
  const priceInr  = (parseFloat(stock.price) * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div
      className={`sp-stock-card ${verdictClass} ${!stock.affordable ? 'not-affordable' : ''} sp-fade`}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Header */}
      <div className="sp-stock-top">
        <div>
          <div className="sp-stock-name">{stock.name}</div>
          <div className="sp-stock-sym">{stock.symbol}</div>
          <div className="sp-sector-badge">{stock.sector}</div>
        </div>
        <div className="sp-price-col">
          <div className="sp-price-val">${parseFloat(stock.price).toFixed(2)}</div>
          <div className="sp-price-change" style={{ color: changePos ? 'var(--green)' : 'var(--red)' }}>
            {changePos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {changePos ? '+' : ''}{stock.changePercent}%
          </div>
          <div className="sp-price-inr">≈ ₹{priceInr}</div>
        </div>
      </div>

      {/* Verdict */}
      <div className={`sp-verdict-strip ${verdictStripClass}`}>
        <div className="sp-verdict-badge" style={{ color: verdictColor }}>
          <VerdictIcon size={14} /> {verdictLabel}
        </div>
        <div className="sp-verdict-meta">{stock.confidence}% conf · β {stock.beta}</div>
      </div>

      {/* Signals */}
      <div className="sp-signals">
        {stock.signals?.slice(0, expanded ? undefined : 3).map((sig, i) => (
          <div key={i} className="sp-signal">
            <div className="sp-signal-dot" style={{
              background: sig.type === 'bull' ? 'var(--green)' : sig.type === 'bear' ? 'var(--red)' : 'var(--muted)',
            }} />
            {sig.text}
          </div>
        ))}
      </div>

      {/* Shares */}
      <div className="sp-shares">
        {stock.affordable ? (
          <>
            <div>
              <div className="sp-shares-lbl">You can buy</div>
              <div>
                <span className="sp-shares-val">{stock.maxShares}</span>{' '}
                <span className="sp-shares-unit">shares</span>
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.62rem', color: 'var(--muted)', marginTop: '.2rem' }}>
                within ₹{Number(budgetInr).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="sp-shares-lbl">Total cost</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.82rem', color: 'var(--text)', marginTop: '.25rem' }}>
                ≈ ₹{(stock.maxShares * parseFloat(stock.price) * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="sp-no-afford">⚠ Exceeds budget</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.62rem', color: 'var(--muted)', marginTop: '.3rem' }}>
              Need ≈ ₹{(parseFloat(stock.price) * 83).toLocaleString('en-IN', { maximumFractionDigits: 0 })} per share
            </div>
          </div>
        )}
      </div>

      {/* Analyst */}
      {stock.analystLabel && (
        <div className="sp-analyst">
          <BarChart2 size={12} color="var(--blue)" />
          {stock.analystLabel}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <>
          <div className="sp-why">
            <div className="sp-section-lbl">AI Analysis</div>
            <div className="sp-why-text">{stock.whyBest}</div>
          </div>
          {stock.news?.length > 0 && (
            <div className="sp-news">
              <div className="sp-section-lbl" style={{ display: 'flex', alignItems: 'center', gap: '.35rem', color: 'var(--muted)' }}>
                <Newspaper size={10} /> Latest News
              </div>
              {stock.news.map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="sp-news-item">
                  <div className="sp-news-dot" style={{ background: sentimentColor(n.sentiment) }} />
                  <div>
                    <div className="sp-news-headline">
                      {n.headline}
                      <ExternalLink size={9} style={{ display: 'inline', color: 'var(--muted)', marginLeft: 3 }} />
                    </div>
                    <div className="sp-news-meta">{n.sentiment} · {n.source}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <button className="sp-expand-btn" onClick={() => setExpanded(e => !e)}>
        {expanded ? <><ChevronUp size={13} /> Hide Analysis</> : <><ChevronDown size={13} /> Analysis &amp; News</>}
      </button>
    </div>
  );
}

export default function Recommendations() {
  useEffect(() => { injectStyles('sp-styles', CSS); }, []);

  const [topStocks,  setTopStocks]  = useState([]);
  const [topLoading, setTopLoading] = useState(true);
  const [topError,   setTopError]   = useState(null);

  const [searchSym,  setSearchSym]  = useState('');
  const [budget,     setBudget]     = useState(100000);
  const [results,    setResults]    = useState(null);
  const [searching,  setSearching]  = useState(false);
  const [searchErr,  setSearchErr]  = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/recommendations/top', { params: { budget: 500000 } });
        setTopStocks(data.stocks || []);
      } catch (e) {
        console.error('[TopStocks]', e?.response?.status, e?.response?.data);
        setTopError(e?.response?.data?.error || 'Failed to load market overview.');
      } finally {
        setTopLoading(false);
      }
    })();
  }, []);

  const handleAnalyze = async () => {
    if (!budget || budget < 1000) { setSearchErr('Minimum budget ₹1,000'); return; }
    setSearching(true); setSearchErr(null); setResults(null);
    try {
      const { data } = await API.post('/recommendations', {
        budget,
        symbol: searchSym.trim().toUpperCase() || undefined,
      });
      setResults(data);
    } catch (e) {
      setSearchErr(e?.response?.data?.error || 'Failed to get recommendations.');
    } finally {
      setSearching(false);
    }
  };

  const displayStocks = results ? results.recommendations : topStocks;
  const isResultView  = !!results;
  const buyCount      = topStocks.filter(s => s.verdict === 'BUY').length;
  const holdCount     = topStocks.filter(s => s.verdict === 'HOLD').length;
  const avoidCount    = topStocks.filter(s => s.verdict === 'AVOID').length;
  const tickerItems   = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="sp-root">

      {/* Ticker */}
      <div className="sp-ticker-wrap">
        <div className="sp-ticker-inner">
          {tickerItems.map((t, i) => (
            <span key={i} className={`sp-ticker-item ${t.includes('-') ? 'dn' : 'up'}`}>
              {t}<span style={{ color: 'var(--border)', marginLeft: '1rem' }}>|</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Hero */}
        <div className="sp-hero">
          <div className="sp-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="sp-eyebrow"><span className="sp-live" /> AI Stock Intelligence</div>
            <h1 className="sp-title">Smart <em>Stock</em><br />Predictor</h1>
            <p className="sp-subtitle">
              Real-time Buy / Avoid signals from news sentiment, analyst ratings &amp; momentum — not guesswork.
            </p>
          </div>
        </div>

        {/* Search card */}
        <div className="sp-card sp-fade">
          <div className="sp-card-hdr">
            <Search size={16} color="var(--blue)" />
            <span className="sp-card-title">Analyse <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Stocks</em></span>
          </div>
          <div className="sp-card-body">
            <div className="sp-form-grid">
              <div>
                <label className="sp-label">Symbol (optional)</label>
                <div className="sp-input-wrap">
                  <Search size={14} color="var(--muted)" className="sp-input-icon" />
                  <input
                    className="sp-input"
                    placeholder="AAPL, NVDA… or leave blank for top picks"
                    value={searchSym}
                    onChange={e => setSearchSym(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  />
                </div>
              </div>
              <div>
                <label className="sp-label">Your Budget (₹)</label>
                <input
                  type="number"
                  className="sp-input"
                  placeholder="100000"
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label className="sp-label" style={{ visibility: 'hidden' }}>Go</label>
                <button className="sp-btn-primary" onClick={handleAnalyze} disabled={searching}>
                  {searching
                    ? <><RefreshCw size={14} className="sp-spin" /> Analyzing…</>
                    : <><Zap size={14} /> Get Best Stocks</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Errors */}
        {searchErr && <div className="sp-error">⚠ {searchErr}</div>}

        {/* Metric chips — default view only */}
        {!isResultView && !topLoading && topStocks.length > 0 && (
          <div className="sp-metrics sp-fade">
            {[
              { lbl: 'Buy Signals',    val: buyCount,         color: 'var(--green)', sub: 'Recommended now' },
              { lbl: 'Hold / Watch',   val: holdCount,        color: 'var(--amber)', sub: 'Consolidating' },
              { lbl: 'Avoid Now',      val: avoidCount,       color: 'var(--red)',   sub: 'Bearish signals' },
              { lbl: 'Stocks Tracked', val: topStocks.length, color: 'var(--blue)',  sub: 'Live data' },
            ].map(({ lbl, val, color, sub }) => (
              <div key={lbl} className="sp-metric">
                <div className="sp-metric-lbl">{lbl}</div>
                <div className="sp-metric-val" style={{ color }}>{val}</div>
                <div className="sp-metric-sub">{sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.875rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1.3rem' }}>
              {isResultView
                ? <>Results <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>({results?.recommendations?.length || 0} stocks)</em></>
                : <>Market <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Overview</em></>
              }
            </span>
            <span style={{ display: 'flex', gap: '.875rem', fontFamily: "'DM Mono',monospace", fontSize: '.68rem', color: 'var(--muted2)', alignItems: 'center' }}>
              <span><span className="sp-legend-dot" style={{ background: 'var(--green)' }} />Buy</span>
              <span><span className="sp-legend-dot" style={{ background: 'var(--amber)' }} />Hold</span>
              <span><span className="sp-legend-dot" style={{ background: 'var(--red)' }} />Avoid</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            {isResultView && (
              <button className="sp-back-btn" onClick={() => { setResults(null); setSearchErr(null); }}>
                ← Back to Overview
              </button>
            )}
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.65rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
              <Info size={11} /> Not financial advice
            </span>
          </div>
        </div>

        {/* Cards */}
        {topLoading && !isResultView ? (
          <div className="sp-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sp-skel" style={{ height: 300 }} />
            ))}
          </div>
        ) : topError && !isResultView ? (
          <div className="sp-error">⚠ {topError}</div>
        ) : displayStocks.length === 0 ? (
          <div className="sp-card">
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted2)', fontFamily: "'DM Mono',monospace", fontSize: '.8rem' }}>
              No stocks found. Try a different symbol or increase your budget.
            </div>
          </div>
        ) : (
          <div className="sp-grid">
            {displayStocks.map((stock, i) => (
              <StockCard
                key={stock.symbol + i}
                stock={stock}
                budgetInr={isResultView ? budget : 500000}
                delay={i * 0.04}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}