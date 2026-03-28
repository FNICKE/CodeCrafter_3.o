import { ExternalLink, Clock, Shield } from 'lucide-react';

export default function NewsCard({ article, compact = false }) {
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

  const imgSize = compact ? 48 : 80;
  const gap = compact ? 10 : 16;
  const metaMb = compact ? 5 : 8;
  const headlineSize = compact ? 13 : 14;
  const summaryClamp = compact ? 1 : 2;

  return (
    <div className="card" style={{ display: 'flex', gap, padding: compact ? '10px 12px' : undefined }}>
      {article.image && (
        <img
          src={article.image}
          alt=""
          style={{ width: imgSize, height: imgSize, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 8, marginBottom: metaMb, flexWrap: 'wrap' }}>
          {article.ticker && (
            <span className="badge" style={{ fontSize: compact ? 9 : 10, fontWeight: 700, background: 'var(--accent-blue)22', color: 'var(--accent-blue)' }}>
              {article.ticker}
            </span>
          )}
          {article.feedLabel && (
            <span
              className="badge"
              style={{
                fontSize: compact ? 9 : 10,
                fontWeight: 600,
                textTransform: 'capitalize',
                background: 'rgba(212, 165, 116, 0.15)',
                color: 'var(--accent-amber)',
              }}
            >
              {article.feedLabel === 'ipo' ? 'IPO' : article.feedLabel === 'company' ? 'Company' : article.feedLabel}
            </span>
          )}
          <span style={{ fontSize: compact ? 10 : 11, fontWeight: 600, color: 'var(--text-muted)' }}>{article.source}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: compact ? 10 : 11, color: 'var(--text-muted)' }}>
            <Clock size={compact ? 9 : 10} /> {timeAgo(article.datetime)}
          </span>
          {!compact && (
            <span className="badge" style={{ background: `${sentimentColor}20`, color: sentimentColor, fontSize: 10 }}>
              {sentimentLabel}
            </span>
          )}
          {!compact && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              <Shield size={10} style={{ color: trust > 80 ? 'var(--accent-green)' : 'var(--accent-amber)' }} />
              Trust {trust}
            </span>
          )}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'block' }}
        >
          <div style={{ fontSize: headlineSize, fontWeight: 600, lineHeight: 1.35, marginBottom: compact ? 4 : 6, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            {article.headline}
            <ExternalLink size={compact ? 11 : 12} style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }} />
          </div>
        </a>
        {article.summary && (
          <p style={{
            fontSize: compact ? 11 : 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.45,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: summaryClamp,
            WebkitBoxOrient: 'vertical',
          }}
          >
            {article.summary}
          </p>
        )}
      </div>
    </div>
  );
}
