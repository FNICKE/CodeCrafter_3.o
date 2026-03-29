import { useEffect, useState, useRef } from 'react';
import API from '../api';
import {
  Brain, Search, DollarSign, Shield, Clock, Zap,
  Target, LayoutDashboard, RefreshCw, TrendingUp,
  TrendingDown, ChevronRight, AlertTriangle,
  CheckCircle, BarChart2, PieChart, Repeat,
} from 'lucide-react';

/* ─── STYLES ─────────────────────────────────────────────── */
const AI_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');

.adv-root {
  --blue:    #4f9cf9;
  --blue-dim: rgba(79,156,249,.12);
  --blue-ring: rgba(79,156,249,.25);
  --green:   #3ecf8e;
  --red:     #f87171;
  --amber:   #fbbf24;
  --bg:      #060a10;
  --s1:      #0c1219;
  --s2:      #111a24;
  --s3:      #192130;
  --border:  rgba(255,255,255,.07);
  --border2: rgba(255,255,255,.12);
  --text:    #dde5ef;
  --muted:   #4a5a6e;
  --muted2:  #7a8fa6;
  font-family: 'Syne', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding-bottom: 6rem;
}

.adv-hero {
  position: relative; padding: 3rem 1.5rem 2rem; overflow: hidden;
}
.adv-hero-noise {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
}
.adv-hero-glow {
  position: absolute; top: -60px; right: -100px;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(79,156,249,.07) 0%, transparent 70%);
  pointer-events: none;
}
.adv-chip {
  display: inline-flex; align-items: center; gap: .5rem;
  background: var(--blue-dim); border: 1px solid var(--blue-ring);
  border-radius: 100px; padding: .3rem .85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: .65rem; letter-spacing: .12em; text-transform: uppercase;
  color: var(--blue); margin-bottom: 1.25rem;
}
.adv-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); animation: adv-pulse 2s infinite; }
@keyframes adv-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.adv-h1 {
  font-family: 'Lora', serif; font-size: clamp(2rem, 5vw, 3.4rem);
  font-weight: 600; line-height: 1.1; letter-spacing: -.02em; margin: 0;
}
.adv-h1 em { font-style: italic; color: var(--blue); }
.adv-sub { color: var(--muted2); font-size: .88rem; margin-top: .75rem; }

.adv-card {
  background: var(--s1); border: 1px solid var(--border);
  border-radius: 1.25rem; padding: 1.75rem; margin: 0 1.5rem 1.5rem;
}
.adv-card-title {
  font-size: .65rem; text-transform: uppercase; letter-spacing: .15em;
  color: var(--muted); font-family: 'JetBrains Mono', monospace;
  margin-bottom: 1.5rem; display: flex; align-items: center; gap: .5rem;
}
.adv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
.adv-field { display: flex; flex-direction: column; gap: .45rem; }
.adv-field.full { grid-column: 1 / -1; }
.adv-label {
  font-family: 'JetBrains Mono', monospace; font-size: .6rem;
  text-transform: uppercase; letter-spacing: .1em; color: var(--muted);
  display: flex; align-items: center; gap: .4rem;
}
.adv-input, .adv-select {
  background: var(--s2); border: 1px solid var(--border); border-radius: .625rem;
  padding: .7rem 1rem; color: var(--text);
  font-family: 'Syne', sans-serif; font-size: .875rem;
  transition: border-color .2s, box-shadow .2s; appearance: none;
}
.adv-input:focus, .adv-select:focus {
  outline: none; border-color: var(--blue-ring); box-shadow: 0 0 0 3px var(--blue-dim);
}
.adv-input::placeholder { color: var(--muted); }

.adv-toggle-row { display: flex; align-items: center; gap: .75rem; padding-top: 1rem; }
.adv-toggle {
  position: relative; width: 40px; height: 22px;
  background: var(--s3); border: 1px solid var(--border2); border-radius: 100px; cursor: pointer; transition: .2s;
}
.adv-toggle.on { background: var(--blue); border-color: var(--blue); }
.adv-toggle::after {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; border-radius: 50%; background: white; transition: .2s;
}
.adv-toggle.on::after { left: 20px; }
.adv-toggle-label { font-size: .85rem; color: var(--muted2); }

.adv-modes { display: flex; gap: .6rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
.adv-mode-btn {
  background: var(--s2); border: 1px solid var(--border); border-radius: .5rem;
  padding: .45rem .9rem; font-size: .75rem; font-weight: 600; cursor: pointer;
  color: var(--muted2); transition: all .2s; display: flex; align-items: center; gap: .4rem;
}
.adv-mode-btn:hover, .adv-mode-btn.active { background: var(--blue-dim); border-color: var(--blue-ring); color: var(--blue); }

.adv-submit {
  background: var(--blue); color: #fff; border: none; border-radius: .75rem;
  padding: .8rem 1.75rem; font-family: 'Syne', sans-serif;
  font-weight: 700; font-size: .875rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: .6rem;
  transition: all .2s; width: 100%;
}
.adv-submit:hover:not(:disabled) { background: #3a8ae8; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,156,249,.25); }
.adv-submit:disabled { opacity: .45; cursor: not-allowed; }

@keyframes adv-spin { to { transform: rotate(360deg); } }
.adv-spin { animation: adv-spin .8s linear infinite; }

.adv-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 5rem 0; gap: 1.25rem;
}
.adv-loading-ring {
  width: 44px; height: 44px; border-radius: 50%;
  border: 2px solid var(--border2); border-top-color: var(--blue);
  animation: adv-spin .8s linear infinite;
}
.adv-loading-text {
  font-family: 'JetBrains Mono', monospace; font-size: .65rem;
  text-transform: uppercase; letter-spacing: .15em; color: var(--muted);
}

.adv-result { margin: 0 1.5rem; animation: adv-fadeUp .45s ease forwards; }
@keyframes adv-fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

.adv-result-hdr {
  background: linear-gradient(135deg, var(--s1), var(--s2));
  border: 1px solid var(--border2); border-bottom: none;
  border-radius: 1.25rem 1.25rem 0 0;
  padding: 1.25rem 1.75rem;
  display: flex; align-items: center; gap: .875rem;
}
.adv-result-hdr-title { font-family: 'Lora', serif; font-size: 1.15rem; }
.adv-result-hdr-sub { font-size: .75rem; color: var(--muted2); margin-top: .15rem; }
.adv-result-body {
  background: var(--s1); border: 1px solid var(--border2); border-top: none;
  border-radius: 0 0 1.25rem 1.25rem; padding: 2rem 1.75rem;
}

.adv-md h2 {
  font-family: 'Lora', serif; font-size: 1.2rem; font-weight: 600;
  color: var(--text); margin: 2rem 0 .875rem;
  padding-bottom: .5rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: .6rem;
}
.adv-md h2:first-child { margin-top: 0; }
.adv-md h3 { font-size: 1rem; font-weight: 600; color: var(--blue); margin: 1.25rem 0 .5rem; }
.adv-md p { color: var(--muted2); line-height: 1.75; margin: .5rem 0; font-size: .9rem; }
.adv-md strong { color: var(--text); font-weight: 600; }
.adv-md em { color: var(--blue); font-style: italic; }
.adv-md ul, .adv-md ol { padding-left: 1.25rem; margin: .5rem 0; }
.adv-md li { color: var(--muted2); line-height: 1.7; font-size: .9rem; margin-bottom: .25rem; }
.adv-md li::marker { color: var(--blue); }
.adv-md code {
  background: var(--s3); border: 1px solid var(--border);
  border-radius: .3rem; padding: .1rem .4rem;
  font-family: 'JetBrains Mono', monospace; font-size: .8rem; color: var(--amber);
}
.adv-md blockquote {
  border-left: 3px solid var(--blue); margin: 1rem 0; padding: .75rem 1.25rem;
  background: var(--blue-dim); border-radius: 0 .5rem .5rem 0;
}
.adv-md blockquote p { color: var(--text); margin: 0; }
.adv-md table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: .85rem; }
.adv-md thead tr { background: var(--s3); }
.adv-md th {
  font-family: 'JetBrains Mono', monospace; font-size: .65rem;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--muted); padding: .7rem 1rem; text-align: left;
  border-bottom: 1px solid var(--border2);
}
.adv-md td { padding: .65rem 1rem; border-bottom: 1px solid var(--border); color: var(--muted2); }
.adv-md tr:hover td { background: var(--s2); }
.adv-md .bull { color: var(--green); font-weight: 600; }
.adv-md .bear { color: var(--red); font-weight: 600; }
.adv-divider { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }

.adv-stocks-section { margin-top: 1.5rem; }
.adv-stocks-label {
  font-family: 'JetBrains Mono', monospace; font-size: .6rem;
  text-transform: uppercase; letter-spacing: .12em; color: var(--muted); margin-bottom: .875rem;
}
.adv-stocks-grid { display: flex; flex-wrap: wrap; gap: .875rem; }
.adv-stock-tile {
  background: var(--s2); border: 1px solid var(--border);
  border-radius: .875rem; padding: .875rem 1.125rem; min-width: 148px;
  transition: border-color .2s;
}
.adv-stock-tile:hover { border-color: var(--border2); }
.adv-stock-sym { font-family: 'JetBrains Mono', monospace; font-size: .75rem; color: var(--blue); margin-bottom: .35rem; }
.adv-stock-price { font-family: 'JetBrains Mono', monospace; font-size: 1.05rem; font-weight: 500; display: flex; align-items: baseline; gap: .4rem; }
.adv-stock-inr { font-size: .7rem; color: var(--muted2); margin-top: .2rem; font-family: 'JetBrains Mono', monospace; }
.adv-stock-change { font-size: .72rem; }
.adv-stock-change.up { color: var(--green); }
.adv-stock-change.dn { color: var(--red); }

.adv-badge { display: inline-flex; align-items: center; gap: .3rem; font-size: .65rem; font-family: 'JetBrains Mono', monospace; padding: .2rem .55rem; border-radius: 100px; }
.adv-badge.pos { background: rgba(62,207,142,.1); color: var(--green); border: 1px solid rgba(62,207,142,.2); }
.adv-badge.neg { background: rgba(248,113,113,.1); color: var(--red); border: 1px solid rgba(248,113,113,.2); }
.adv-badge.neu { background: var(--s3); color: var(--muted2); border: 1px solid var(--border); }
`;

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style'); s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

/* ─── Markdown Renderer ─────────────────────────────────── */
function renderMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  let html = '', inTable = false, tableHtml = '', inList = false, listType = '';
  const closeList  = () => { if (inList)  { html += `</${listType}>`; inList = false; listType = ''; } };
  const closeTable = () => { if (inTable) { html += tableHtml + '</tbody></table>'; inTable = false; tableHtml = ''; } };
  const inline = (s) => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/🟢|✅/g, '<span class="bull">$&</span>')
    .replace(/🔴|❌/g, '<span class="bear">$&</span>');

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('|')) {
      if (!inTable) { closeList(); inTable = true; tableHtml = '<table><thead>'; }
      const cells = t.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
      if (t.includes('---')) { tableHtml += '</thead><tbody>'; }
      else if (!tableHtml.includes('</thead>')) { tableHtml += '<tr>' + cells.map(c => `<th>${inline(c.trim())}</th>`).join('') + '</tr>'; }
      else { tableHtml += '<tr>' + cells.map(c => `<td>${inline(c.trim())}</td>`).join('') + '</tr>'; }
      continue;
    } else { closeTable(); }
    if (/^#{1,2}\s/.test(t)) {
      closeList();
      const content = t.replace(/^#{1,2}\s/, '');
      const icons = { 'User':'📌','Summary':'📌','Investment':'📊','Plan':'📊','Strategy':'📈','SIP':'🔁','Risk':'⚠️','Portfolio':'💼','Quick':'⚡','Advice':'💡','Analysis':'🔍' };
      const icon = Object.entries(icons).find(([k]) => content.includes(k))?.[1] ?? '▸';
      html += `<h2>${icon} ${inline(content)}</h2>`; continue;
    }
    if (/^#{3}\s/.test(t)) { closeList(); html += `<h3>${inline(t.replace(/^#{3}\s/, ''))}</h3>`; continue; }
    if (t.startsWith('> ')) { closeList(); html += `<blockquote><p>${inline(t.slice(2))}</p></blockquote>`; continue; }
    if (/^[-*•]\s/.test(t)) { if (!inList || listType !== 'ul') { closeList(); html += '<ul>'; inList = true; listType = 'ul'; } html += `<li>${inline(t.replace(/^[-*•]\s/, ''))}</li>`; continue; }
    if (/^\d+\.\s/.test(t)) { if (!inList || listType !== 'ol') { closeList(); html += '<ol>'; inList = true; listType = 'ol'; } html += `<li>${inline(t.replace(/^\d+\.\s/, ''))}</li>`; continue; }
    closeList();
    if (/^[-_*]{3,}$/.test(t)) { html += '<hr class="adv-divider" />'; continue; }
    if (!t) continue;
    html += `<p>${inline(t)}</p>`;
  }
  closeList(); closeTable();
  return html;
}

/* ─── Stock Tile ─────────────────────────────────────────── */
function StockTile({ stock }) {
  const up = (stock.changePercent ?? 0) >= 0;
  const sentScore = stock.sentimentScore ?? 0;
  const sentClass = sentScore > 0 ? 'pos' : sentScore < 0 ? 'neg' : 'neu';
  const sentLabel = sentScore > 0 ? 'positive' : sentScore < 0 ? 'negative' : 'neutral';
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <div className="adv-stock-tile">
      <div className="adv-stock-sym">{stock.symbol}</div>
      <div className="adv-stock-price">
        <span>${stock.priceUSD?.toFixed(2)}</span>
        <span className={`adv-stock-change ${up ? 'up' : 'dn'}`}>
          <Icon size={11} style={{ display: 'inline' }} />
          {up ? '+' : ''}{stock.changePercent?.toFixed(2)}%
        </span>
      </div>
      {stock.priceINR && <div className="adv-stock-inr">₹{stock.priceINR?.toFixed(0)}</div>}
      {stock.sentimentScore !== undefined && (
        <div style={{ marginTop: '.4rem' }}>
          <span className={`adv-badge ${sentClass}`}>{sentLabel} sentiment</span>
        </div>
      )}
    </div>
  );
}

/* ─── Quick Modes ─────────────────────────────────────────── */
const QUICK_MODES = [
  { id: 'buysell',   icon: <BarChart2 size={13} />,    label: 'Buy / Sell Signal',  query: 'Should I buy or sell these stocks right now based on current market data?' },
  { id: 'sip',       icon: <Repeat size={13} />,        label: 'SIP Plan',           query: 'Create a monthly SIP investment plan for long-term wealth creation with the given budget.' },
  { id: 'emergency', icon: <AlertTriangle size={13} />, label: 'Liquid Strategy',    query: 'I need to invest but may need to withdraw in an emergency within 3–6 months. What is the safest strategy?' },
  { id: 'longterm',  icon: <TrendingUp size={13} />,    label: 'Long-Term Wealth',   query: 'Design a long-term portfolio strategy to maximize wealth over 5+ years with the given stocks.' },
  { id: 'diversify', icon: <PieChart size={13} />,      label: 'Diversify',          query: 'How should I diversify my portfolio across these symbols to minimize risk?' },
];

/* ═══════════════════════════════════════════════════════════
   DEFAULT EXPORT — AI Advisor
═══════════════════════════════════════════════════════════ */
export default function AIAdvisor() {
  const [query, setQuery]               = useState('');
  const [symbols, setSymbols]           = useState('AAPL, NVDA, MSFT');
  const [budget, setBudget]             = useState(500000);
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [horizon, setHorizon]           = useState('medium');
  const [needsLiquidity, setNeedsLiquidity] = useState(false);
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [activeMode, setActiveMode]     = useState(null);
  const resultRef                       = useRef(null);

  useEffect(() => { injectStyles('adv-styles', AI_CSS); }, []);

  const applyMode = (mode) => { setActiveMode(mode.id); setQuery(mode.query); };

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setLoading(true); setResult(null);
    try {
      const { data } = await API.post('/ai/predict', {
        query,
        symbols: symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
        budget, riskTolerance, horizon, needsLiquidity,
      });
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="adv-root">

      {/* Hero */}
      <div className="adv-hero">
        <div className="adv-hero-noise" />
        <div className="adv-hero-glow" />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 .25rem' }}>
          <div className="adv-chip">
            <span className="adv-dot" />
            Neural Strategy Engine
          </div>
          <h1 className="adv-h1">AI <em>Investment</em> Advisor</h1>
          <p className="adv-sub">
            Groq Llama-3 · Real-time Finnhub data · INR/USD aware portfolio strategy
          </p>
        </div>
      </div>

      {/* Quick Modes */}
      <div style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '.6rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted)', marginBottom: '.75rem' }}>
          Quick Analysis Templates
        </div>
        <div className="adv-modes">
          {QUICK_MODES.map(m => (
            <button key={m.id} className={`adv-mode-btn ${activeMode === m.id ? 'active' : ''}`} onClick={() => applyMode(m)}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="adv-card">
        <div className="adv-card-title"><Brain size={12} /> Configure Analysis</div>
        <div className="adv-grid">

          <div className="adv-field full">
            <label className="adv-label"><Search size={11} /> Strategic Query</label>
            <textarea
              className="adv-input" rows={3} style={{ resize: 'vertical' }}
              placeholder="e.g. I have ₹5L, want to invest for 2 years with high risk tolerance. Where should I put my money?"
              value={query} onChange={e => setQuery(e.target.value)}
            />
          </div>

          <div className="adv-field">
            <label className="adv-label"><DollarSign size={11} /> Capital (INR)</label>
            <input type="number" className="adv-input" value={budget} onChange={e => setBudget(Number(e.target.value))} />
          </div>

          <div className="adv-field">
            <label className="adv-label"><Target size={11} /> Symbols (comma separated)</label>
            <input className="adv-input" placeholder="AAPL, NVDA, TSLA" value={symbols} onChange={e => setSymbols(e.target.value)} />
          </div>

          <div className="adv-field">
            <label className="adv-label"><Shield size={11} /> Risk Profile</label>
            <select className="adv-select" value={riskTolerance} onChange={e => setRiskTolerance(e.target.value)}>
              <option value="low">Conservative (Capital Protection)</option>
              <option value="moderate">Moderate (Balanced Growth)</option>
              <option value="high">Aggressive (Max Returns)</option>
            </select>
          </div>

          <div className="adv-field">
            <label className="adv-label"><Clock size={11} /> Investment Horizon</label>
            <select className="adv-select" value={horizon} onChange={e => setHorizon(e.target.value)}>
              <option value="short">Short Term (under 6 months)</option>
              <option value="medium">Medium Term (1–2 years)</option>
              <option value="long">Long Term (3+ years)</option>
            </select>
          </div>

          <div className="adv-field" style={{ justifyContent: 'flex-end' }}>
            <div className="adv-toggle-row" style={{ cursor: 'pointer' }} onClick={() => setNeedsLiquidity(v => !v)}>
              <div className={`adv-toggle ${needsLiquidity ? 'on' : ''}`} />
              <span className="adv-toggle-label">Prioritize Liquidity / Emergency Access</span>
            </div>
          </div>

          <div className="adv-field full" style={{ marginTop: '.5rem' }}>
            <button className="adv-submit" onClick={handleSubmit} disabled={loading || !query.trim()}>
              {loading
                ? <><RefreshCw size={15} className="adv-spin" /> Analyzing Market Intelligence...</>
                : <><Zap size={15} /> Execute Predictive Analysis <ChevronRight size={14} /></>}
            </button>
          </div>

        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="adv-loading">
          <div className="adv-loading-ring" />
          <div className="adv-loading-text">Sequencing market data &amp; building prediction...</div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="adv-result" ref={resultRef}>
          <div className="adv-result-hdr">
            <LayoutDashboard size={20} color="var(--blue)" />
            <div>
              <div className="adv-result-hdr-title">AI Prediction Report</div>
              <div className="adv-result-hdr-sub">Generated using Groq Llama-3 · Live market data</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className="adv-badge pos"><CheckCircle size={10} /> Live</span>
            </div>
          </div>
          <div className="adv-result-body">
            <div className="adv-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.advice) }} />
            {result.marketData?.length > 0 && (
              <>
                <hr className="adv-divider" />
                <div className="adv-stocks-section">
                  <div className="adv-stocks-label">Market Snapshot Used in Analysis</div>
                  <div className="adv-stocks-grid">
                    {result.marketData.map(s => <StockTile key={s.symbol} stock={s} />)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
