import { ExternalLink, Clock, Shield } from 'lucide-react';

export default function NewsCard({ article }) {
  const sentiment = article.sentiment_score || 0;
  const trust = article.trust_score || 75;
  const sentimentColor = sentiment > 0.1 ? 'var(--accent-green)' : sentiment < -0.1 ? 'var(--accent-red)' : 'var(--accent-amber)';
  const sentimentLabel = sentiment > 0.1 ? 'Bullish' : sentiment < -0.1 ? 'Bearish' : 'Neutral';

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - ts * 1000) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="card" style={{ display: 'flex', gap: 16 }}>
      {article.image && (
        <img
          src={article.image}
          alt=""
          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{article.source}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
            <Clock size={10} /> {timeAgo(article.datetime)}
          </span>
          <span className="badge" style={{ background: `${sentimentColor}20`, color: sentimentColor, fontSize: 10 }}>
            {sentimentLabel}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            <Shield size={10} style={{ color: trust > 80 ? 'var(--accent-green)' : 'var(--accent-amber)' }} />
            Trust {trust}
          </span>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'block' }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 6, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            {article.headline}
            <ExternalLink size={12} style={{ flexShrink: 0, marginTop: 3, color: 'var(--text-muted)' }} />
          </div>
        </a>
        {article.summary && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {article.summary}
          </p>
        )}
      </div>
    </div>
  );
}
