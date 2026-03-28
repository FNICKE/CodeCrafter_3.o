import { useEffect, useState } from 'react';
import { getWatchlist, getQuote, searchSymbol, getCandles } from '../api';
import StockCard from '../components/StockCard';
import { Search, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Market() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [quoteData, setQuoteData] = useState(null);
  const [candleData, setCandleData] = useState([]);
  const [range, setRange] = useState('1mo'); // 1d, 5d, 1mo, 6mo, 1y
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    getWatchlist()
      .then((r) => setWatchlist(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch standard quote block independently of chart
  useEffect(() => {
    if (!selectedSymbol) return;
    setQuoteData(null);
    getQuote(selectedSymbol).then((r) => setQuoteData(r.data)).catch(console.error);
  }, [selectedSymbol]);

  // Fetch chart interactively
  useEffect(() => {
    if (!selectedSymbol) return;
    setChartLoading(true);
    getCandles(selectedSymbol, { range })
      .then((r) => {
        if (r.data.t && r.data.c) {
          const mapped = [];
          for (let i = 0; i < r.data.t.length; i++) {
            const price = r.data.c[i];
            if (price !== null) { // Yahoo sometimes returns null for closed hours
              const timestamp = r.data.t[i] * 1000;
              const d = new Date(timestamp);
              // Formatting dynamically depending on range
              let timeLabel = '';
              if (range === '1d' || range === '5d') {
                timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } else {
                timeLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
              mapped.push({ date: timeLabel, price: price });
            }
          }
          setCandleData(mapped);
        }
      })
      .catch((e) => {
        console.error("Candle Load Error:", e);
        setCandleData([]); // Show empty chart
      })
      .finally(() => setChartLoading(false));
  }, [selectedSymbol, range]);

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await searchSymbol(q);
      setSearchResults(res.data.result?.slice(0, 6) || []);
    } catch { setSearchResults([]); }
  };

  const priceColor = quoteData?.d >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';

  return (
    <div className="animate-in pb-8">
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={24} style={{ color: 'var(--accent-blue)' }} /> Market Explorer
          </h1>
          <p className="page-subtitle">Live high-resolution charts, quotes, and symbol screening</p>
        </div>
      </div>

      {/* Advanced Search Bar */}
      <div style={{ marginBottom: 24, position: 'relative', maxWidth: 480, width: '100%' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-blue)' }} />
          <input
            id="market-search"
            className="input"
            placeholder="Search ANY stock (e.g. INTC, TSLA, Apple)"
            value={searchQ}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ paddingLeft: 42, paddingRight: 40, height: 48, fontSize: 15 }}
            autoComplete="off"
          />
          {searchQ && (
            <button 
              onClick={() => { setSearchQ(''); setSearchResults([]); }}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}
            >
              &times;
            </button>
          )}
        </div>
        {searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 6, zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => { setSelectedSymbol(r.symbol); setSearchQ(''); setSearchResults([]); }}
                style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}
                className="hover:bg-[var(--bg-card-hover)] transition"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', width: 60, textAlign: 'left' }}>{r.symbol}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 200, textAlign: 'left' }}>{r.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Security Analysis */}
      {selectedSymbol && (
        <div className="card" style={{ marginBottom: 32, padding: 0, overflow: 'hidden' }}>
          {/* Header Data */}
          <div style={{ padding: '24px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 auto' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{selectedSymbol}</div>
              
              {quoteData ? (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>${quoteData.c?.toFixed(2)}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: priceColor, display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 4 }}>
                    {quoteData.d >= 0 ? <TrendingUp size={16} strokeWidth={3} /> : <TrendingDown size={16} strokeWidth={3} />}
                    {quoteData.d >= 0 ? '+' : ''}{quoteData.d?.toFixed(2)} ({quoteData.dp?.toFixed(2)}%)
                  </span>
                </div>
              ) : <div className="skeleton" style={{ width: 240, height: 42, marginTop: 8 }} />}
            </div>
            
            {/* Quick Stats Grid */}
            {quoteData && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 32px', fontSize: 13, background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
                {[
                  ['Open', quoteData.o],
                  ['Prev Close', quoteData.pc],
                  ['Day High', quoteData.h],
                  ['Day Low', quoteData.l],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${v?.toFixed(2) || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="divider" style={{ margin: '24px 0 0 0' }} />

          {/* Chart Section */}
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                <Clock size={16} style={{ color: 'var(--accent-blue)' }} /> Real-Time & Historical Interpolation
              </div>
              <div style={{ display: 'flex', gap: 6, background: 'var(--bg-secondary)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                {[
                  { id: '1d', label: '1D' },
                  { id: '5d', label: '1W' },
                  { id: '1mo', label: '1M' },
                  { id: '6mo', label: '6M' },
                  { id: '1y', label: '1Y' },
                ].map((rng) => (
                  <button
                    key={rng.id}
                    onClick={() => setRange(rng.id)}
                    style={{
                      background: range === rng.id ? 'var(--accent-blue)' : 'transparent',
                      color: range === rng.id ? '#fff' : 'var(--text-secondary)',
                      border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {rng.label}
                  </button>
                ))}
              </div>
            </div>

            {chartLoading ? (
               <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
            ) : candleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={candleData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={quoteData?.d >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={quoteData?.d >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(99,120,180,0.06)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#8b95b0', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                  <YAxis tick={{ fill: '#8b95b0', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `$${v.toFixed(1)}`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} 
                    itemStyle={{ color: 'var(--accent-blue)' }}
                    formatter={(v) => [`$${v.toFixed(2)}`, 'Price']} 
                    labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
                  />
                  <Area type="monotone" dataKey="price" stroke={quoteData?.d >= 0 ? '#22c55e' : '#ef4444'} strokeWidth={3} fill="url(#cGrad)" dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: quoteData?.d >= 0 ? '#22c55e' : '#ef4444' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                Chart data unavailable for {selectedSymbol} in this range
              </div>
            )}
          </div>
        </div>
      )}

      {/* Watchlist Grid */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Market Movers Watchlist</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {loading
          ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="skeleton" style={{ height: 110 }} />)
          : watchlist.map((s) => (
              <StockCard key={s.symbol} {...s} onClick={() => { setSelectedSymbol(s.symbol); window.scrollTo(0,0); }} />
            ))}
      </div>
    </div>
  );
}
