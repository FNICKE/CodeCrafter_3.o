import { useEffect, useState } from 'react';
import { getNews, getMarketSentiment } from '../api';
import NewsCard from '../components/NewsCard';
import { Newspaper, Filter, TrendingUp } from 'lucide-react';

const CATEGORIES = ['general', 'forex', 'crypto', 'merger'];

export default function ResearchHub() {
  const [news, setNews] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(true);
  const [tickerFilter, setTickerFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [category]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getNews({ category }),
      getMarketSentiment(),
    ]).then(([n, s]) => {
      setNews(n.data);
      setSentiment(s.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  const handleTickerSearch = async (e) => {
    e.preventDefault();
    if (!tickerFilter.trim()) { loadData(); return; }
    setLoading(true);
    try {
      const res = await getNews({ ticker: tickerFilter.toUpperCase() });
      setNews(res.data);
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">📰 Research Hub</h1>
        <p className="page-subtitle">Verified financial news with sentiment scores</p>
      </div>

      {/* Topics from sentiment */}
      {sentiment?.top_topics && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {sentiment.top_topics.map((t) => (
            <span key={t} className="badge badge-blue" style={{ fontSize: 12, padding: '5px 12px' }}>
              <TrendingUp size={11} /> {t}
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-ghost'}`}
              id={`cat-${c}`}
              onClick={() => setCategory(c)}
              style={{ textTransform: 'capitalize' }}
            >
              {c}
            </button>
          ))}
        </div>

        <form onSubmit={handleTickerSearch} style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <input
            className="input"
            placeholder="Filter by ticker (e.g. AAPL)"
            value={tickerFilter}
            onChange={(e) => setTickerFilter(e.target.value)}
            style={{ width: 200 }}
            id="research-ticker-filter"
          />
          <button type="submit" className="btn btn-ghost btn-sm">
            <Filter size={14} /> Filter
          </button>
        </form>
      </div>

      {/* News */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading
          ? [1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: 100 }} />)
          : news.length === 0
          ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <Newspaper size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <div style={{ color: 'var(--text-secondary)' }}>No news found</div>
            </div>
          )
          : news.map((article) => <NewsCard key={article.id || article.url} article={article} />)
        }
      </div>
    </div>
  );
}
