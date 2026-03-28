import { useEffect, useState } from 'react';
import { getWatchlist, getMarketSentiment, getNews } from '../api';
import StockCard from '../components/StockCard';
import NewsCard from '../components/NewsCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Newspaper, BarChart2, Bell, Wifi } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getWatchlist(),
      getMarketSentiment(),
      getNews({ category: 'general' }),
    ])
      .then(([wl, sent, n]) => {
        setWatchlist(wl.data);
        setSentiment(sent.data);
        setNews(n.data.slice(0, 4));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topMovers = [...watchlist].sort((a, b) => Math.abs(b.change_percent) - Math.abs(a.change_percent)).slice(0, 4);

  const mockPortfolioCurve = [
    { x: 'Jan', v: 42000 }, { x: 'Feb', v: 44500 }, { x: 'Mar', v: 43000 },
    { x: 'Apr', v: 47000 }, { x: 'May', v: 51000 }, { x: 'Jun', v: 49000 },
    { x: 'Jul', v: 54000 }, { x: 'Aug', v: 58200 },
  ];

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's your market overview for today</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--accent-green)' }}>
          <span className="pulse-live" /> Live Data
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Portfolio Value', value: '$58,420', change: '+4.2%', icon: <TrendingUp size={18} />, color: 'var(--accent-blue)' },
          { label: "Today's P&L", value: '+$2,340', change: '+4.18%', icon: <BarChart2 size={18} />, color: 'var(--accent-green)' },
          { label: 'News Articles', value: sentiment?.total_articles_analyzed || '—', change: 'Analyzed', icon: <Newspaper size={18} />, color: 'var(--accent-purple)' },
          { label: 'Active Alerts', value: '3', change: '2 triggered', icon: <Bell size={18} />, color: 'var(--accent-amber)' },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value" style={{ marginTop: 8, fontSize: 22 }}>{stat.value}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--accent-green)' }}>{stat.change}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: `${stat.color}18`, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Portfolio chart */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Portfolio Performance</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockPortfolioCurve}>
              <defs>
                <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3f8ef5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3f8ef5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="x" tick={{ fill: '#8b95b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                formatter={(v) => [`$${v.toLocaleString()}`, 'Value']}
              />
              <Area type="monotone" dataKey="v" stroke="#3f8ef5" strokeWidth={2.5} fill="url(#pGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Market Sentiment */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Market Sentiment</div>
          {sentiment ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 6 }}>
                  {sentiment.overall_sentiment === 'bullish' ? '🟢' : sentiment.overall_sentiment === 'bearish' ? '🔴' : '🟡'}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>{sentiment.market_mood}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sentiment.total_articles_analyzed} articles analyzed</div>
              </div>
              {[
                { label: 'Bullish', val: sentiment.bullish_percent, color: 'var(--accent-green)' },
                { label: 'Neutral', val: sentiment.neutral_percent, color: 'var(--accent-amber)' },
                { label: 'Bearish', val: sentiment.bearish_percent, color: 'var(--accent-red)' },
              ].map((s) => (
                <div key={s.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>
                    <span>{s.label}</span><span style={{ color: s.color }}>{s.val}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.val}%`, background: s.color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </>
          ) : <div className="skeleton" style={{ height: 160 }} />}
        </div>
      </div>

      {/* Top Movers */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Top Movers
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/market')}>View All</button>
        </div>
        <div className="grid-4">
          {loading
            ? [1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 100 }} />)
            : topMovers.map((s) => (
                <StockCard key={s.symbol} {...s} onClick={() => navigate(`/market?symbol=${s.symbol}`)} />
              ))}
        </div>
      </div>

      {/* Latest News */}
      <div>
        <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Latest News
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/research')}>View All</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading
            ? [1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 90 }} />)
            : news.map((article) => <NewsCard key={article.id} article={article} />)}
        </div>
      </div>
    </div>
  );
}
