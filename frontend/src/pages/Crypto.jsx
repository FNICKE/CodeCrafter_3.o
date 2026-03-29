import { useEffect, useState } from 'react';
import { getCryptoPrices } from '../api';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  .cry-root {
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
  .cry-ticker-wrap { overflow: hidden; background: var(--surface); border-bottom: 1px solid var(--border); }
  .cry-ticker-inner { display: flex; width: max-content; animation: cryTick 35s linear infinite; }
  .cry-ticker-inner:hover { animation-play-state: paused; }
  @keyframes cryTick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .cry-ticker-item { padding: 5px 1.75rem; font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: .04em; white-space: nowrap; color: var(--muted2); }

  /* Hero */
  .cry-hero { position: relative; padding: 3rem 0 2.25rem; overflow: hidden; }
  .cry-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 55% 80% at 5% 60%, rgba(59,158,255,.08) 0%, transparent 70%),
      radial-gradient(ellipse 30% 60% at 92% 20%, rgba(59,158,255,.04) 0%, transparent 70%);
    pointer-events: none;
  }
  .cry-hero-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(var(--border) 1px, transparent 1px),
                      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 75% 100% at 5% 60%, black 20%, transparent 80%);
    opacity: .35;
  }
  .cry-eyebrow { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: .18em; text-transform: uppercase; color: var(--blue); margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
  .cry-eyebrow::before { content: ''; width: 2rem; height: 1px; background: var(--blue); display: inline-block; }
  .cry-title { font-family: 'DM Serif Display', serif; font-size: clamp(2.4rem, 5vw, 4.2rem); line-height: 1.05; letter-spacing: -.02em; margin: 0; }
  .cry-title em { font-style: italic; color: var(--blue); }
  .cry-subtitle { color: var(--muted2); font-size: .95rem; margin-top: .65rem; line-height: 1.6; }
  .cry-live { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 0 0 rgba(59,158,255,.6); animation: cryPulse 2s ease-out infinite; flex-shrink: 0; }
  @keyframes cryPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,158,255,.6) } 50% { box-shadow: 0 0 0 6px rgba(59,158,255,0) } }

  /* Crypto cards */
  .cry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .cry-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; padding: 1.5rem; transition: border-color .25s, box-shadow .25s; cursor: default; }
  .cry-card:hover { border-color: var(--blue-border); box-shadow: 0 4px 24px var(--blue-glow); }
  .cry-coin-icon { width: 44px; height: 44px; border-radius: .875rem; background: var(--blue-glow); border: 1px solid var(--blue-border); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 1rem; }
  .cry-coin-name { font-family: 'DM Serif Display', serif; font-size: 1.15rem; margin-bottom: .15rem; }
  .cry-coin-sym { font-family: 'DM Mono', monospace; font-size: .65rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin-bottom: .75rem; }
  .cry-price { font-family: 'DM Mono', monospace; font-size: 1.5rem; font-weight: 500; color: var(--text); }
  .cry-change { display: inline-flex; align-items: center; gap: .35rem; padding: .25rem .65rem; border-radius: 99px; font-family: 'DM Mono', monospace; font-size: .75rem; font-weight: 500; margin-top: .5rem; }
  .cry-change.up   { background: rgba(52,211,153,.1); border: 1px solid rgba(52,211,153,.2); color: var(--green); }
  .cry-change.down { background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.2); color: var(--red); }

  /* Chart card */
  .cry-chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; overflow: hidden; }
  .cry-chart-hdr { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: .625rem; }
  .cry-chart-title { font-family: 'DM Serif Display', serif; font-size: 1.25rem; }
  .cry-chart-body { padding: 1.25rem 1.5rem 1.5rem; }

  /* Skel */
  .cry-skel { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; position: relative; overflow: hidden; }
  .cry-skel::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,.04) 50%, transparent 70%); background-size: 200% 100%; animation: cryShim 1.6s ease-in-out infinite; }
  @keyframes cryShim { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }

  @keyframes cryFadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  .cry-fade { animation: cryFadeUp .4s ease both; }
`;

const TICKER_CRYPTO = ['BTC $94,230 +2.1%','ETH $3,420 +1.8%','SOL $178 +3.4%','XRP $0.62 -0.5%','DOGE $0.12 +4.2%','BNB $580 +0.9%','ADA $0.45 -1.2%','AVAX $38 +2.7%'];

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

const COIN_META = {
  BTCUSDT:  { icon: '₿', name: 'Bitcoin',  color: '#f7931a' },
  ETHUSDT:  { icon: 'Ξ', name: 'Ethereum', color: '#627eea' },
  SOLUSDT:  { icon: '◎', name: 'Solana',   color: '#9945ff' },
  XRPUSDT:  { icon: '✕', name: 'Ripple',   color: '#3b9eff' },
  DOGEUSDT: { icon: 'Ð', name: 'Dogecoin', color: '#c3a634' },
};

export default function Crypto() {
  useEffect(() => { injectStyles('cry-styles', CSS); }, []);
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCryptoPrices().then(r => setCryptos(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const tickerItems = [...TICKER_CRYPTO, ...TICKER_CRYPTO];
  const barData = cryptos.map(c => ({
    name: c.symbol.replace('USDT', ''),
    change: Number((c.change_percent || 0).toFixed(2)),
  }));

  return (
    <div className="cry-root">
      {/* Ticker */}
      <div className="cry-ticker-wrap">
        <div className="cry-ticker-inner">
          {tickerItems.map((t, i) => (
            <span key={i} className="cry-ticker-item">
              {t} <span style={{ color: 'var(--border)', marginLeft: '1rem' }}>|</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.25rem' }}>
        {/* Hero */}
        <div className="cry-hero">
          <div className="cry-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="cry-eyebrow"><span className="cry-live" /> Live Crypto Prices</div>
            <h1 className="cry-title">Crypto<br /><em>Market</em></h1>
            <p className="cry-subtitle">Live cryptocurrency prices via Finnhub — updated in real time.</p>
          </div>
        </div>

        {/* Coin cards */}
        <div className="cry-grid">
          {loading
            ? [1,2,3,4,5].map(i => <div key={i} className="cry-skel" style={{ height: 180 }} />)
            : cryptos.map((c, i) => {
                const meta = COIN_META[c.symbol] || { icon: '●', name: c.symbol, color: 'var(--blue)' };
                const isUp = (c.change_percent || 0) >= 0;
                return (
                  <div key={c.symbol} className="cry-card cry-fade" style={{ animationDelay: `${i * 0.07}s` }}>
                    <div className="cry-coin-icon" style={{ background: `${meta.color}18`, borderColor: `${meta.color}30`, color: meta.color }}>
                      {meta.icon}
                    </div>
                    <div className="cry-coin-name">{meta.name}</div>
                    <div className="cry-coin-sym">{c.symbol}</div>
                    <div className="cry-price">
                      ${c.current ? Number(c.current).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                    </div>
                    <div className={`cry-change ${isUp ? 'up' : 'down'}`}>
                      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {c.change_percent ? `${c.change_percent > 0 ? '+' : ''}${c.change_percent.toFixed(2)}%` : '0%'}
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Bar chart */}
        {!loading && cryptos.length > 0 && (
          <div className="cry-chart-card cry-fade" style={{ animationDelay: '.35s' }}>
            <div className="cry-chart-hdr">
              <Zap size={16} color="var(--blue)" />
              <span className="cry-chart-title">Change <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Comparison</em></span>
            </div>
            <div className="cry-chart-body">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 8, right: 0, left: -16, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#5a6878', fontSize: 12, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5a6878', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '.875rem', color: 'var(--text)', fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,.4)', fontFamily: "'DM Mono', monospace" }}
                    formatter={v => [`${v}%`, '24h Change']}
                    cursor={{ fill: 'rgba(59,158,255,.05)' }}
                  />
                  <Bar dataKey="change" radius={[6, 6, 0, 0]}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.change >= 0 ? '#34d399' : '#f87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}