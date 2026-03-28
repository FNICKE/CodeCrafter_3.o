import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StockCard({ symbol, current, change, change_percent, onClick }) {
  const isUp = change > 0;
  const isDown = change < 0;

  return (
    <div
      className="card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', userSelect: 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{symbol}</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6, color: 'var(--text-primary)' }}>
            ${current ? Number(current).toFixed(2) : '—'}
          </div>
        </div>
        <div style={{
          padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 13, fontWeight: 600,
          background: isUp ? 'rgba(34,197,94,0.12)' : isDown ? 'rgba(239,68,68,0.12)' : 'rgba(100,100,100,0.12)',
          color: isUp ? 'var(--accent-green)' : isDown ? 'var(--accent-red)' : 'var(--text-muted)',
        }}>
          {isUp ? <TrendingUp size={14} /> : isDown ? <TrendingDown size={14} /> : <Minus size={14} />}
          {change_percent ? `${change_percent > 0 ? '+' : ''}${Number(change_percent).toFixed(2)}%` : '0%'}
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        {change > 0 ? '+' : ''}{change ? Number(change).toFixed(2) : '0.00'} today
      </div>
    </div>
  );
}
