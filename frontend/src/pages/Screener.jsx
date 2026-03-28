import { useEffect, useState } from 'react';
import { getSectorPerformance } from '../api';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function Screener() {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSectorPerformance().then((r) => setSectors(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">📊 Sector Screener</h1>
        <p className="page-subtitle">Analyze performance across market sectors</p>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 280 }} />
      ) : (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Sector ETF Performance</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectors} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8b95b0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v?.toFixed(2)}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8b95b0', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v > 0 ? '+' : ''}${v?.toFixed(2)}%`, 'Change']} />
              <Bar dataKey="change_percent" radius={[0, 6, 6, 0]}>
                {sectors.map((s, i) => (
                  <Cell key={i} fill={s.change_percent >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading
          ? [1,2,3,4,5].map((i) => <div key={i} className="skeleton" style={{ height: 60 }} />)
          : sectors.map((s) => (
              <div key={s.symbol} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent-blue)', minWidth: 50 }}>{s.symbol}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>${s.current?.toFixed(2) || '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: s.change_percent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {s.change_percent >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {s.change_percent ? `${s.change_percent > 0 ? '+' : ''}${s.change_percent.toFixed(2)}%` : '0%'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
