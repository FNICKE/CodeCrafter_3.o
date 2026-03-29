import { useEffect, useState } from 'react';
import API from '../api';
import { ShieldCheck, ShieldAlert, Shield, RefreshCw, ExternalLink } from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');
  .tf-root {
    --blue:#3b9eff;--blue-glow:rgba(59,158,255,.14);--blue-border:rgba(59,158,255,.22);
    --obsidian:#080b0f;--surface:#0e1318;--surface2:#141b22;--surface3:#1c2630;
    --border:rgba(255,255,255,.06);--text:#e8edf2;--muted:#5a6878;--muted2:#8a9ab0;
    --green:#34d399;--red:#f87171;--amber:#f59e0b;
    font-family:'Instrument Sans',sans-serif;background:var(--obsidian);color:var(--text);min-height:100vh;padding-bottom:4rem;
  }
  .tf-hero{position:relative;padding:3rem 0 2rem;overflow:hidden;}
  .tf-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 55% 80% at 5% 60%,rgba(59,158,255,.08) 0%,transparent 70%);pointer-events:none;}
  .tf-hero-grid{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 75% 100% at 5% 60%,black 20%,transparent 80%);opacity:.35;}
  .tf-eyebrow{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem;}
  .tf-eyebrow::before{content:'';width:2rem;height:1px;background:var(--blue);display:inline-block;}
  .tf-title{font-family:'DM Serif Display',serif;font-size:clamp(2.4rem,5vw,4rem);line-height:1.05;letter-spacing:-.02em;margin:0;}
  .tf-title em{font-style:italic;color:var(--blue);}
  .tf-subtitle{color:var(--muted2);font-size:.95rem;margin-top:.65rem;line-height:1.6;}
  .tf-live{width:8px;height:8px;border-radius:50%;background:var(--blue);animation:tfPulse 2s ease-out infinite;flex-shrink:0;}
  @keyframes tfPulse{0%,100%{box-shadow:0 0 0 0 rgba(59,158,255,.6)}50%{box-shadow:0 0 0 6px rgba(59,158,255,0)}}
  .tf-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:1rem;overflow:hidden;margin-bottom:2rem;}
  .tf-sum-cell{background:var(--surface);padding:1.25rem 1rem;text-align:center;}
  .tf-sum-val{font-family:'DM Mono',monospace;font-size:1.4rem;font-weight:500;}
  .tf-sum-lbl{font-family:'DM Mono',monospace;font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-top:.25rem;}
  @media(max-width:640px){.tf-summary{grid-template-columns:repeat(2,1fr);}}
  .tf-filters{display:flex;gap:.5rem;margin-bottom:1.5rem;flex-wrap:wrap;}
  .tf-filter-btn{padding:.45rem 1rem;border-radius:.75rem;font-size:.78rem;font-weight:600;border:1px solid var(--border);background:var(--surface2);color:var(--muted2);cursor:pointer;transition:all .2s;font-family:'Instrument Sans',sans-serif;}
  .tf-filter-btn.active{background:var(--blue);color:#fff;border-color:var(--blue);box-shadow:0 0 16px var(--blue-glow);}
  .tf-filter-btn:not(.active):hover{background:var(--surface3);color:var(--text);border-color:var(--blue-border);}
  .tf-card{background:var(--surface);border:1px solid var(--border);border-radius:1.25rem;padding:1.25rem;margin-bottom:.875rem;transition:border-color .2s,box-shadow .2s;display:flex;gap:1.25rem;align-items:flex-start;}
  .tf-card:hover{border-color:var(--blue-border);box-shadow:0 4px 20px var(--blue-glow);}
  .tf-score-badge{flex-shrink:0;width:56px;height:56px;border-radius:.875rem;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'DM Mono',monospace;}
  .tf-score-num{font-size:1.15rem;font-weight:500;line-height:1;}
  .tf-score-tier{font-size:.5rem;text-transform:uppercase;letter-spacing:.08em;margin-top:.2rem;opacity:.8;}
  .tf-card-body{flex:1;min-width:0;}
  .tf-card-source{font-family:'DM Mono',monospace;font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:.35rem;}
  .tf-card-headline{font-size:.9rem;font-weight:600;color:var(--text);line-height:1.4;margin-bottom:.5rem;}
  .tf-card-summary{font-size:.78rem;color:var(--muted2);line-height:1.55;margin-bottom:.75rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .tf-card-footer{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;}
  .tf-breakdown{display:flex;gap:.75rem;flex-wrap:wrap;}
  .tf-breakdown-item{font-family:'DM Mono',monospace;font-size:.62rem;color:var(--muted);}
  .tf-breakdown-item span{color:var(--muted2);}
  .tf-ext-link{display:inline-flex;align-items:center;gap:.3rem;font-size:.72rem;color:var(--blue);text-decoration:none;font-family:'DM Mono',monospace;margin-left:auto;}
  .tf-ext-link:hover{text-decoration:underline;}
  .tf-skel{background:var(--surface);border:1px solid var(--border);border-radius:1.25rem;margin-bottom:.875rem;position:relative;overflow:hidden;}
  .tf-skel::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 30%,rgba(255,255,255,.04) 50%,transparent 70%);background-size:200% 100%;animation:tfShim 1.6s ease-in-out infinite;}
  @keyframes tfShim{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes tfFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .tf-fade{animation:tfFadeUp .4s ease both;}
  .tf-refresh-btn{display:flex;align-items:center;gap:.5rem;padding:.55rem 1.1rem;border-radius:.75rem;font-size:.8rem;font-weight:600;border:1px solid var(--border);background:var(--surface2);color:var(--muted2);cursor:pointer;transition:all .2s;}
  .tf-refresh-btn:hover:not(:disabled){background:var(--surface3);color:var(--text);border-color:var(--blue-border);}
  .tf-refresh-btn:disabled{opacity:.4;cursor:not-allowed;}
  .tf-error{padding:1.25rem;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:1rem;color:#f87171;margin-bottom:1.5rem;font-size:.85rem;}
  @keyframes spin{to{transform:rotate(360deg)}}
`;

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style'); s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

function tierColor(tier) {
  if (tier === 'High')   return { bg: 'rgba(52,211,153,.12)', border: 'rgba(52,211,153,.25)', color: '#34d399' };
  if (tier === 'Medium') return { bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.25)', color: '#f59e0b' };
  if (tier === 'Low')    return { bg: 'rgba(248,113,113,.12)', border: 'rgba(248,113,113,.25)', color: '#f87171' };
  return { bg: 'rgba(90,104,120,.12)', border: 'rgba(90,104,120,.25)', color: '#5a6878' };
}

function TierIcon({ tier, size = 18 }) {
  const c = tierColor(tier).color;
  if (tier === 'High')   return <ShieldCheck size={size} color={c} />;
  if (tier === 'Medium') return <Shield size={size} color={c} />;
  return <ShieldAlert size={size} color={c} />;
}

const TIER_FILTERS = ['All', 'High', 'Medium', 'Low'];

export default function TrustFeed() {
  useEffect(() => { injectStyles('tf-styles', CSS); }, []);

  const [articles, setArticles] = useState([]);
  const [meta,     setMeta]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState('All');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.get('/trust/feed'); // ✅ uses API instance with auth token
      setArticles(data.articles || []);
      setMeta(data.meta || null);
    } catch (e) {
      console.error('[TrustFeed]', e.response?.status, e.response?.data);
      setError(e.response?.data?.message || e.message || 'Failed to load trust feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'All' ? articles : articles.filter(a => a.trust_tier === filter);

  return (
<div className="tf-root" >
          <div style={{ margin: '0', padding: '0 1.25rem' }}>

        {/* Hero */}
        <div className="tf-hero">
          <div className="tf-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="tf-eyebrow"><span className="tf-live" /> Veracity Engine</div>
            <h1 className="tf-title">Trust &amp; <em>Credibility</em><br />Scoring</h1>
            <p className="tf-subtitle">Every article scored by source reputation, recency, content depth &amp; sentiment consistency — no more random trust scores.</p>
          </div>
        </div>

        {/* Error */}
        {error && <div className="tf-error">⚠ {error}</div>}

        {/* Summary */}
        {meta && (
          <div className="tf-summary tf-fade">
            {[
              { val: meta.total,               lbl: 'Articles Scored',  color: 'var(--blue)' },
              { val: meta.avg_trust_score,      lbl: 'Avg Trust Score',  color: 'var(--blue)' },
              { val: meta.high_trust,           lbl: 'High Trust',       color: '#34d399'      },
              { val: meta.low_trust,            lbl: 'Low / Unverified', color: '#f87171'      },
            ].map(({ val, lbl, color }) => (
              <div key={lbl} className="tf-sum-cell">
                <div className="tf-sum-val" style={{ color }}>{val}</div>
                <div className="tf-sum-lbl">{lbl}</div>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="tf-filters">
            {TIER_FILTERS.map(t => (
              <button key={t} className={`tf-filter-btn ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading} className="tf-refresh-btn">
            <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
        </div>

        {/* Articles */}
        {loading
          ? [1,2,3,4,5].map(i => <div key={i} className="tf-skel" style={{ height: 110 }} />)
          : filtered.length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--muted2)', padding: '3rem 0' }}>No articles found.</div>
            : filtered.map((a, i) => {
                const tc = tierColor(a.trust_tier);
                return (
                  <div key={a.id || i} className="tf-card tf-fade" style={{ animationDelay: `${i * 0.04}s` }}>
                    {/* Score badge */}
                    <div className="tf-score-badge" style={{ background: tc.bg, border: `1px solid ${tc.border}` }}>
                      <div className="tf-score-num" style={{ color: tc.color }}>{a.trust_score}</div>
                      <div className="tf-score-tier" style={{ color: tc.color }}>{a.trust_tier}</div>
                    </div>

                    <div className="tf-card-body">
                      <div className="tf-card-source">
                        <TierIcon tier={a.trust_tier} size={11} />
                        {' '}{a.source || 'Unknown Source'}
                      </div>
                      <div className="tf-card-headline">{a.headline}</div>
                      {a.summary && <div className="tf-card-summary">{a.summary}</div>}
                      <div className="tf-card-footer">
                        <div className="tf-breakdown">
                          {Object.entries(a.trust_breakdown || {}).map(([k, v]) => (
                            <span key={k} className="tf-breakdown-item">
                              {k}: <span>{v}</span>
                            </span>
                          ))}
                        </div>
                        {a.url && (
                          <a href={a.url} target="_blank" rel="noopener noreferrer" className="tf-ext-link">
                            Read <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
        }
      </div>
    </div>
  );
}