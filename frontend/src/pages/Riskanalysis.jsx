import { useEffect, useState } from 'react';
import API from '../api';
import { getPortfolios } from '../api';
import { Activity, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');
  .ra-root{--blue:#3b9eff;--blue-glow:rgba(59,158,255,.14);--blue-border:rgba(59,158,255,.22);--obsidian:#080b0f;--surface:#0e1318;--surface2:#141b22;--surface3:#1c2630;--border:rgba(255,255,255,.06);--text:#e8edf2;--muted:#5a6878;--muted2:#8a9ab0;--green:#34d399;--red:#f87171;--amber:#f59e0b;font-family:'Instrument Sans',sans-serif;background:var(--obsidian);color:var(--text);min-height:100vh;padding-bottom:4rem;}
  .ra-hero{position:relative;padding:3rem 0 2rem;overflow:hidden;}
  .ra-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 55% 80% at 5% 60%,rgba(59,158,255,.08) 0%,transparent 70%);pointer-events:none;}
  .ra-hero-grid{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 75% 100% at 5% 60%,black 20%,transparent 80%);opacity:.35;}
  .ra-eyebrow{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem;}
  .ra-eyebrow::before{content:'';width:2rem;height:1px;background:var(--blue);}
  .ra-title{font-family:'DM Serif Display',serif;font-size:clamp(2.4rem,5vw,4rem);line-height:1.05;letter-spacing:-.02em;margin:0;}
  .ra-title em{font-style:italic;color:var(--blue);}
  .ra-live{width:8px;height:8px;border-radius:50%;background:var(--blue);animation:raPulse 2s ease-out infinite;flex-shrink:0;}
  @keyframes raPulse{0%,100%{box-shadow:0 0 0 0 rgba(59,158,255,.6)}50%{box-shadow:0 0 0 6px rgba(59,158,255,0)}}
  .ra-metrics{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:2rem;}
  .ra-metric{background:var(--surface);border:1px solid var(--border);border-radius:1.25rem;padding:1.25rem;transition:border-color .2s;}
  .ra-metric:hover{border-color:var(--blue-border);}
  .ra-metric-lbl{font-family:'DM Mono',monospace;font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:.5rem;}
  .ra-metric-val{font-family:'DM Mono',monospace;font-size:1.5rem;font-weight:500;}
  .ra-metric-sub{font-size:.72rem;color:var(--muted2);margin-top:.35rem;}
  .ra-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;}
  @media(max-width:900px){.ra-grid-2{grid-template-columns:1fr;}}
  .ra-card{background:var(--surface);border:1px solid var(--border);border-radius:1.25rem;overflow:hidden;}
  .ra-card-hdr{padding:1.25rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.625rem;}
  .ra-card-title{font-family:'DM Serif Display',serif;font-size:1.2rem;}
  .ra-card-body{padding:1.25rem;}
  .ra-sector-row{display:flex;align-items:center;gap:.875rem;margin-bottom:.75rem;}
  .ra-sector-name{font-size:.8rem;color:var(--muted2);min-width:140px;}
  .ra-sector-bar-track{flex:1;height:5px;border-radius:99px;background:var(--surface2);overflow:hidden;}
  .ra-sector-bar-fill{height:100%;border-radius:99px;background:var(--blue);transition:width .6s cubic-bezier(.4,0,.2,1);}
  .ra-sector-pct{font-family:'DM Mono',monospace;font-size:.72rem;color:var(--muted2);min-width:38px;text-align:right;}
  .ra-table{width:100%;border-collapse:collapse;}
  .ra-table th{font-family:'DM Mono',monospace;font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);padding:.5rem .75rem;text-align:left;border-bottom:1px solid var(--border);}
  .ra-table td{padding:.65rem .75rem;font-size:.8rem;border-bottom:1px solid var(--border);vertical-align:middle;}
  .ra-table tr:last-child td{border-bottom:none;}
  .ra-table tr:hover td{background:rgba(59,158,255,.03);}
  .ra-rec{padding:1rem 1.25rem;border-radius:.875rem;display:flex;gap:.875rem;align-items:flex-start;margin-bottom:.75rem;}
  .ra-rec-title{font-size:.82rem;font-weight:700;margin-bottom:.25rem;}
  .ra-rec-body{font-size:.78rem;color:var(--muted2);line-height:1.55;}
  .ra-skel{background:var(--surface);border:1px solid var(--border);border-radius:1.25rem;position:relative;overflow:hidden;}
  .ra-skel::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 30%,rgba(255,255,255,.04) 50%,transparent 70%);background-size:200% 100%;animation:raShim 1.6s ease-in-out infinite;}
  @keyframes raShim{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes raFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .ra-fade{animation:raFade .4s ease both;}
`;

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style'); s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

const PIE_COLORS = ['#3b9eff','#1a7ee0','#0a5fb5','#34d399','#f59e0b','#8b5cf6','#f87171','#ec4899'];

function recStyle(type) {
  if (type === 'warning') return { bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.2)', icon: <AlertTriangle size={16} color="#f59e0b" />, color: '#f59e0b' };
  if (type === 'success') return { bg: 'rgba(52,211,153,.08)', border: 'rgba(52,211,153,.2)', icon: <CheckCircle size={16} color="#34d399" />, color: '#34d399' };
  return { bg: 'rgba(59,158,255,.08)', border: 'rgba(59,158,255,.2)', icon: <Info size={16} color="#3b9eff" />, color: '#3b9eff' };
}

export default function RiskAnalysis() {
  useEffect(() => { injectStyles('ra-styles', CSS); }, []);

  const [risk,    setRisk]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // getPortfolios already uses API instance ✅
        const pRes = await getPortfolios();
        const portfolios = pRes.data?.data || pRes.data || [];
        const pid = portfolios[0]?.id;

        if (!pid) {
          setError('No portfolio found. Add holdings in the Portfolio page first.');
          return;
        }

        // ✅ Fixed: use API instance instead of plain axios
        const { data } = await API.get(`/risk/portfolio/${pid}`);

        if (data.risk === null) {
          setError(data.message || 'No holdings found.');
          return;
        }

        setRisk(data);
      } catch (e) {
        console.error('[RiskAnalysis]', e.response?.status, e.response?.data);
        setError(e?.response?.data?.message || e.message || 'Failed to load risk analysis');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div style={{ padding: '1.25rem', maxWidth: 1200, margin: '0 auto' }}>
      {[300, 200, 200].map((h, i) => (
        <div key={i} className="ra-skel" style={{ height: h, marginBottom: '1.5rem' }} />
      ))}
    </div>
  );

  return (
    <div className="ra-root">
      <div style={{margin: '0', padding: '0 1.25rem' }}>

        {/* Hero */}
        <div className="ra-hero">
          <div className="ra-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="ra-eyebrow"><span className="ra-live" /> Real-Time Analysis</div>
            <h1 className="ra-title">Portfolio <em>Risk</em><br />Analysis</h1>
            <p style={{ color: 'var(--muted2)', fontSize: '.95rem', marginTop: '.65rem' }}>
              Beta, sector concentration, VaR estimate &amp; diversification scoring — beyond simple P&amp;L tracking.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '1.25rem', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: '1rem', color: '#f87171', marginBottom: '1.5rem', fontSize: '.85rem' }}>
            ⚠ {error}
          </div>
        )}

        {risk && (
          <>
            {/* Key metrics */}
            <div className="ra-metrics ra-fade">
              {[
                { lbl: 'Portfolio Beta',     val: risk.portfolio_beta ?? '-',                                         sub: risk.overall_risk ?? 'N/A',    color: (risk.portfolio_beta ?? 1) > 1.3 ? '#f87171' : (risk.portfolio_beta ?? 1) > 1 ? '#f59e0b' : '#34d399' },
                { lbl: 'Diversification',    val: `${risk.diversification_score ?? 0}/100`,                          sub: 'Higher = better',             color: (risk.diversification_score ?? 0) > 65 ? '#34d399' : (risk.diversification_score ?? 0) > 40 ? '#f59e0b' : '#f87171' },
                { lbl: '1-Day VaR (95%)',    val: risk.var_95_1day ? `$${risk.var_95_1day.toLocaleString()}` : 'N/A', sub: 'Max expected loss',           color: 'var(--blue)' },
                { lbl: 'Concentration Risk', val: risk.concentration_risk ?? 'N/A',                                  sub: `HHI: ${risk.hhi ?? '—'}`,     color: risk.concentration_risk === 'High' ? '#f87171' : risk.concentration_risk === 'Medium' ? '#f59e0b' : '#34d399' },
                { lbl: 'Holdings',           val: risk.num_holdings ?? 0,                                            sub: 'Stocks tracked',              color: 'var(--blue)' },
                { lbl: 'Total Value',        val: risk.total_value ? `$${risk.total_value.toLocaleString()}` : 'N/A', sub: 'At current prices',          color: 'var(--blue)' },
              ].map(({ lbl, val, sub, color }) => (
                <div key={lbl} className="ra-metric">
                  <div className="ra-metric-lbl">{lbl}</div>
                  <div className="ra-metric-val" style={{ color }}>{val}</div>
                  <div className="ra-metric-sub">{sub}</div>
                </div>
              ))}
            </div>

            {/* Sector + Pie */}
            <div className="ra-grid-2 ra-fade" style={{ animationDelay: '.1s' }}>
              <div className="ra-card">
                <div className="ra-card-hdr">
                  <Activity size={16} color="var(--blue)" />
                  <span className="ra-card-title">Sector <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Exposure</em></span>
                </div>
                <div className="ra-card-body">
                  {(risk.sector_exposure?.length > 0) ? (
                    risk.sector_exposure.map(s => (
                      <div key={s.sector} className="ra-sector-row">
                        <span className="ra-sector-name">{s.sector}</span>
                        <div className="ra-sector-bar-track">
                          <div className="ra-sector-bar-fill" style={{ width: `${s.weight || 0}%` }} />
                        </div>
                        <span className="ra-sector-pct">{s.weight || 0}%</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--muted2)', textAlign: 'center', padding: '2rem 0' }}>No sector data available.</p>
                  )}
                </div>
              </div>

              <div className="ra-card">
                <div className="ra-card-hdr">
                  <Activity size={16} color="var(--blue)" />
                  <span className="ra-card-title">Weight <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Distribution</em></span>
                </div>
                <div className="ra-card-body" style={{ display: 'flex', justifyContent: 'center' }}>
                  {(risk.holdings?.length > 0) ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={risk.holdings.map(h => ({ name: h.symbol, value: h.weight || 0 }))}
                          cx="50%" cy="50%" outerRadius={90} innerRadius={55}
                          dataKey="value" paddingAngle={2} cornerRadius={3}
                        >
                          {risk.holdings.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={v => [`${v}%`, 'Weight']}
                          contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '.875rem', fontFamily: "'DM Mono',monospace", fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ color: 'var(--muted2)', textAlign: 'center', padding: '3rem 0' }}>No holdings to display.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Holdings table */}
            <div className="ra-card ra-fade" style={{ marginBottom: '1.5rem', animationDelay: '.15s' }}>
              <div className="ra-card-hdr">
                <TrendingUp size={16} color="var(--blue)" />
                <span className="ra-card-title">Holdings <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Breakdown</em></span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="ra-table">
                  <thead>
                    <tr><th>Symbol</th><th>Weight</th><th>Beta</th><th>Sector</th><th>P&amp;L %</th><th>Value</th></tr>
                  </thead>
                  <tbody>
                    {(risk.holdings?.length > 0) ? (
                      risk.holdings.map(h => (
                        <tr key={h.symbol}>
                          <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--blue)', fontWeight: 500 }}>{h.symbol}</td>
                          <td style={{ fontFamily: "'DM Mono',monospace" }}>{h.weight || 0}%</td>
                          <td style={{ fontFamily: "'DM Mono',monospace", color: (h.beta ?? 1) > 1.3 ? '#f87171' : (h.beta ?? 1) > 1 ? '#f59e0b' : '#34d399' }}>
                            {h.beta ?? '—'}
                          </td>
                          <td style={{ color: 'var(--muted2)', fontSize: '.78rem' }}>{h.sector || '—'}</td>
                          <td style={{ fontFamily: "'DM Mono',monospace", color: (h.pnl_pct ?? 0) >= 0 ? '#34d399' : '#f87171' }}>
                            {(h.pnl_pct ?? 0) >= 0 ? '+' : ''}{h.pnl_pct ?? 0}%
                          </td>
                          <td style={{ fontFamily: "'DM Mono',monospace" }}>${h.value ? h.value.toLocaleString() : '0'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted2)', padding: '2rem' }}>No holdings found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendations */}
            <div className="ra-card ra-fade" style={{ animationDelay: '.2s' }}>
              <div className="ra-card-hdr">
                <AlertTriangle size={16} color="var(--blue)" />
                <span className="ra-card-title">Risk <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Recommendations</em></span>
              </div>
              <div className="ra-card-body">
                {(risk.recommendations?.length > 0) ? (
                  risk.recommendations.map((r, i) => {
                    const st = recStyle(r.type);
                    return (
                      <div key={i} className="ra-rec" style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                        {st.icon}
                        <div>
                          <div className="ra-rec-title" style={{ color: st.color }}>{r.title}</div>
                          <div className="ra-rec-body">{r.body}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--muted2)', padding: '1.5rem 0', textAlign: 'center' }}>No recommendations available.</p>
                )}
                <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '.75rem', fontFamily: "'DM Mono',monospace" }}>
                  ⚠ Not financial advice. Beta values are approximate. Always verify before making investment decisions.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}