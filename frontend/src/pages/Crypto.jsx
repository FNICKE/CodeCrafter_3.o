import { useEffect, useState } from 'react';
import { getCryptoPrices } from '../api';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function Crypto() {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCryptoPrices().then((r) => setCryptos(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const icons = { BTCUSDT: '₿', ETHUSDT: 'Ξ', SOLUSDT: '◎', XRPUSDT: '✕', DOGEUSDT: 'Ð' };
  const names = { BTCUSDT: 'Bitcoin', ETHUSDT: 'Ethereum', SOLUSDT: 'Solana', XRPUSDT: 'Ripple', DOGEUSDT: 'Dogecoin' };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">₿ Crypto Market</h1>
        <p className="page-subtitle">Live cryptocurrency prices via Finnhub</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        {loading
          ? [1,2,3,4,5].map((i) => <div key={i} className="skeleton" style={{ height: 130 }} />)
          : cryptos.map((c) => {
              const isUp = c.change_percent >= 0;
              return (
                <div key={c.symbol} className="card">
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{icons[c.symbol]}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{names[c.symbol] || c.symbol}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{c.symbol}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                    ${c.current ? Number(c.current).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 13, fontWeight: 600, color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {c.change_percent ? `${c.change_percent > 0 ? '+' : ''}${c.change_percent.toFixed(2)}%` : '0%'}
                  </div>
                </div>
              );
            })}
      </div>

      {!loading && cryptos.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Change Comparison</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cryptos.map((c) => ({ name: c.symbol.replace('USDT',''), change: Number((c.change_percent||0).toFixed(2)) }))}>
              <XAxis dataKey="name" tick={{ fill: '#8b95b0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b95b0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="change" radius={[6,6,0,0]} fill="#3f8ef5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
