import { useEffect, useState, useRef } from 'react';
import API from '../api';
import {
  Brain, Search, DollarSign, Shield, Clock, Zap,
  Target, LayoutDashboard, RefreshCw, TrendingUp,
  TrendingDown, Minus, ChevronRight, AlertTriangle,
  CheckCircle, BarChart2, PieChart, Repeat
} from 'lucide-react';

/* ─── STYLES ─────────────────────────────────────────────── */
const AI_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');

.inv-root {
  --blue:       #4f9cf9;
  --blue-dim:   rgba(79,156,249,.12);
  --blue-ring:  rgba(79,156,249,.25);
  --green:      #3ecf8e;
  --red:        #f87171;
  --amber:      #fbbf24;
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
}

/* ── Hero ── */
.inv-hero {
  position: relative;
  padding: 3.5rem 1.5rem 2.5rem;
  overflow: hidden;
}
.inv-hero-noise {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
}
.inv-hero-glow {
  position: absolute; top: -60px; right: -100px;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(79,156,249,.07) 0%, transparent 70%);
  pointer-events: none;
}
.inv-chip {
  display: inline-flex; align-items: center; gap: .5rem;
  background: var(--blue-dim); border: 1px solid var(--blue-ring);
  border-radius: 100px; padding: .3rem .85rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: .65rem; letter-spacing: .12em; text-transform: uppercase;
  color: var(--blue); margin-bottom: 1.25rem;
}
.inv-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.inv-h1 {
  font-family: 'Lora', serif; font-size: clamp(2.2rem, 5vw, 3.8rem);
  font-weight: 600; line-height: 1.1; letter-spacing: -.02em; margin: 0;
}
.inv-h1 em { font-style: italic; color: var(--blue); }
.inv-sub { color: var(--muted2); font-size: .9rem; margin-top: .75rem; font-weight: 400; }

/* ── Form Card ── */
.inv-card {
  background: var(--s1);
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  padding: 1.75rem;
  margin: 0 1.5rem 1.5rem;
}
.inv-card-title {
  font-size: .65rem; text-transform: uppercase; letter-spacing: .15em;
  color: var(--muted); font-family: 'JetBrains Mono', monospace;
  margin-bottom: 1.5rem; display: flex; align-items: center; gap: .5rem;
}
.inv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
.inv-field { display: flex; flex-direction: column; gap: .45rem; }
.inv-field.full { grid-column: 1 / -1; }
.inv-label {
  font-family: 'JetBrains Mono', monospace; font-size: .6rem;
  text-transform: uppercase; letter-spacing: .1em; color: var(--muted);
  display: flex; align-items: center; gap: .4rem;
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
.inv-input::placeholder { color: var(--muted); }

/* Toggle row */
.inv-toggle-row { display: flex; align-items: center; gap: .75rem; padding-top: 1rem; }
.inv-toggle {
  position: relative; width: 40px; height: 22px;
  background: var(--s3); border: 1px solid var(--border2); border-radius: 100px; cursor: pointer; transition: .2s;
}
.inv-toggle.on { background: var(--blue); border-color: var(--blue); }
.inv-toggle::after {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; border-radius: 50%; background: white; transition: .2s;
}
.inv-toggle.on::after { left: 20px; }
.inv-toggle-label { font-size: .85rem; color: var(--muted2); }

/* Quick-mode buttons */
.inv-modes { display: flex; gap: .6rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
.inv-mode-btn {
  background: var(--s2); border: 1px solid var(--border); border-radius: .5rem;
  padding: .45rem .9rem; font-size: .75rem; font-weight: 600; cursor: pointer;
  color: var(--muted2); transition: all .2s; display: flex; align-items: center; gap: .4rem;
}
.inv-mode-btn:hover, .inv-mode-btn.active { background: var(--blue-dim); border-color: var(--blue-ring); color: var(--blue); }

/* Submit */
.inv-submit {
  background: var(--blue); color: #fff; border: none; border-radius: .75rem;
  padding: .8rem 1.75rem; font-family: 'Syne', sans-serif;
  font-weight: 700; font-size: .875rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: .6rem;
  transition: all .2s; width: 100%;
}
.inv-submit:hover:not(:disabled) { background: #3a8ae8; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,156,249,.25); }
.inv-submit:disabled { opacity: .45; cursor: not-allowed; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin .8s linear infinite; }

/* ── Loading ── */
.inv-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 5rem 0; gap: 1.25rem;
}
.inv-loading-ring {
  width: 44px; height: 44px; border-radius: 50%;
  border: 2px solid var(--border2); border-top-color: var(--blue);
  animation: spin .8s linear infinite;
}
.inv-loading-text {
  font-family: 'JetBrains Mono', monospace; font-size: .65rem;
  text-transform: uppercase; letter-spacing: .15em; color: var(--muted);
}

/* ── Result Card ── */
.inv-result { margin: 0 1.5rem; animation: fadeUp .45s ease forwards; }
@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

.inv-result-hdr {
  background: linear-gradient(135deg, var(--s1), var(--s2));
  border: 1px solid var(--border2); border-bottom: none;
  border-radius: 1.25rem 1.25rem 0 0;
  padding: 1.25rem 1.75rem;
  display: flex; align-items: center; gap: .875rem;
}
.inv-result-hdr-title { font-family: 'Lora', serif; font-size: 1.15rem; }
.inv-result-hdr-sub { font-size: .75rem; color: var(--muted2); margin-top: .15rem; }

.inv-result-body {
  background: var(--s1); border: 1px solid var(--border2); border-top: none;
  border-radius: 0 0 1.25rem 1.25rem; padding: 2rem 1.75rem;
}

/* Rendered markdown */
.inv-md h2 {
  font-family: 'Lora', serif; font-size: 1.2rem; font-weight: 600;
  color: var(--text); margin: 2rem 0 .875rem;
  padding-bottom: .5rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: .6rem;
}
.inv-md h2:first-child { margin-top: 0; }
.inv-md h3 { font-size: 1rem; font-weight: 600; color: var(--blue); margin: 1.25rem 0 .5rem; }
.inv-md p { color: var(--muted2); line-height: 1.75; margin: .5rem 0; font-size: .9rem; }
.inv-md strong { color: var(--text); font-weight: 600; }
.inv-md em { color: var(--blue); font-style: italic; }
.inv-md ul, .inv-md ol { padding-left: 1.25rem; margin: .5rem 0; }
.inv-md li { color: var(--muted2); line-height: 1.7; font-size: .9rem; margin-bottom: .25rem; }
.inv-md li::marker { color: var(--blue); }
.inv-md code {
  background: var(--s3); border: 1px solid var(--border);
  border-radius: .3rem; padding: .1rem .4rem;
  font-family: 'JetBrains Mono', monospace; font-size: .8rem; color: var(--amber);
}
.inv-md blockquote {
  border-left: 3px solid var(--blue); margin: 1rem 0; padding: .75rem 1.25rem;
  background: var(--blue-dim); border-radius: 0 .5rem .5rem 0;
}
.inv-md blockquote p { color: var(--text); margin: 0; }

/* Table */
.inv-md table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: .85rem; }
.inv-md thead tr { background: var(--s3); }
.inv-md th {
  font-family: 'JetBrains Mono', monospace; font-size: .65rem;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--muted); padding: .7rem 1rem; text-align: left;
  border-bottom: 1px solid var(--border2);
}
.inv-md td { padding: .65rem 1rem; border-bottom: 1px solid var(--border); color: var(--muted2); }
.inv-md tr:hover td { background: var(--s2); }
.inv-md .bull { color: var(--green); font-weight: 600; }
.inv-md .bear { color: var(--red); font-weight: 600; }

/* Divider */
.inv-divider { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }

/* Stock chips */
.inv-stocks-section { margin-top: 1.5rem; }
.inv-stocks-label {
  font-family: 'JetBrains Mono', monospace; font-size: .6rem;
  text-transform: uppercase; letter-spacing: .12em; color: var(--muted); margin-bottom: .875rem;
}
.inv-stocks-grid { display: flex; flex-wrap: wrap; gap: .875rem; }
.inv-stock-tile {
  background: var(--s2); border: 1px solid var(--border);
  border-radius: .875rem; padding: .875rem 1.125rem; min-width: 148px;
  transition: border-color .2s;
}
.inv-stock-tile:hover { border-color: var(--border2); }
.inv-stock-sym { font-family: 'JetBrains Mono', monospace; font-size: .75rem; color: var(--blue); margin-bottom: .35rem; }
.inv-stock-price { font-family: 'JetBrains Mono', monospace; font-size: 1.05rem; font-weight: 500; display: flex; align-items: baseline; gap: .4rem; }
.inv-stock-inr { font-size: .7rem; color: var(--muted2); margin-top: .2rem; font-family: 'JetBrains Mono', monospace; }
.inv-stock-change { font-size: .72rem; }
.inv-stock-change.up { color: var(--green); }
.inv-stock-change.dn { color: var(--red); }
.inv-stock-sent { font-size: .65rem; color: var(--muted); margin-top: .3rem; font-family: 'JetBrains Mono', monospace; }

/* Sentiment badge */
.inv-sent-badge { display: inline-flex; align-items: center; gap: .3rem; font-size: .65rem; font-family: 'JetBrains Mono', monospace; padding: .2rem .55rem; border-radius: 100px; }
.inv-sent-badge.pos { background: rgba(62,207,142,.1); color: var(--green); border: 1px solid rgba(62,207,142,.2); }
.inv-sent-badge.neg { background: rgba(248,113,113,.1); color: var(--red); border: 1px solid rgba(248,113,113,.2); }
.inv-sent-badge.neu { background: var(--s3); color: var(--muted2); border: 1px solid var(--border); }
`;

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style'); s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

/* ─── MARKDOWN RENDERER ──────────────────────────────────── */
function renderMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');
  let html = '';
  let inTable = false;
  let tableHtml = '';
  let inList = false;
  let listType = '';

  const closeList = () => {
    if (inList) { html += `</${listType}>`; inList = false; listType = ''; }
  };
  const closeTable = () => {
    if (inTable) { html += tableHtml + '</tbody></table>'; inTable = false; tableHtml = ''; }
  };

  const inline = (s) => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/🟢|✅/g, '<span class="bull">$&</span>')
    .replace(/🔴|❌/g, '<span class="bear">$&</span>');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table detection
    if (trimmed.startsWith('|')) {
      if (!inTable) { closeList(); inTable = true; tableHtml = '<table><thead>'; }
      const cells = trimmed.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (trimmed.includes('---')) {
        tableHtml += '</thead><tbody>';
      } else if (!tableHtml.includes('</thead>')) {
        tableHtml += '<tr>' + cells.map(c => `<th>${inline(c.trim())}</th>`).join('') + '</tr>';
      } else {
        tableHtml += '<tr>' + cells.map(c => `<td>${inline(c.trim())}</td>`).join('') + '</tr>';
      }
      continue;
    } else { closeTable(); }

    // Headings
    if (/^#{1,2}\s/.test(trimmed)) {
      closeList();
      const content = trimmed.replace(/^#{1,2}\s/, '');
      const icons = {
        'User': '📌', 'Summary': '📌', 'Investment': '📊', 'Plan': '📊',
        'Strategy': '📈', 'SIP': '🔁', 'Risk': '⚠️', 'Portfolio': '💼',
        'Quick': '⚡', 'Advice': '💡', 'Analysis': '🔍'
      };
      const icon = Object.entries(icons).find(([k]) => content.includes(k))?.[1] ?? '▸';
      html += `<h2>${icon} ${inline(content)}</h2>`;
      continue;
    }
    if (/^#{3}\s/.test(trimmed)) {
      closeList();
      html += `<h3>${inline(trimmed.replace(/^#{3}\s/, ''))}</h3>`;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      closeList();
      html += `<blockquote><p>${inline(trimmed.slice(2))}</p></blockquote>`;
      continue;
    }

    // Unordered list
    if (/^[-*•]\s/.test(trimmed)) {
      if (!inList || listType !== 'ul') { closeList(); html += '<ul>'; inList = true; listType = 'ul'; }
      html += `<li>${inline(trimmed.replace(/^[-*•]\s/, ''))}</li>`;
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      if (!inList || listType !== 'ol') { closeList(); html += '<ol>'; inList = true; listType = 'ol'; }
      html += `<li>${inline(trimmed.replace(/^\d+\.\s/, ''))}</li>`;
      continue;
    }

    closeList();

    // Horizontal rule
    if (/^[-_*]{3,}$/.test(trimmed)) { html += '<hr class="inv-divider" />'; continue; }

    // Empty line
    if (!trimmed) { html += ''; continue; }

    // Normal paragraph
    html += `<p>${inline(trimmed)}</p>`;
  }

  closeList();
  closeTable();
  return html;
}

/* ─── STOCK TILE ─────────────────────────────────────────── */
function StockTile({ stock }) {
  const up = stock.changePercent >= 0;
  const sentScore = stock.sentimentScore ?? 0;
  const sentLabel = sentScore > 0 ? 'positive' : sentScore < 0 ? 'negative' : 'neutral';
  const sentClass = sentScore > 0 ? 'pos' : sentScore < 0 ? 'neg' : 'neu';
  const Icon = up ? TrendingUp : TrendingDown;

  return (
    <div className="inv-stock-tile">
      <div className="inv-stock-sym">{stock.symbol}</div>
      <div className="inv-stock-price">
        <span>${stock.priceUSD?.toFixed(2)}</span>
        <span className={`inv-stock-change ${up ? 'up' : 'dn'}`}>
          <Icon size={11} style={{ display: 'inline' }} />
          {up ? '+' : ''}{stock.changePercent?.toFixed(2)}%
        </span>
      </div>
      {stock.priceINR && (
        <div className="inv-stock-inr">₹{stock.priceINR?.toFixed(0)}</div>
      )}
      {stock.sentimentScore !== undefined && (
        <div style={{ marginTop: '.4rem' }}>
          <span className={`inv-sent-badge ${sentClass}`}>{sentLabel} sentiment</span>
        </div>
      )}
    </div>
  );
}

/* ─── QUICK MODE TEMPLATES ───────────────────────────────── */
const QUICK_MODES = [
  { id: 'buysell', icon: <BarChart2 size={13} />, label: 'Buy / Sell Signal', query: 'Should I buy or sell these stocks right now based on current market data?' },
  { id: 'sip', icon: <Repeat size={13} />, label: 'SIP Plan', query: 'Create a monthly SIP investment plan for long-term wealth creation with the given budget.' },
  { id: 'emergency', icon: <AlertTriangle size={13} />, label: 'Liquid Strategy', query: 'I need to invest but may need to withdraw in an emergency within 3–6 months. What is the safest strategy?' },
  { id: 'longterm', icon: <TrendingUp size={13} />, label: 'Long-Term Wealth', query: 'Design a long-term portfolio strategy to maximize wealth over 5+ years with the given stocks.' },
  { id: 'diversify', icon: <PieChart size={13} />, label: 'Diversify', query: 'How should I diversify my portfolio across these symbols to minimize risk?' },
];

/* ─── MAIN COMPONENT ─────────────────────────────────────── */
export default function AIPredictor() {
  const [query, setQuery] = useState('');
  const [symbols, setSymbols] = useState('AAPL, NVDA, MSFT');
  const [budget, setBudget] = useState(500000);
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [horizon, setHorizon] = useState('medium');
  const [needsLiquidity, setNeedsLiquidity] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(null);
  const resultRef = useRef(null);

  useEffect(() => { injectStyles('inv-styles', AI_CSS); }, []);

  const applyMode = (mode) => {
    setActiveMode(mode.id);
    setQuery(mode.query);
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await API.post('/ai/predict', {
        query,
        symbols: symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
        budget,
        riskTolerance,
        horizon,
        needsLiquidity,
      });
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inv-root">

      {/* Hero */}
      <div className="inv-hero">
        <div className="inv-hero-noise" />
        <div className="inv-hero-glow" />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 .25rem' }}>
          <div className="inv-chip">
            <span className="inv-dot" />
            Neural Strategy Engine
          </div>
          <h1 className="inv-h1">AI <em>Investment</em><br />Predictor</h1>
          <p className="inv-sub">
            Groq Llama-3 · Real-time Finnhub data · INR/USD aware
          </p>
        </div>
      </div>

      {/* Quick Mode Selector */}
      <div style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '.6rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted)', marginBottom: '.75rem' }}>
          Quick Analysis Templates
        </div>
        <div className="inv-modes">
          {QUICK_MODES.map(m => (
            <button
              key={m.id}
              className={`inv-mode-btn ${activeMode === m.id ? 'active' : ''}`}
              onClick={() => applyMode(m)}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="inv-card">
        <div className="inv-card-title"><Brain size={12} /> Configure Analysis</div>
        <div className="inv-grid">

          <div className="inv-field full">
            <label className="inv-label"><Search size={11} /> Strategic Query</label>
            <textarea
              className="inv-input"
              rows={3}
              style={{ resize: 'vertical' }}
              placeholder="e.g. I have ₹5L, want to invest for 2 years with high risk tolerance. Where should I put my money?"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          <div className="inv-field">
            <label className="inv-label"><DollarSign size={11} /> Capital (INR)</label>
            <input
              type="number"
              className="inv-input"
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
            />
          </div>

          <div className="inv-field">
            <label className="inv-label"><Target size={11} /> Watchlist Symbols</label>
            <input
              className="inv-input"
              placeholder="AAPL, NVDA, TSLA"
              value={symbols}
              onChange={e => setSymbols(e.target.value)}
            />
          </div>

          <div className="inv-field">
            <label className="inv-label"><Shield size={11} /> Risk Profile</label>
            <select className="inv-select" value={riskTolerance} onChange={e => setRiskTolerance(e.target.value)}>
              <option value="low">Conservative (Capital Protection)</option>
              <option value="moderate">Moderate (Balanced Growth)</option>
              <option value="high">Aggressive (Max Returns)</option>
            </select>
          </div>

          <div className="inv-field">
            <label className="inv-label"><Clock size={11} /> Investment Horizon</label>
            <select className="inv-select" value={horizon} onChange={e => setHorizon(e.target.value)}>
              <option value="short">Short Term (under 6 months)</option>
              <option value="medium">Medium Term (1–2 years)</option>
              <option value="long">Long Term (3+ years)</option>
            </select>
          </div>

          <div className="inv-field" style={{ justifyContent: 'flex-end' }}>
            <div
              className="inv-toggle-row"
              style={{ cursor: 'pointer' }}
              onClick={() => setNeedsLiquidity(v => !v)}
            >
              <div className={`inv-toggle ${needsLiquidity ? 'on' : ''}`} />
              <span className="inv-toggle-label">Prioritize Liquidity / Emergency Access</span>
            </div>
          </div>

          <div className="inv-field full" style={{ marginTop: '.5rem' }}>
            <button className="inv-submit" onClick={handleSubmit} disabled={loading || !query.trim()}>
              {loading
                ? <><RefreshCw size={15} className="spin" /> Analyzing Market Intelligence...</>
                : <><Zap size={15} /> Execute Predictive Analysis <ChevronRight size={14} /></>}
            </button>
          </div>

        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="inv-loading">
          <div className="inv-loading-ring" />
          <div className="inv-loading-text">Sequencing market data &amp; building prediction...</div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="inv-result" ref={resultRef}>
          <div className="inv-result-hdr">
            <LayoutDashboard size={20} color="var(--blue)" />
            <div>
              <div className="inv-result-hdr-title">AI Prediction Report</div>
              <div className="inv-result-hdr-sub">Generated using Groq Llama-3 · Live market data</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className="inv-sent-badge pos"><CheckCircle size={10} /> Live</span>
            </div>
          </div>

          <div className="inv-result-body">
            {/* Markdown output */}
            <div
              className="inv-md"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(result.advice) }}
            />

            {/* Market snapshot */}
            {result.marketData?.length > 0 && (
              <>
                <hr className="inv-divider" />
                <div className="inv-stocks-section">
                  <div className="inv-stocks-label">Market Snapshot Used in Analysis</div>
                  <div className="inv-stocks-grid">
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