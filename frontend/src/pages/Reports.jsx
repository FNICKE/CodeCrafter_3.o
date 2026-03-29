import { useEffect, useState } from 'react';
import API from '../api';
import { BarChart3, Calendar, Rocket, FileText, Search, ExternalLink } from 'lucide-react';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');
  .rp-root{--blue:#3b9eff;--blue-glow:rgba(59,158,255,.14);--blue-border:rgba(59,158,255,.22);--obsidian:#080b0f;--surface:#0e1318;--surface2:#141b22;--surface3:#1c2630;--border:rgba(255,255,255,.06);--text:#e8edf2;--muted:#5a6878;--muted2:#8a9ab0;--green:#34d399;--red:#f87171;--amber:#f59e0b;font-family:'Instrument Sans',sans-serif;background:var(--obsidian);color:var(--text);min-height:100vh;padding-bottom:4rem;}
  .rp-hero{position:relative;padding:3rem 0 2rem;overflow:hidden;}
  .rp-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 55% 80% at 5% 60%,rgba(59,158,255,.08) 0%,transparent 70%);pointer-events:none;}
  .rp-hero-grid{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 75% 100% at 5% 60%,black 20%,transparent 80%);opacity:.35;}
  .rp-eyebrow{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem;}
  .rp-eyebrow::before{content:'';width:2rem;height:1px;background:var(--blue);}
  .rp-title{font-family:'DM Serif Display',serif;font-size:clamp(2.4rem,5vw,4rem);line-height:1.05;letter-spacing:-.02em;margin:0;}
  .rp-title em{font-style:italic;color:var(--blue);}
  .rp-live{width:8px;height:8px;border-radius:50%;background:var(--blue);animation:rpPulse 2s ease-out infinite;flex-shrink:0;}
  @keyframes rpPulse{0%,100%{box-shadow:0 0 0 0 rgba(59,158,255,.6)}50%{box-shadow:0 0 0 6px rgba(59,158,255,0)}}
  .rp-tabs{display:flex;gap:.5rem;margin-bottom:2rem;overflow-x:auto;padding-bottom:.25rem;}
  .rp-tabs::-webkit-scrollbar{display:none;}
  .rp-tab{display:flex;align-items:center;gap:.5rem;padding:.6rem 1.25rem;border-radius:.875rem;font-size:.82rem;font-weight:600;border:1px solid var(--border);background:var(--surface2);color:var(--muted2);cursor:pointer;transition:all .2s;white-space:nowrap;font-family:'Instrument Sans',sans-serif;}
  .rp-tab.active{background:var(--blue);color:#fff;border-color:var(--blue);box-shadow:0 0 16px var(--blue-glow);}
  .rp-tab:not(.active):hover{background:var(--surface3);color:var(--text);border-color:var(--blue-border);}
  .rp-search-row{display:flex;gap:.875rem;margin-bottom:1.75rem;align-items:center;flex-wrap:wrap;}
  .rp-search-box{display:flex;align-items:center;gap:.6rem;padding:.6rem 1rem;border-radius:.875rem;border:1px solid var(--border);background:var(--surface2);flex:1;max-width:360px;transition:border-color .2s,box-shadow .2s;}
  .rp-search-box:focus-within{border-color:var(--blue-border);box-shadow:0 0 0 3px var(--blue-glow);}
  .rp-search-input{flex:1;border:none;background:transparent;color:var(--text);font-size:.875rem;outline:none;font-family:'Instrument Sans',sans-serif;}
  .rp-search-input::placeholder{color:var(--muted);}
  .rp-search-btn{padding:.625rem 1.25rem;border-radius:.75rem;background:var(--blue);color:#fff;border:none;font-weight:700;font-size:.82rem;cursor:pointer;font-family:'Instrument Sans',sans-serif;transition:background .2s;}
  .rp-search-btn:hover{background:#1a7ee0;}
  .rp-card{background:var(--surface);border:1px solid var(--border);border-radius:1.25rem;overflow:hidden;margin-bottom:1.5rem;}
  .rp-card-hdr{padding:1.25rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.625rem;}
  .rp-card-title{font-family:'DM Serif Display',serif;font-size:1.25rem;}
  .rp-card-body{padding:1.25rem;}
  .rp-consensus{display:inline-flex;align-items:center;padding:.4rem 1.1rem;border-radius:99px;font-family:'DM Mono',monospace;font-size:.85rem;font-weight:500;margin-bottom:1.25rem;}
  .rp-metric-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.75rem;}
  .rp-metric-chip{background:var(--surface2);border:1px solid var(--border);border-radius:.875rem;padding:.75rem 1rem;}
  .rp-metric-val{font-family:'DM Mono',monospace;font-size:1rem;font-weight:500;color:var(--blue);}
  .rp-metric-lbl{font-family:'DM Mono',monospace;font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-top:.2rem;}
  .rp-earn-item{display:flex;align-items:center;justify-content:space-between;padding:.875rem;border-radius:.875rem;background:var(--surface2);border:1px solid var(--border);margin-bottom:.625rem;flex-wrap:wrap;gap:.75rem;}
  .rp-earn-sym{font-family:'DM Mono',monospace;font-size:.85rem;font-weight:500;color:var(--blue);}
  .rp-earn-date{font-family:'DM Mono',monospace;font-size:.72rem;color:var(--muted);}
  .rp-earn-time{display:inline-flex;padding:.2rem .6rem;border-radius:.5rem;font-family:'DM Mono',monospace;font-size:.62rem;background:var(--surface3);color:var(--muted2);}
  .rp-earn-est{font-size:.78rem;color:var(--muted2);}
  .rp-ipo-item{display:flex;align-items:center;justify-content:space-between;padding:.875rem 1.25rem;border-bottom:1px solid var(--border);}
  .rp-ipo-item:last-child{border-bottom:none;}
  .rp-table{width:100%;border-collapse:collapse;}
  .rp-table th{font-family:'DM Mono',monospace;font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);padding:.625rem 1rem;text-align:left;border-bottom:1px solid var(--border);}
  .rp-table td{padding:.75rem 1rem;font-size:.8rem;border-bottom:1px solid var(--border);}
  .rp-table tr:last-child td{border-bottom:none;}
  .rp-table tr:hover td{background:rgba(59,158,255,.03);}
  .rp-skel{background:var(--surface);border:1px solid var(--border);border-radius:1.25rem;position:relative;overflow:hidden;}
  .rp-skel::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 30%,rgba(255,255,255,.04) 50%,transparent 70%);background-size:200% 100%;animation:rpShim 1.6s ease-in-out infinite;}
  @keyframes rpShim{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes rpFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .rp-fade{animation:rpFade .4s ease both;}
  .rp-error{padding:1.25rem;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:1rem;color:#f87171;margin-bottom:1.5rem;font-size:.85rem;}
`;

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style'); s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

const TABS = [
  { key: 'analyst',  label: 'Analyst Reports',   icon: BarChart3 },
  { key: 'earnings', label: 'Earnings Calendar',  icon: Calendar  },
  { key: 'ipo',      label: 'IPO Calendar',       icon: Rocket    },
];

function consensusColor(rating) {
  if (rating?.includes('Strong Buy')) return { bg: 'rgba(52,211,153,.12)',  color: '#34d399', border: 'rgba(52,211,153,.25)' };
  if (rating?.includes('Buy'))        return { bg: 'rgba(59,158,255,.12)',  color: '#3b9eff', border: 'rgba(59,158,255,.25)' };
  if (rating?.includes('Sell'))       return { bg: 'rgba(248,113,113,.12)', color: '#f87171', border: 'rgba(248,113,113,.25)' };
  return { bg: 'rgba(90,104,120,.12)', color: '#8a9ab0', border: 'rgba(90,104,120,.25)' };
}

export default function Reports() {
  useEffect(() => { injectStyles('rp-styles', CSS); }, []);

  const [tab,         setTab]         = useState('analyst');
  const [ticker,      setTicker]      = useState('AAPL');
  const [inputTicker, setInputTicker] = useState('AAPL');
  const [analyst,     setAnalyst]     = useState(null);
  const [earnings,    setEarnings]    = useState(null);
  const [ipo,         setIpo]         = useState(null);
  const [sec,         setSec]         = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (tab === 'analyst') {
          const { data } = await API.get(`/reports/analyst/${ticker}`);       // ✅ API instance
          setAnalyst(data);
        } else if (tab === 'earnings') {
          const { data } = await API.get('/reports/earnings-calendar');       // ✅ API instance
          setEarnings(data);
        } else if (tab === 'ipo') {
          const { data } = await API.get('/reports/ipo-calendar');            // ✅ API instance
          setIpo(data);
        } else if (tab === 'sec') {
          const { data } = await API.get(`/reports/sec/${ticker}`);           // ✅ API instance
          setSec(data);
        }
      } catch (e) {
        console.error('[Reports]', e.response?.status, e.response?.data);
        setError(e.response?.data?.message || e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [tab, ticker]);

  const needsTicker = tab === 'analyst' || tab === 'sec';
  const formatVal = v => v == null ? '—' : typeof v === 'number' ? v.toFixed(2) : v;

  return (
    <div className="rp-root">
      <div style={{margin: '0', padding: '0 1.25rem' }}>

        {/* Hero */}
        <div className="rp-hero">
          <div className="rp-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="rp-eyebrow"><span className="rp-live" /> Analyst &amp; Fundamental Data</div>
            <h1 className="rp-title">Research <em>Reports</em></h1>
            <p style={{ color: 'var(--muted2)', fontSize: '.95rem', marginTop: '.65rem' }}>
              Analyst consensus, price targets, earnings history, upcoming events &amp; SEC filings — in one place.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="rp-tabs">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`rp-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Ticker search */}
        {needsTicker && (
          <div className="rp-search-row">
            <div className="rp-search-box">
              <Search size={15} color="var(--blue)" />
              <input className="rp-search-input" placeholder="Enter ticker (AAPL, TSLA…)"
                value={inputTicker} onChange={e => setInputTicker(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && setTicker(inputTicker)} />
            </div>
            <button className="rp-search-btn" onClick={() => setTicker(inputTicker)}>Analyse</button>
          </div>
        )}

        {/* Error */}
        {error && <div className="rp-error">⚠ {error}</div>}

        {/* Loading skeleton */}
        {loading && <div className="rp-skel" style={{ height: 400, marginBottom: '1.5rem' }} />}

        {/* ── ANALYST TAB ── */}
        {!loading && tab === 'analyst' && analyst && (
          <div className="rp-fade">
            <div className="rp-card">
              <div className="rp-card-hdr">
                <BarChart3 size={16} color="var(--blue)" />
                <span className="rp-card-title">{analyst.ticker} — Analyst <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Consensus</em></span>
              </div>
              <div className="rp-card-body">
                {(() => {
                  const cc = consensusColor(analyst.consensus_rating);
                  return <div className="rp-consensus" style={{ background: cc.bg, color: cc.color, border: `1px solid ${cc.border}` }}>{analyst.consensus_rating}</div>;
                })()}

                {analyst.price_target && (
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {[
                      ['Low',    analyst.price_target.target_low],
                      ['Mean',   analyst.price_target.target_mean],
                      ['Median', analyst.price_target.target_median],
                      ['High',   analyst.price_target.target_high],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.58rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)' }}>{l} Target</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '1.1rem', color: 'var(--blue)', marginTop: '.2rem' }}>${formatVal(v)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {analyst.key_metrics && (
                  <>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '.875rem' }}>Key Metrics</div>
                    <div className="rp-metric-grid">
                      {[
                        ['P/E TTM',     analyst.key_metrics.pe_ttm],
                        ['P/S TTM',     analyst.key_metrics.ps_ttm],
                        ['P/B',         analyst.key_metrics.pb],
                        ['EV/EBITDA',   analyst.key_metrics.ev_ebitda],
                        ['ROE TTM',     analyst.key_metrics.roe_ttm     ? `${(analyst.key_metrics.roe_ttm * 100).toFixed(1)}%`      : null],
                        ['Revenue Gr.', analyst.key_metrics.revenue_growth ? `${(analyst.key_metrics.revenue_growth * 100).toFixed(1)}%` : null],
                        ['Div. Yield',  analyst.key_metrics.dividend_yield  ? `${analyst.key_metrics.dividend_yield.toFixed(2)}%`        : null],
                        ['Beta',        analyst.key_metrics.beta],
                        ['52W High',    analyst.key_metrics['52w_high']  ? `$${formatVal(analyst.key_metrics['52w_high'])}` : null],
                        ['52W Low',     analyst.key_metrics['52w_low']   ? `$${formatVal(analyst.key_metrics['52w_low'])}`  : null],
                      ].filter(([_, v]) => v != null).map(([l, v]) => (
                        <div key={l} className="rp-metric-chip">
                          <div className="rp-metric-val">{formatVal(v)}</div>
                          <div className="rp-metric-lbl">{l}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {analyst.earnings_history?.length > 0 && (
                  <div style={{ marginTop: '1.75rem' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '.875rem' }}>EPS Surprise History</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="rp-table">
                        <thead><tr><th>Period</th><th>Actual EPS</th><th>Estimate</th><th>Surprise</th><th>Result</th></tr></thead>
                        <tbody>
                          {analyst.earnings_history.map((e, i) => (
                            <tr key={i}>
                              <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--muted2)' }}>{e.period}</td>
                              <td style={{ fontFamily: "'DM Mono',monospace" }}>{e.actual != null ? `$${formatVal(e.actual)}` : '—'}</td>
                              <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--muted2)' }}>{e.estimate != null ? `$${formatVal(e.estimate)}` : '—'}</td>
                              <td style={{ fontFamily: "'DM Mono',monospace", color: e.surprise_pct >= 0 ? '#34d399' : '#f87171' }}>
                                {e.surprise_pct != null ? `${e.surprise_pct > 0 ? '+' : ''}${e.surprise_pct.toFixed(2)}%` : '—'}
                              </td>
                              <td>
                                {e.beat === true  && <span style={{ color: '#34d399', fontSize: '.75rem', fontFamily: "'DM Mono',monospace" }}>✓ Beat</span>}
                                {e.beat === false && <span style={{ color: '#f87171', fontSize: '.75rem', fontFamily: "'DM Mono',monospace" }}>✗ Miss</span>}
                                {e.beat === null  && <span style={{ color: 'var(--muted)', fontSize: '.75rem' }}>—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {analyst.peers?.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '.625rem' }}>Peer Companies</div>
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                      {analyst.peers.map(p => (
                        <span key={p} style={{ padding: '.3rem .75rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '.5rem', fontFamily: "'DM Mono',monospace", fontSize: '.75rem', color: 'var(--blue)' }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── EARNINGS TAB ── */}
        {!loading && tab === 'earnings' && earnings && (
          <div className="rp-fade">
            <div className="rp-card">
              <div className="rp-card-hdr">
                <Calendar size={16} color="var(--blue)" />
                <span className="rp-card-title">Upcoming <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Earnings</em></span>
                <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono',monospace", fontSize: '.65rem', color: 'var(--muted)' }}>{earnings.total} companies · Next 7 days</span>
              </div>
              <div className="rp-card-body">
                {earnings.earnings.length === 0
                  ? <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>No earnings scheduled in the next 7 days.</p>
                  : earnings.earnings.map((e, i) => (
                    <div key={i} className="rp-earn-item">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                          <span className="rp-earn-sym">{e.symbol}</span>
                          <span className="rp-earn-time">{e.time === 'bmo' ? 'Pre-Market' : e.time === 'amc' ? 'After Close' : e.time || '—'}</span>
                        </div>
                        <div className="rp-earn-date" style={{ marginTop: '.25rem' }}>Q{e.quarter} {e.year} · {e.date}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {e.eps_est != null && <div className="rp-earn-est">EPS Est: <strong style={{ color: 'var(--text)', fontFamily: "'DM Mono',monospace" }}>${formatVal(e.eps_est)}</strong></div>}
                        {e.rev_est != null && <div className="rp-earn-est">Rev Est: <strong style={{ color: 'var(--text)', fontFamily: "'DM Mono',monospace" }}>${(e.rev_est / 1e9).toFixed(2)}B</strong></div>}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ── IPO TAB ── */}
        {!loading && tab === 'ipo' && ipo && (
          <div className="rp-fade">
            <div className="rp-card">
              <div className="rp-card-hdr">
                <Rocket size={16} color="var(--blue)" />
                <span className="rp-card-title">Upcoming <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>IPOs</em></span>
                <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono',monospace", fontSize: '.65rem', color: 'var(--muted)' }}>{ipo.total} IPOs · Next 90 days</span>
              </div>
              <div>
                {ipo.ipos.length === 0
                  ? <div style={{ padding: '2rem', color: 'var(--muted)', textAlign: 'center' }}>No upcoming IPOs found.</div>
                  : ipo.ipos.map((ip, i) => (
                    <div key={i} className="rp-ipo-item">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.2rem' }}>{ip.company}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.72rem', color: 'var(--blue)' }}>{ip.symbol || '—'}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.65rem', color: 'var(--muted)', marginTop: '.2rem' }}>{ip.exchange} · {ip.date}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.9rem', color: 'var(--text)' }}>${ip.price_low} – ${ip.price_high}</div>
                        {ip.total_value && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '.65rem', color: 'var(--muted)', marginTop: '.2rem' }}>${(ip.total_value / 1e9).toFixed(2)}B offering</div>}
                        <span style={{ display: 'inline-block', marginTop: '.3rem', padding: '.2rem .65rem', borderRadius: '99px', fontFamily: "'DM Mono',monospace", fontSize: '.62rem', background: ip.status === 'priced' ? 'rgba(52,211,153,.1)' : 'rgba(59,158,255,.1)', color: ip.status === 'priced' ? '#34d399' : '#3b9eff' }}>{ip.status || 'upcoming'}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ── SEC TAB ── */}
        {!loading && tab === 'sec' && sec && (
          <div className="rp-fade">
            <div className="rp-card">
              <div className="rp-card-hdr">
                <FileText size={16} color="var(--blue)" />
                <span className="rp-card-title">{sec.company || sec.ticker} — <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>SEC Filings</em></span>
                {sec.cik && <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono',monospace", fontSize: '.62rem', color: 'var(--muted)' }}>CIK {sec.cik}</span>}
              </div>
              {!sec.found ? (
                <div style={{ padding: '2rem', color: 'var(--muted)', textAlign: 'center' }}>No SEC record found for {sec.ticker}.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="rp-table">
                    <thead><tr><th>Form</th><th>Filed</th><th>Period</th><th>Link</th></tr></thead>
                    <tbody>
                      {sec.filings.map((f, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--blue)', fontWeight: 500 }}>{f.form_type}</td>
                          <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--muted2)' }}>{f.file_date}</td>
                          <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--muted)' }}>{f.period || '—'}</td>
                          <td>
                            <a href={f.url} target="_blank" rel="noopener noreferrer"
                              style={{ color: 'var(--blue)', fontSize: '.72rem', fontFamily: "'DM Mono',monospace", display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                              Full Doc <ExternalLink size={10} />
                            </a>
                            {' · '}
                            <a href={f.browse_url} target="_blank" rel="noopener noreferrer"
                              style={{ color: 'var(--muted2)', fontSize: '.72rem', fontFamily: "'DM Mono',monospace", display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                              EDGAR <ExternalLink size={10} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}