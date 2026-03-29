import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck, Layers, BarChart3, Zap, Globe2, Cpu,
  ArrowRight, PieChart, Activity, Sparkles, TrendingUp,
  Lock, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── Animated counter ──────────────────────────────────────────────────────── */
function useCounter(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return val;
}

/* ─── Intersection observer ─────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── Stat Card ─────────────────────────────────────────────────────────────── */
function StatCard({ number, suffix = '', label, delay = 0 }) {
  const [ref, inView] = useInView();
  const count = useCounter(number, 1800, inView);
  return (
    <div ref={ref} className="ht-stat-card" style={{ animationDelay: `${delay}s` }}>
      <div className="ht-stat-number">{count}{suffix}</div>
      <div className="ht-stat-label">{label}</div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital,wght@0,400;1,400&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ht-page {
    --blue:        #3b9eff;
    --blue-dim:    #1a7ee0;
    --blue-glow:   rgba(59,158,255,.14);
    --blue-line:   rgba(59,158,255,.22);
    --blue-faint:  rgba(59,158,255,.07);
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
    background: var(--obsidian);
    color: var(--text);
    font-family: 'Instrument Sans', sans-serif;
    overflow-x: hidden;
  }

  .ht-page ::-webkit-scrollbar { width: 3px; }
  .ht-page ::-webkit-scrollbar-track { background: var(--obsidian); }
  .ht-page ::-webkit-scrollbar-thumb { background: var(--blue-dim); border-radius: 99px; }

  /* ── NAV ──────────────────────────────────────────────────────────────────── */
  .ht-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 3rem; height: 70px;
    transition: background .4s, border-color .4s;
  }
  .ht-nav.scrolled {
    background: rgba(8,11,15,.92);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid var(--border);
  }
  .ht-nav-logo { display: flex; align-items: center; gap: .75rem; text-decoration: none; }
  .ht-nav-logo-icon {
    width: 38px; height: 38px; border-radius: .75rem;
    background: linear-gradient(135deg, var(--blue) 0%, var(--blue-dim) 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px var(--blue-glow);
  }
  .ht-nav-name {
    font-family: 'DM Serif Display', serif;
    font-size: 1.2rem; color: var(--text); line-height: 1;
  }
  .ht-nav-name em { font-style: italic; color: var(--blue); }
  .ht-nav-tagline {
    font-family: 'DM Mono', monospace; font-size: .58rem;
    text-transform: uppercase; letter-spacing: .12em; color: var(--blue);
    margin-top: .2rem;
  }
  .ht-nav-links {
    display: flex; align-items: center; gap: 2rem;
    font-size: .78rem; font-weight: 500; letter-spacing: .06em;
    text-transform: uppercase; color: var(--muted2);
  }
  .ht-nav-links a { color: inherit; text-decoration: none; transition: color .2s; }
  .ht-nav-links a:hover { color: var(--blue); }
  .ht-nav-cta {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .6rem 1.4rem; border-radius: .75rem;
    background: var(--blue); color: #fff;
    font-size: .78rem; font-weight: 700; letter-spacing: .06em;
    text-transform: uppercase; border: none; cursor: pointer;
    transition: background .2s, box-shadow .2s, transform .2s;
    font-family: 'Instrument Sans', sans-serif;
  }
  .ht-nav-cta:hover { background: var(--blue-dim); box-shadow: 0 4px 20px var(--blue-glow); transform: translateY(-1px); }

  /* ── HERO ─────────────────────────────────────────────────────────────────── */
  .ht-hero {
    position: relative;
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 6rem 3rem 0;
    overflow: hidden;
  }
  .ht-hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(59,158,255,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,158,255,.04) 1px, transparent 1px);
    background-size: 72px 72px;
    pointer-events: none;
  }
  .ht-hero-glow {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 50% 30%, rgba(59,158,255,.09) 0%, transparent 70%),
      radial-gradient(ellipse 40% 40% at 15% 70%, rgba(59,158,255,.05) 0%, transparent 60%);
    pointer-events: none;
  }
  .ht-hero-fade {
    position: absolute; bottom: 0; left: 0; right: 0; height: 35%;
    background: linear-gradient(to top, var(--obsidian), transparent);
    pointer-events: none;
  }
  /* Corner brackets */
  .ht-corner-tl, .ht-corner-br {
    position: absolute; width: 180px; height: 180px; pointer-events: none;
  }
  .ht-corner-tl { top: 24px; left: 24px; border-top: 1px solid var(--blue-line); border-left: 1px solid var(--blue-line); }
  .ht-corner-br { bottom: 24px; right: 24px; border-bottom: 1px solid var(--blue-line); border-right: 1px solid var(--blue-line); }

  .ht-hero-content {
    position: relative; z-index: 2;
    text-align: center; max-width: 860px;
    opacity: 0; transform: translateY(32px);
    transition: opacity .9s ease, transform .9s ease;
  }
  .ht-hero-content.visible { opacity: 1; transform: translateY(0); }

  .ht-eyebrow {
    display: inline-flex; align-items: center; gap: .625rem;
    font-family: 'DM Mono', monospace;
    font-size: .65rem; letter-spacing: .2em; text-transform: uppercase;
    color: var(--blue);
    border: 1px solid var(--blue-line);
    padding: .45rem 1.1rem; border-radius: 99px;
    margin-bottom: 2.5rem;
  }
  .ht-eyebrow-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--blue);
    box-shadow: 0 0 6px var(--blue);
    animation: htBlink 2s infinite;
  }
  @keyframes htBlink { 0%,100%{opacity:1} 50%{opacity:.2} }

  .ht-hero-h1 {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(3rem, 7vw, 5.6rem);
    font-weight: 400; line-height: 1.05; letter-spacing: -.02em;
    color: var(--text); margin-bottom: 1rem;
  }
  .ht-hero-h1 em { font-style: italic; color: var(--blue); }

  .ht-hero-rule { width: 56px; height: 1px; background: var(--blue-line); margin: 1.75rem auto; }

  .ht-hero-sub {
    font-size: 1.05rem; font-weight: 400; color: var(--muted2);
    line-height: 1.8; max-width: 540px; margin: 0 auto 3rem;
  }

  .ht-hero-actions {
    display: flex; align-items: center; justify-content: center;
    gap: 1rem; flex-wrap: wrap;
  }

  .ht-btn-primary {
    display: inline-flex; align-items: center; gap: .625rem;
    padding: 1rem 2.25rem; border-radius: .875rem;
    background: var(--blue); color: #fff;
    font-family: 'Instrument Sans', sans-serif;
    font-size: .85rem; font-weight: 700; letter-spacing: .06em;
    text-transform: uppercase; border: none; cursor: pointer;
    transition: background .2s, box-shadow .2s, transform .2s;
    box-shadow: 0 4px 24px var(--blue-glow);
  }
  .ht-btn-primary:hover { background: var(--blue-dim); box-shadow: 0 6px 32px rgba(59,158,255,.35); transform: translateY(-2px); }

  .ht-btn-secondary {
    display: inline-flex; align-items: center; gap: .625rem;
    padding: .95rem 2.25rem; border-radius: .875rem;
    background: transparent; color: var(--muted2);
    font-family: 'Instrument Sans', sans-serif;
    font-size: .85rem; font-weight: 600; letter-spacing: .06em;
    text-transform: uppercase; border: 1px solid var(--border); cursor: pointer;
    transition: border-color .2s, color .2s, background .2s;
  }
  .ht-btn-secondary:hover { border-color: var(--blue-line); color: var(--text); background: var(--blue-faint); }

  /* ── TICKER STRIP ─────────────────────────────────────────────────────────── */
  .ht-ticker-wrap {
    position: relative; z-index: 2; width: 100%;
    margin-top: 5rem;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 12px 0; overflow: hidden;
  }
  .ht-ticker-inner {
    display: flex; gap: 3.5rem; white-space: nowrap;
    animation: htTick 28s linear infinite;
  }
  @keyframes htTick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .ht-ticker-item {
    display: inline-flex; align-items: center; gap: .625rem;
    font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: .06em;
    color: var(--muted);
  }
  .ht-ticker-item .sym  { color: var(--blue); font-weight: 500; }
  .ht-ticker-item .up   { color: var(--green); }
  .ht-ticker-item .dn   { color: var(--red);   }

  /* ── STATS BAND ───────────────────────────────────────────────────────────── */
  .ht-stats-band {
    display: grid; grid-template-columns: repeat(4, 1fr);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .ht-stat-card {
    padding: 3rem 2rem; border-right: 1px solid var(--border);
    text-align: center; position: relative; overflow: hidden;
    transition: background .3s;
  }
  .ht-stat-card:last-child { border-right: none; }
  .ht-stat-card:hover { background: var(--surface); }
  .ht-stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--blue), transparent);
    opacity: 0; transition: opacity .3s;
  }
  .ht-stat-card:hover::before { opacity: 1; }
  .ht-stat-number {
    font-family: 'DM Serif Display', serif;
    font-size: 3.5rem; font-weight: 400; line-height: 1;
    color: var(--blue); margin-bottom: .5rem;
  }
  .ht-stat-label {
    font-family: 'DM Mono', monospace;
    font-size: .62rem; letter-spacing: .14em;
    text-transform: uppercase; color: var(--muted);
  }

  /* ── SECTION SHARED ───────────────────────────────────────────────────────── */
  .ht-section { padding: 7rem 4rem; }
  .ht-section-inner { max-width: 1200px; margin: 0 auto; }
  .ht-section-label {
    display: flex; align-items: center; gap: .875rem;
    font-family: 'DM Mono', monospace; font-size: .62rem;
    letter-spacing: .2em; text-transform: uppercase; color: var(--blue);
    margin-bottom: 2rem;
  }
  .ht-section-label::before { content: ''; width: 2rem; height: 1px; background: var(--blue-dim); }
  .ht-section-h2 {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(2.2rem, 4vw, 3.4rem); font-weight: 400; line-height: 1.15;
    color: var(--text); margin-bottom: 1rem;
  }
  .ht-section-h2 em { font-style: italic; color: var(--blue); }

  /* ── FEATURES ─────────────────────────────────────────────────────────────── */
  .ht-features-bg { background: var(--surface); }
  .ht-features-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    border: 1px solid var(--border);
    margin-top: 3.5rem;
  }
  .ht-feat-card {
    padding: 2.5rem 2rem;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    position: relative; cursor: pointer;
    transition: background .3s;
    opacity: 0; transform: translateY(20px);
  }
  .ht-feat-card.visible { animation: htFadeUp .6s forwards; }
  @keyframes htFadeUp { to { opacity: 1; transform: translateY(0); } }
  .ht-feat-card:nth-child(3n)      { border-right: none; }
  .ht-feat-card:nth-last-child(-n+3) { border-bottom: none; }
  .ht-feat-card:hover { background: var(--surface2); }
  .ht-feat-card::after {
    content: ''; position: absolute; bottom: 0; left: 0;
    height: 2px; width: 0; background: var(--blue);
    transition: width .4s ease;
  }
  .ht-feat-card:hover::after { width: 100%; }
  .ht-feat-icon {
    width: 44px; height: 44px;
    background: var(--blue-faint); border: 1px solid var(--blue-line);
    border-radius: .75rem;
    display: flex; align-items: center; justify-content: center;
    color: var(--blue); margin-bottom: 1.5rem;
    transition: background .3s, box-shadow .3s;
  }
  .ht-feat-card:hover .ht-feat-icon { background: var(--blue-glow); box-shadow: 0 0 16px var(--blue-glow); }
  .ht-feat-title { font-size: .95rem; font-weight: 700; color: var(--text); margin-bottom: .75rem; }
  .ht-feat-desc  { font-size: .82rem; color: var(--muted2); line-height: 1.75; }
  .ht-feat-arrow {
    position: absolute; top: 2.5rem; right: 2rem;
    color: var(--muted); transition: color .3s, transform .3s;
  }
  .ht-feat-card:hover .ht-feat-arrow { color: var(--blue); transform: translateX(4px); }

  /* ── BENTO ────────────────────────────────────────────────────────────────── */
  .ht-bento-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 1px; background: var(--border);
    border: 1px solid var(--border); margin-top: 3.5rem;
  }
  .ht-bento-cell {
    background: var(--surface); padding: 2.5rem;
    transition: background .3s;
  }
  .ht-bento-cell:hover { background: var(--surface2); }
  .ht-bento-large { grid-column: span 2; }
  .ht-bento-lbl {
    font-family: 'DM Mono', monospace; font-size: .6rem;
    letter-spacing: .14em; text-transform: uppercase; color: var(--muted);
    margin-bottom: 1rem;
  }
  .ht-bento-val {
    font-family: 'DM Serif Display', serif;
    font-size: 3rem; font-weight: 400; color: var(--blue); line-height: 1;
    margin-bottom: .5rem;
  }
  .ht-bento-desc { font-size: .82rem; color: var(--muted2); line-height: 1.7; max-width: 320px; }
  .ht-bento-list { margin-top: 1.5rem; display: flex; flex-direction: column; gap: .75rem; }
  .ht-bento-list-item {
    display: flex; align-items: flex-start; gap: .75rem;
    font-size: .82rem; color: var(--muted2); line-height: 1.6;
  }
  .ht-bento-list-item::before {
    content: ''; width: 4px; height: 4px; border-radius: 50%;
    background: var(--blue); margin-top: 8px; flex-shrink: 0;
  }

  /* ── MOAT ─────────────────────────────────────────────────────────────────── */
  .ht-moat-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 1px; background: var(--border);
    border: 1px solid var(--border); margin-top: 3.5rem;
  }
  .ht-moat-cell {
    background: var(--surface); padding: 3rem 2.5rem;
    position: relative; transition: background .3s;
  }
  .ht-moat-cell:hover { background: var(--surface2); border-color: var(--blue-line); }
  .ht-moat-num {
    font-family: 'DM Serif Display', serif;
    font-size: 5rem; font-weight: 400; line-height: 1; margin-bottom: -.75rem;
    color: rgba(59,158,255,.08); transition: color .3s;
  }
  .ht-moat-cell:hover .ht-moat-num { color: rgba(59,158,255,.15); }
  .ht-moat-h3 { font-size: 1rem; font-weight: 700; color: var(--text); margin-bottom: .75rem; }
  .ht-moat-p  { font-size: .82rem; color: var(--muted2); line-height: 1.75; }

  /* ── CTA ──────────────────────────────────────────────────────────────────── */
  .ht-cta {
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding: 7rem 4rem; text-align: center;
    position: relative; overflow: hidden;
  }
  .ht-cta-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(59,158,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,158,255,.03) 1px, transparent 1px);
    background-size: 60px 60px; pointer-events: none;
  }
  .ht-cta-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 50% 60% at 50% 50%, rgba(59,158,255,.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .ht-cta-inner { position: relative; z-index: 2; max-width: 640px; margin: 0 auto; }
  .ht-cta-h2 {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(2.2rem, 4vw, 3.8rem); font-weight: 400; line-height: 1.15;
    color: var(--text); margin-bottom: 1.5rem;
  }
  .ht-cta-h2 em { font-style: italic; color: var(--blue); }
  .ht-cta-sub {
    font-size: .9rem; color: var(--muted2); line-height: 1.8; margin-bottom: 3rem;
  }

  /* ── FOOTER ───────────────────────────────────────────────────────────────── */
  .ht-footer {
    background: var(--obsidian); border-top: 1px solid var(--border);
    padding: 2.5rem 4rem;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 1.5rem;
  }
  .ht-footer-logo { display: flex; align-items: center; gap: .625rem; }
  .ht-footer-logo-icon {
    width: 28px; height: 28px; border-radius: .5rem;
    background: linear-gradient(135deg, var(--blue), var(--blue-dim));
    display: flex; align-items: center; justify-content: center;
  }
  .ht-footer-name {
    font-family: 'DM Serif Display', serif; font-size: 1rem; color: var(--text);
  }
  .ht-footer-name em { font-style: italic; color: var(--blue); }
  .ht-footer-copy {
    font-family: 'DM Mono', monospace; font-size: .62rem;
    color: var(--muted); letter-spacing: .08em;
  }
  .ht-footer-links {
    display: flex; gap: 2rem;
    font-family: 'DM Mono', monospace; font-size: .62rem;
    letter-spacing: .1em; text-transform: uppercase;
  }
  .ht-footer-links a { color: var(--muted); text-decoration: none; transition: color .2s; }
  .ht-footer-links a:hover { color: var(--blue); }

  /* ── RESPONSIVE ───────────────────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .ht-nav { padding: 0 1.5rem; }
    .ht-nav-links { display: none; }
    .ht-section { padding: 5rem 1.5rem; }
    .ht-stats-band { grid-template-columns: repeat(2, 1fr); }
    .ht-stat-card:nth-child(2) { border-right: none; }
    .ht-stat-card:nth-child(3) { border-right: 1px solid var(--border); }
    .ht-features-grid { grid-template-columns: 1fr; }
    .ht-feat-card { border-right: none !important; border-bottom: 1px solid var(--border) !important; }
    .ht-feat-card:last-child { border-bottom: none !important; }
    .ht-bento-grid { grid-template-columns: 1fr; }
    .ht-bento-large { grid-column: span 1; }
    .ht-moat-grid { grid-template-columns: 1fr; }
    .ht-cta { padding: 5rem 1.5rem; }
    .ht-footer { flex-direction: column; text-align: center; padding: 2rem 1.5rem; }
  }
  @media (max-width: 600px) {
    .ht-hero { padding: 5rem 1.5rem 0; }
    .ht-stats-band { grid-template-columns: 1fr 1fr; }
    .ht-hero-actions { flex-direction: column; width: 100%; }
    .ht-btn-primary, .ht-btn-secondary { width: 100%; justify-content: center; }
  }
`;

function injectStyles() {
  if (document.getElementById('ht-home-styles')) return;
  const s = document.createElement('style');
  s.id = 'ht-home-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

const FEATURES = [
  { icon: Layers,      title: 'Unified Data Nexus',    desc: 'A single, continuously updated source of truth aggregating 500+ financial data streams, research reports, and regulatory filings.' },
  { icon: ShieldCheck, title: 'Veracity Engine',       desc: 'Proprietary cross-source verification assigns credibility scores to every data point before it reaches your screen.' },
  { icon: Cpu,         title: 'Dynamic Portfolio AI',  desc: 'Multi-objective optimization simultaneously balancing risk, factor exposure, liquidity constraints, and regulatory limits.' },
  { icon: BarChart3,   title: 'Real-Time Sentiment',   desc: 'NLP-driven market sentiment analysis across verified news streams with anomaly detection and trend forecasting.' },
  { icon: PieChart,    title: 'Precision Construction',desc: 'Portfolio building models that account for tail risk, macro shifts, and factor dynamics — far beyond simplistic mean-variance.' },
  { icon: Globe2,      title: 'Regulatory Radar',      desc: 'Live compliance monitoring across 40+ jurisdictions, embedded directly into every investment recommendation.' },
];

const TICKER_DATA = [
  { sym: 'AAPL',  p: '189.42', d: '+1.2%',  up: true  },
  { sym: 'MSFT',  p: '412.88', d: '+0.7%',  up: true  },
  { sym: 'GOOGL', p: '175.64', d: '-0.3%',  up: false },
  { sym: 'JPM',   p: '219.31', d: '+1.8%',  up: true  },
  { sym: 'GS',    p: '484.70', d: '+0.5%',  up: true  },
  { sym: 'BRK.B', p: '403.20', d: '-0.1%',  up: false },
  { sym: 'NVDA',  p: '875.50', d: '+2.1%',  up: true  },
  { sym: 'TSLA',  p: '251.10', d: '-1.5%',  up: false },
  { sym: 'AMZN',  p: '185.90', d: '+0.9%',  up: true  },
  { sym: 'BTC',   p: '68,420', d: '+3.4%',  up: true  },
];

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function Home() {
  useEffect(() => { injectStyles(); }, []);

  const navigate = useNavigate();
  const [scrolled,     setScrolled]     = useState(false);
  const [heroVisible,  setHeroVisible]  = useState(false);
  const [featRef,      featInView]      = useInView(0.1);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll); };
  }, []);

  const goToDashboard = () => navigate('/dashboard');

  const tickerItems = [...TICKER_DATA, ...TICKER_DATA];

  return (
    <div className="ht-page">

      {/* NAV */}
      <nav className={`ht-nav ${scrolled ? 'scrolled' : ''}`}>
        <a className="ht-nav-logo" href="#">
          <div className="ht-nav-logo-icon">
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <div className="ht-nav-name">Hack<em>Trix</em></div>
            <div className="ht-nav-tagline">Smart Finance</div>
          </div>
        </a>
        <div className="ht-nav-links">
          <a href="#">Platform</a>
          <a href="#">Data Sources</a>
          <a href="#">Compliance</a>
          <a href="#">Pricing</a>
        </div>
        <button className="ht-nav-cta" onClick={goToDashboard}>
          Open Dashboard <ArrowRight size={14} />
        </button>
      </nav>

      {/* HERO */}
      <section className="ht-hero">
        <div className="ht-hero-grid" />
        <div className="ht-hero-glow" />
        <div className="ht-corner-tl" />
        <div className="ht-corner-br" />

        <div className={`ht-hero-content ${heroVisible ? 'visible' : ''}`}>
          <div className="ht-eyebrow">
            <span className="ht-eyebrow-dot" />
            Unified Intelligence Platform
          </div>

          <h1 className="ht-hero-h1">
            From Fragmented Data<br />to <em>Precision</em> Capital
          </h1>

          <div className="ht-hero-rule" />

          <p className="ht-hero-sub">
            A single, continuously-learning intelligence layer that transforms scattered financial signals into institutional-grade insights — verified, optimized, and ready to act on.
          </p>

          <div className="ht-hero-actions">
            <button className="ht-btn-primary" onClick={goToDashboard}>
              Open Dashboard <ArrowRight size={16} />
            </button>
            <button className="ht-btn-secondary">Explore Platform</button>
          </div>
        </div>

        {/* Ticker */}
        <div className="ht-ticker-wrap">
          <div className="ht-ticker-inner">
            {tickerItems.map((t, i) => (
              <span key={i} className="ht-ticker-item">
                <span className="sym">{t.sym}</span>
                {t.p}
                <span className={t.up ? 'up' : 'dn'}>{t.d}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="ht-hero-fade" />
      </section>

      {/* STATS */}
      <div className="ht-stats-band">
        <StatCard number={99}  suffix="%" label="Data Accuracy Rate"        delay={0}   />
        <StatCard number={500} suffix="+" label="Global Data Sources"        delay={0.1} />
        <StatCard number={40}  suffix="+" label="Regulatory Jurisdictions"  delay={0.2} />
        <StatCard number={6}   suffix="×" label="Faster Insight Delivery"   delay={0.3} />
      </div>

      {/* FEATURES */}
      <section className="ht-section ht-features-bg">
        <div className="ht-section-inner">
          <div style={{ maxWidth: 520, marginBottom: '3.5rem' }}>
            <div className="ht-section-label">Core Capabilities</div>
            <h2 className="ht-section-h2">The <em>Intelligence Edge</em><br />Institutional Capital Demands</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--muted2)', lineHeight: 1.8, marginTop: '1rem' }}>
              Six integrated pillars working in concert to eliminate data fragmentation and power optimal portfolio decisions.
            </p>
          </div>

          <div ref={featRef} className="ht-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className={`ht-feat-card ${featInView ? 'visible' : ''}`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="ht-feat-icon"><f.icon size={20} /></div>
                <h3 className="ht-feat-title">{f.title}</h3>
                <p className="ht-feat-desc">{f.desc}</p>
                <div className="ht-feat-arrow"><ChevronRight size={16} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENTO */}
      <section className="ht-section">
        <div className="ht-section-inner">
          <div className="ht-section-label">What We Process</div>
          <h2 className="ht-section-h2">Making Sense of the<br /><em>Overwhelming Volume</em></h2>

          <div className="ht-bento-grid">
            <div className="ht-bento-cell ht-bento-large">
              <div className="ht-bento-lbl">Daily Data Points Processed</div>
              <div className="ht-bento-val">47M+</div>
              <p className="ht-bento-desc">Every market tick, news article, regulatory filing, and analyst report — ingested, reconciled, and scored for credibility in real time.</p>
              <div className="ht-bento-list">
                {[
                  'Cross-market news verification in under 200ms',
                  'Automated regulatory impact scoring per portfolio',
                  'Dynamic risk-balancing simulations on demand',
                ].map((item, i) => (
                  <div key={i} className="ht-bento-list-item">{item}</div>
                ))}
              </div>
            </div>

            <div className="ht-bento-cell">
              <div className="ht-bento-lbl">Latency</div>
              <div className="ht-bento-val" style={{ fontSize: '2.5rem' }}>&lt;200ms</div>
              <p className="ht-bento-desc">From raw data ingestion to verified insight delivery.</p>
            </div>

            <div className="ht-bento-cell">
              <div className="ht-bento-lbl">AI Models</div>
              <div className="ht-bento-val">12</div>
              <p className="ht-bento-desc">Specialized models — NLP, factor analysis, risk scoring, compliance checking.</p>
            </div>

            <div className="ht-bento-cell">
              <div className="ht-bento-lbl">Explainability</div>
              <div className="ht-bento-val" style={{ fontSize: '1.8rem' }}>Auditable AI</div>
              <p className="ht-bento-desc">Every recommendation includes a full reasoning chain to meet fiduciary standards. No black boxes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MOAT */}
      <section className="ht-section" style={{ background: 'var(--obsidian)' }}>
        <div className="ht-section-inner">
          <div className="ht-section-label">Defensible Advantage</div>
          <h2 className="ht-section-h2">Why This Is <em>Impossible<br />to Replicate</em></h2>

          <div className="ht-moat-grid">
            {[
              { n: '01', title: 'Proprietary Data Flywheel',   body: 'Every analyst interaction refines model accuracy. Competitors cannot replicate years of institutional usage data — the platform compounds its advantage continuously.' },
              { n: '02', title: 'Deep Integration Lock-In',    body: 'Embedded directly into portfolio management workflows via APIs and native connectors. Switching costs approach full infrastructure replacement.' },
              { n: '03', title: 'Regulatory IP',               body: 'A proprietary ruleset library built over three years with former SEC, FCA, and MAS compliance officers — covering 40+ frameworks and continuously updated.' },
              { n: '04', title: 'Explainability-First Design', body: 'Every AI recommendation carries an auditable reasoning chain. A fiduciary requirement no black-box solution can satisfy — and a trust moat competitors cannot easily bridge.' },
            ].map((m, i) => (
              <div key={i} className="ht-moat-cell">
                <div className="ht-moat-num">{m.n}</div>
                <h3 className="ht-moat-h3">{m.title}</h3>
                <p className="ht-moat-p">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ht-cta">
        <div className="ht-cta-grid" />
        <div className="ht-cta-glow" />
        <div className="ht-cta-inner">
          <div className="ht-section-label" style={{ justifyContent: 'center' }}>Get Started</div>
          <h2 className="ht-cta-h2">Intelligence is the<br /><em>New Alpha</em></h2>
          <p className="ht-cta-sub">
            Stop navigating fragmented data. Start making decisions with institutional-grade intelligence that verifies, synthesizes, and optimizes — continuously.
          </p>
          <div className="ht-hero-actions" style={{ justifyContent: 'center' }}>
            <button className="ht-btn-primary" onClick={goToDashboard}>
              Open Dashboard <ArrowRight size={16} />
            </button>
            <button className="ht-btn-secondary">Request Demo</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ht-footer">
        <div className="ht-footer-logo">
          <div className="ht-footer-logo-icon"><Activity size={14} color="#fff" /></div>
          <span className="ht-footer-name">Hack<em>Trix</em></span>
          <span className="ht-footer-copy" style={{ marginLeft: '1.25rem' }}>© 2026 · All Rights Reserved</span>
        </div>
        <div className="ht-footer-links">
          <a href="#">Privacy</a>
          <a href="#">Compliance</a>
          <a href="#">API Docs</a>
          <a href="#">Status</a>
        </div>
      </footer>
    </div>
  );
}