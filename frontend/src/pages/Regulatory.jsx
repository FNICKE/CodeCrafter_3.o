import { useEffect, useState } from 'react';
import API from '../api';
import { FileText, Search, ExternalLink, RefreshCw } from 'lucide-react';

const REG_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');
  .reg-root{--blue:#3b9eff;--blue-glow:rgba(59,158,255,.14);--blue-border:rgba(59,158,255,.22);--obsidian:#080b0f;--surface:#0e1318;--surface2:#141b22;--surface3:#1c2630;--border:rgba(255,255,255,.06);--text:#e8edf2;--muted:#5a6878;--muted2:#8a9ab0;font-family:'Instrument Sans',sans-serif;background:var(--obsidian);color:var(--text);min-height:100vh;padding-bottom:4rem;}
  .reg-hero{position:relative;padding:3rem 0 2rem;overflow:hidden;}
  .reg-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 55% 80% at 5% 60%,rgba(59,158,255,.08) 0%,transparent 70%);pointer-events:none;}
  .reg-hero-grid{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 75% 100% at 5% 60%,black 20%,transparent 80%);opacity:.35;}
  .reg-eyebrow{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem;}
  .reg-eyebrow::before{content:'';width:2rem;height:1px;background:var(--blue);}
  .reg-title{font-family:'DM Serif Display',serif;font-size:clamp(2.4rem,5vw,4rem);line-height:1.05;letter-spacing:-.02em;margin:0;}
  .reg-title em{font-style:italic;color:var(--blue);}
  .reg-search-row{display:flex;gap:.875rem;margin-bottom:1.75rem;align-items:center;}
  .reg-search-box{display:flex;align-items:center;gap:.6rem;padding:.6rem 1rem;border-radius:.875rem;border:1px solid var(--border);background:var(--surface2);flex:1;max-width:360px;transition:border-color .2s,box-shadow .2s;}
  .reg-search-box:focus-within{border-color:var(--blue-border);box-shadow:0 0 0 3px var(--blue-glow);}
  .reg-search-input{flex:1;border:none;background:transparent;color:var(--text);font-size:.875rem;outline:none;font-family:'Instrument Sans',sans-serif;}
  .reg-search-btn{padding:.625rem 1.25rem;border-radius:.75rem;background:var(--blue);color:#fff;border:none;font-weight:700;font-size:.82rem;cursor:pointer;transition:background .2s;display:flex;align-items:center;gap:0.5rem;}
  .reg-refresh-btn{padding:.625rem;border-radius:.75rem;background:var(--surface2);color:var(--muted2);border:1px solid var(--border);cursor:pointer;transition:all .2s;}
  .reg-refresh-btn:hover{background:var(--surface3);color:var(--text);}
  .reg-card{background:var(--surface);border:1px solid var(--border);border-radius:1.25rem;overflow:hidden;}
  .reg-table{width:100%;border-collapse:collapse;}
  .reg-table th{font-family:'DM Mono',monospace;font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);padding:1rem;text-align:left;border-bottom:1px solid var(--border);}
  .reg-table td{padding:1rem;font-size:.85rem;border-bottom:1px solid var(--border);}
  .reg-table tr:hover td{background:rgba(59,158,255,.02);}
  .reg-form-tag{font-family:'DM Mono',monospace;color:var(--blue);font-weight:500;}
  .reg-date{font-family:'DM Mono',monospace;color:var(--muted2);}
  .reg-error{padding:1.25rem;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:1rem;color:#f87171;margin-bottom:1.5rem;}
  .reg-skel{background:var(--surface);border:1px solid var(--border);border-radius:1.25rem;height:400px;position:relative;overflow:hidden;}
  .reg-skel::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 30%,rgba(255,255,255,.04) 50%,transparent 70%);background-size:200% 100%;animation:regShim 1.6s ease-in-out infinite;}
  @keyframes regShim{0%{background-position:-200% 0}100%{background-position:200% 0}}
`;

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style'); s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

export default function Regulatory() {
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticker, setTicker] = useState('AAPL');
  const [inputTicker, setInputTicker] = useState('AAPL');

  useEffect(() => { 
    injectStyles('reg-styles', REG_CSS);
    loadFilings('AAPL');
  }, []);

  const loadFilings = async (symbol) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.get(`/regulatory/filings?symbol=${symbol}`);
      setFilings(data.filings || []);
      setTicker(symbol);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const sym = inputTicker.trim().toUpperCase();
    if (sym) loadFilings(sym);
  };

  return (
    <div className="reg-root">
      <div style={{ margin: '0', padding: '0 1.25rem' }}>
        
        {/* Hero Section */}
        <div className="reg-hero">
          <div className="reg-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="reg-eyebrow">Compliance & Disclosure</div>
            <h1 className="reg-title">Regulatory <em>Filings</em></h1>
            <p style={{ color: 'var(--muted2)', fontSize: '.95rem', marginTop: '.65rem' }}>
              Real-time SEC EDGAR data and official company disclosures.
            </p>
          </div>
        </div>

        {/* Search Row */}
        <div className="reg-search-row">
          <div className="reg-search-box">
            <Search size={15} color="var(--blue)" />
            <input 
              className="reg-search-input" 
              placeholder="Enter ticker (e.g. NVDA)"
              value={inputTicker}
              onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="reg-search-btn" onClick={handleSearch}>
            Search
          </button>
          <button className="reg-refresh-btn" onClick={() => loadFilings(ticker)}>
            <RefreshCw size={16} />
          </button>
        </div>

        {error && <div className="reg-error">⚠ {error}</div>}

        {loading ? (
          <div className="reg-skel" />
        ) : (
          <div className="reg-card">
            <table className="reg-table">
              <thead>
                <tr>
                  <th>Form</th>
                  <th>Description</th>
                  <th>Filed Date</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {filings.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                      No regulatory records found for {ticker}
                    </td>
                  </tr>
                ) : (
                  filings.map((f, i) => (
                    <tr key={i}>
                      <td className="reg-form-tag">{f.form}</td>
                      <td style={{ fontWeight: 500 }}>{f.title}</td>
                      <td className="reg-date">{f.filed_date}</td>
                      <td>
                        {f.report_url ? (
                          <a
                            href={f.report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              color: 'var(--blue)', 
                              textDecoration: 'none', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '.4rem',
                              fontSize: '0.8rem'
                            }}
                          >
                            View Filing <ExternalLink size={12} />
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}