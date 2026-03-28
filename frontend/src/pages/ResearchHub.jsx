import { useCallback, useEffect, useState } from 'react';
import { getNews, getMarketSentiment } from '../api';
import NewsCard from '../components/NewsCard';
import { 
  Newspaper, 
  Sparkles, 
  TrendingUp, 
  BarChart3,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export default function ResearchHub() {
  const [news, setNews] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load only stock market related news (merged equity feed)
  const loadStockMarketNews = useCallback(async () => {
    setLoading(true);
    try {
      const [newsRes, sentRes] = await Promise.all([
        getNews({ category: 'all' }),        // Only stock market merged feed
        getMarketSentiment()
      ]);

      const newsData = Array.isArray(newsRes?.data) ? newsRes.data : [];
      setNews(newsData);
      setSentiment(sentRes?.data || null);
    } catch (e) {
      console.error('Failed to load stock market news:', e);
      setNews([]);
      setSentiment(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStockMarketNews();
  }, [loadStockMarketNews]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStockMarketNews();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-12">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3.5 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl">
              <BarChart3 className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter">Research Hub</h1>
              <p className="text-zinc-400 mt-1 text-lg">Stock Market Intelligence Feed</p>
            </div>
          </div>

          {/* Problem Statement Banner */}
          <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl p-8 mb-10">
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0" />
              <div className="space-y-3">
                <p className="text-amber-300 font-semibold text-lg">
                  The Fragmented Investment Ecosystem
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  Investors and institutions struggle with scattered financial news, research reports, 
                  regulatory updates, and inconsistent market insights. This makes it extremely difficult 
                  to extract actionable intelligence, verify accuracy, and build optimal portfolios that 
                  properly balance risk, regulations, and market conditions.
                </p>
                <p className="text-teal-400 text-sm font-medium">
                  This feed curates high-signal stock market news to help you navigate this complexity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Topics */}
        {sentiment?.top_topics?.length > 0 && (
          <div className="mb-8">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3 font-semibold">Trending Themes</div>
            <div className="flex flex-wrap gap-2">
              {sentiment.top_topics.map((t, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-zinc-900 border border-teal-500/20 rounded-full text-sm text-teal-400"
                >
                  <TrendingUp size={16} />
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feed Header + Refresh */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Newspaper className="text-teal-400" size={28} />
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Stock Market Feed</h2>
              <p className="text-zinc-500 text-sm">Merged equity, M&A, IPO & Earnings intelligence</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2.5 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-2xl text-sm font-medium transition-all disabled:opacity-60"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            Refresh Feed
          </button>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-[380px] rounded-3xl bg-zinc-900 border border-zinc-800 animate-pulse"
              />
            ))
          ) : news.length === 0 ? (
            <div className="col-span-full py-28 flex flex-col items-center justify-center text-center border border-dashed border-zinc-800 rounded-3xl">
              <div className="w-24 h-24 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-700">
                <Newspaper size={52} className="text-zinc-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-zinc-200">Quiet Market</h3>
              <p className="text-zinc-500 max-w-md">
                No significant stock market headlines available at the moment.<br />
                This can happen during low-news periods or market holidays.
              </p>
              <button
                onClick={handleRefresh}
                className="mt-8 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-black font-semibold rounded-2xl transition-colors"
              >
                Try Refreshing
              </button>
            </div>
          ) : (
            news.map((article, index) => (
              <div 
                key={article.id || `${article.url}-${index}`} 
                className="transform transition-all duration-300 hover:-translate-y-1"
              >
                <NewsCard article={article} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}