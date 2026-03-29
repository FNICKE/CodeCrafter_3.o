import { useEffect, useState } from 'react';
import { getSectorPerformance } from '../api';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  .scr-root {
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
    font-family: 'Instrument Sans', sans-serif;
    background: var(--obsidian);
    color: var(--text);
    min-height: 100vh;
    padding-bottom: 4rem;
  }

  /* Ticker */
  .scr-ticker-wrap { overflow: hidden; background: var(--surface); border-bottom: 1px solid var(--border); }
  .scr-ticker-inner { display: flex; width: max-content; animation: scrTick 45s linear infinite; }
  .scr-ticker-inner:hover { animation-play-state: paused; }
  @keyframes scrTick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .scr-ticker-item { padding: 5px 1.75rem; font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: .04em; white-space: nowrap; }
  .scr-ticker-item.up   { color: var(--blue); }
  .scr-ticker-item.down { color: var(--red); }

  /* Hero */
  .scr-hero { position: relative; padding: 3rem 0 2.25rem; overflow: hidden; }
  .scr-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 55% 80% at 5% 60%, rgba(59,158,255,.08) 0%, transparent 70%),
      radial-gradient(ellipse 30% 60% at 92% 20%, rgba(59,158,255,.04) 0%, transparent 70%);
    pointer-events: none;
  }
  .scr-hero-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(var(--border) 1px, transparent 1px),
                      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 75% 100% at 5% 60%, black 20%, transparent 80%);
    opacity: .35;
  }
  .scr-eyebrow { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: .18em; text-transform: uppercase; color: var(--blue); margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
  .scr-eyebrow::before { content: ''; width: 2rem; height: 1px; background: var(--blue); display: inline-block; }
  .scr-title { font-family: 'DM Serif Display', serif; font-size: clamp(2.4rem, 5vw, 4.2rem); line-height: 1.05; letter-spacing: -.02em; margin: 0; }
  .scr-title em { font-style: italic; color: var(--blue); }
  .scr-subtitle { color: var(--muted2); font-size: .95rem; margin-top: .65rem; line-height: 1.6; }
  .scr-live { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 0 0 rgba(59,158,255,.6); animation: scrPulse 2s ease-out infinite; flex-shrink: 0; }
  @keyframes scrPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,158,255,.6) } 50% { box-shadow: 0 0 0 6px rgba(59,158,255,0) } }

  /* Chart card */
  .scr-chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; overflow: hidden; margin-bottom: 1.5rem; }
  .scr-chart-hdr { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: .625rem; }
  .scr-chart-title { font-family: 'DM Serif Display', serif; font-size: 1.25rem; }
  .scr-chart-body { padding: 1.25rem 1.5rem 1.5rem; }

  /* Sector rows */
  .scr-sector-row { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; margin-bottom: .75rem; transition: border-color .2s, box-shadow .2s; gap: 1rem; flex-wrap: wrap; }
  .scr-sector-row:hover { border-color: var(--blue-border); box-shadow: 0 4px 20px var(--blue-glow); }
  .scr-sector-left { display: flex; align-items: center; gap: 1rem; }
  .scr-sector-sym { font-family: 'DM Mono', monospace; font-size: .8rem; font-weight: 500; color: var(--blue); min-width: 52px; }
  .scr-sector-name { font-size: .9rem; font-weight: 600; color: var(--text); }
  .scr-sector-right { display: flex; align-items: center; gap: 1.5rem; }
  .scr-price { font-family: 'DM Mono', monospace; font-size: 1rem; font-weight: 500; color: var(--text); }
  .scr-badge { display: inline-flex; align-items: center; gap: .35rem; padding: .3rem .75rem; border-radius: 99px; font-family: 'DM Mono', monospace; font-size: .78rem; font-weight: 500; min-width: 90px; justify-content: center; }
  .scr-badge.up   { background: rgba(52,211,153,.1); border: 1px solid rgba(52,211,153,.2); color: var(--green); }
  .scr-badge.down { background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.2); color: var(--red); }

  /* Bar fill indicator */
  .scr-bar-track { flex: 1; min-width: 80px; max-width: 140px; height: 4px; border-radius: 99px; background: var(--surface2); overflow: hidden; }
  .scr-bar-fill  { height: 100%; border-radius: 99px; transition: width .6s cubic-bezier(.4,0,.2,1); }

  /* Skel */
  .scr-skel { background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; position: relative; overflow: hidden; margin-bottom: .75rem; }
  .scr-skel::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,.04) 50%, transparent 70%); background-size: 200% 100%; animation: scrShim 1.6s ease-in-out infinite; }
  @keyframes scrShim { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }

  @keyframes scrFadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  .scr-fade { animation: scrFadeUp .4s ease both; }

  /* Summary bar */
  .scr-summary { display: flex; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap; }
  .scr-sum-chip { }
  .scr-sum-val { font-family: 'DM Mono', monospace; font-size: 1.1rem; font-weight: 500; }
  .scr-sum-lbl { font-family: 'DM Mono', monospace; font-size: .6rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin-top: 2px; }
`;

const SECTOR_TICKERS = ['XLK','XLV','XLF','XLE','XLY','XLRE','XLU','XLB'];

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

export default function Screener() {
  useEffect(() => { injectStyles('scr-styles', CSS); }, []);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSectorPerformance().then(r => setSectors(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const gainers = sectors.filter(s => (s.change_percent || 0) >= 0).length;
  const losers  = sectors.length - gainers;
  const maxAbs  = Math.max(...sectors.map(s => Math.abs(s.change_percent || 0)), 1);

  const barData = sectors.map(s => ({
    name: s.name,
    change: Number((s.change_percent || 0).toFixed(2)),
  }));

  const tickerItems = SECTOR_TICKERS.flatMap(t => [t, t]);

  return (
    <div className="scr-root">
      {/* Ticker */}
      <div className="scr-ticker-wrap">
        <div className="scr-ticker-inner">
          {tickerItems.map((t, i) => (
            <span key={i} className={`scr-ticker-item ${i % 3 === 0 ? 'up' : i % 3 === 1 ? 'down' : ''}`}>
              {t} <span style={{ color: 'var(--border)', marginLeft: '1rem' }}>|</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.25rem' }}>
        {/* Hero */}
        <div className="scr-hero">
          <div className="scr-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="scr-eyebrow"><span className="scr-live" /> Sector Intelligence</div>
            <h1 className="scr-title">Sector<br /><em>Screener</em></h1>
            <p className="scr-subtitle">Analyse performance across market sectors &amp; ETF benchmarks.</p>
          </div>
        </div>

        {/* Summary row */}
        {!loading && sectors.length > 0 && (
          <div className="scr-summary scr-fade">
            {[
              { val: sectors.length,  lbl: 'Sectors', color: 'var(--blue)'  },
              { val: gainers,         lbl: 'Gaining',  color: 'var(--green)' },
              { val: losers,          lbl: 'Losing',   color: 'var(--red)'   },
              { val: `${maxAbs.toFixed(2)}%`, lbl: 'Max Move', color: 'var(--text)' },
            ].map(({ val, lbl, color }) => (
              <div key={lbl} className="scr-sum-chip">
                <div className="scr-sum-val" style={{ color }}>{val}</div>
                <div className="scr-sum-lbl">{lbl}</div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {loading ? (
          <div className="scr-skel" style={{ height: 300, marginBottom: '1.5rem' }} />
        ) : (
          <div className="scr-chart-card scr-fade">
            <div className="scr-chart-hdr">
              <BarChart3 size={16} color="var(--blue)" />
              <span className="scr-chart-title">Sector ETF <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Performance</em></span>
            </div>
            <div className="scr-chart-body">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#5a6878', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v > 0 ? '+' : ''}${v?.toFixed(2)}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8a9ab0', fontSize: 12, fontFamily: "'Instrument Sans', sans-serif" }}
                    axisLine={false} tickLine={false} width={110} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '.875rem', color: 'var(--text)', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,.4)', fontFamily: "'DM Mono', monospace" }}
                    formatter={v => [`${v > 0 ? '+' : ''}${v?.toFixed(2)}%`, 'Change']}
                    cursor={{ fill: 'rgba(59,158,255,.04)' }}
                  />
                  <Bar dataKey="change" radius={[0, 6, 6, 0]}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.change >= 0 ? '#34d399' : '#f87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Sector rows */}
        <div>
          {loading
            ? [1,2,3,4,5,6,7,8].map(i => <div key={i} className="scr-skel" style={{ height: 64 }} />)
            : sectors.map((s, i) => {
                const isUp   = (s.change_percent || 0) >= 0;
                const barPct = Math.abs(s.change_percent || 0) / maxAbs * 100;
                return (
                  <div key={s.symbol} className="scr-sector-row scr-fade" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="scr-sector-left">
                      <span className="scr-sector-sym">{s.symbol}</span>
                      <span className="scr-sector-name">{s.name}</span>
                    </div>
                    <div className="scr-sector-right">
                      {/* Mini bar */}
                      <div className="scr-bar-track">
                        <div className="scr-bar-fill" style={{ width: `${barPct}%`, background: isUp ? 'var(--green)' : 'var(--red)' }} />
                      </div>
                      <span className="scr-price">${s.current?.toFixed(2) || '—'}</span>
                      <span className={`scr-badge ${isUp ? 'up' : 'down'}`}>
                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {s.change_percent ? `${s.change_percent > 0 ? '+' : ''}${s.change_percent.toFixed(2)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}