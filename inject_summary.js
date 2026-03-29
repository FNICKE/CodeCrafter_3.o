const fs = require('fs');
const path = 'frontend/src/pages/Recommendations.jsx';
let content = fs.readFileSync(path, 'utf8');

// The raw Summary code
const summaryCode = `function SummaryView() {
  const [symbol, setSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [symbols, setSymbols] = useState([]);
  const [symbolsMeta, setSymbolsMeta] = useState({
    exchange: 'US',
    count: 0,
    loading: true,
    error: null,
    warning: null,
    source: null,
  });
  const [symbolFilter, setSymbolFilter] = useState('');
  const [exchange, setExchange] = useState('US');
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistSelection, setWatchlistSelection] = useState('');

  useEffect(() => {
    apiGetWatchlist()
      .then((r) => setWatchlist(Array.isArray(r.data) ? r.data : []))
      .catch(() => setWatchlist([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setSymbolsMeta((m) => ({ ...m, loading: true, error: null }));
      try {
        const res = await apiGetStockSymbols({ exchange });
        if (cancelled) return;
        const list = res.data?.symbols || [];
        setSymbols(list);
        setSymbolsMeta({
          exchange: res.data?.exchange || exchange,
          count: list.length,
          loading: false,
          error: null,
          warning: res.data?.warning || null,
          source: res.data?.source || null,
        });
        setSymbol((cur) => {
          if (list.some((s) => s.symbol === cur)) return cur;
          return list[0]?.symbol || cur;
        });
      } catch (e) {
        if (!cancelled) {
          setSymbolsMeta((m) => ({
            ...m,
            loading: false,
            error: e.message || 'Failed to load list',
            warning: null,
            source: null,
          }));
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [exchange]);

  const visibleSymbols = useMemo(() => {
    const t = symbolFilter.trim().toLowerCase();
    if (!symbols.length) return [];
    if (!t) return symbols;
    return symbols.filter(
      (s) =>
        s.symbol.toLowerCase().includes(t) ||
        (s.description && s.description.toLowerCase().includes(t))
    );
  }, [symbols, symbolFilter]);

  useEffect(() => {
    if (!visibleSymbols.length) return;
    if (!visibleSymbols.some((s) => s.symbol === symbol)) {
      setSymbol(visibleSymbols[0].symbol);
    }
  }, [visibleSymbols, symbol]);

  const handleWatchlistPick = (e) => {
    const sym = e.target.value;
    setWatchlistSelection(sym);
    if (!sym) return;
    const upper = sym.toUpperCase();
    if (symbols.some((s) => s.symbol === upper)) {
      setSymbol(upper);
      setSymbolFilter('');
    } else {
      setSymbolFilter(upper);
      setSymbol(upper);
    }
  };

  const run = async (e) => {
    e?.preventDefault();
    const s = symbol.trim().toUpperCase();
    if (!s || !visibleSymbols.some((x) => x.symbol === s)) {
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const res = await apiGetStockSummary(s);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const EXCHANGE_OPTIONS = [{ code: 'US', label: 'United States (US)' }];

  return (
    <div className="sp-fade" style={{ background: 'var(--obsidian)', padding: '2rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', marginTop: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '2rem', fontFamily: "'DM Serif Display', serif", margin: 0 }}>
          <Sparkles size={28} style={{ color: 'var(--blue)' }} />
          Stock Summary
        </h1>
        <p style={{ color: 'var(--muted2)', marginTop: '.5rem' }}>
          Prediction, latest headlines, risk level, and profit outlook — powered by live Finnhub data (not financial advice).
        </p>
      </div>

      <form onSubmit={run} className="sp-card" style={{ padding: '1.5rem', marginBottom: 24, overflow: 'visible' }}>
        {symbolsMeta.warning && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              fontSize: 13,
              color: 'var(--amber)',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            {symbolsMeta.warning}
          </div>
        )}
        <div style={{ display: 'none', flexWrap: 'wrap', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 200px' }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>Market</label>
            <select
              className="sp-input"
              value={exchange}
              onChange={(e) => { setExchange(e.target.value); setSymbolFilter(''); }}
              style={{ width: '100%' }}
            >
              {EXCHANGE_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>{o.label}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>
              Search (optional)
              {symbolsMeta.count > 0 && (
                <span style={{ fontWeight: 400, color: 'var(--muted2)' }}>
                  {' '}
                  — showing {visibleSymbols.length} of {symbolsMeta.count} loaded
                </span>
              )}
            </label>
            <input
              className="sp-input"
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              placeholder="Type symbol or company name to narrow…"
              style={{ width: '100%' }}
              disabled={symbolsMeta.loading}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 220px', minWidth: 0 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>Quick pick (watchlist)</label>
            <select
              className="sp-input"
              value={watchlistSelection}
              onChange={handleWatchlistPick}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              <option value="">— Same as Portfolio —</option>
              {watchlist.map((w) => (
                <option key={w.symbol} value={w.symbol}>
                  {w.symbol}
                  {w.current != null ? \`  ~$\${Number(w.current).toFixed(2)}\` : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: "'DM Mono', monospace" }}>
              All stocks (API)
              {symbolsMeta.loading && (
                <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--blue)' }}>
                  <RefreshCw size={12} className="sp-spin" /> Loading list…
                </span>
              )}
              {symbolsMeta.error && (
                <span style={{ color: 'var(--red)', marginLeft: 8 }}>{symbolsMeta.error}</span>
              )}
            </label>
            {visibleSymbols.length === 0 && symbolFilter.trim() ? (
              <div className="sp-input" style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', background: 'var(--surface2)' }}>
                No symbols match “{symbolFilter.trim()}”. Clear search to see the full list.
              </div>
            ) : (
              <select
                className="sp-input"
                value={visibleSymbols.some((s) => s.symbol === symbol) ? symbol : visibleSymbols[0]?.symbol || ''}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  setWatchlistSelection('');
                }}
                style={{ width: '100%', cursor: 'pointer' }}
                disabled={(symbolsMeta.loading && symbols.length === 0) || visibleSymbols.length === 0}
              >
                {visibleSymbols.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.description}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              type="submit"
              className="sp-btn-primary"
              disabled={loading || !symbol.trim() || visibleSymbols.length === 0}
              style={{ minWidth: 140 }}
            >
              {loading ? <RefreshCw size={16} className="sp-spin" /> : <Search size={16} />}
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, marginBottom: 0 }}>
          Same flow as Portfolio: quick watchlist + one dropdown with the <strong>full</strong> deduped US list from Finnhub (<code style={{ fontSize: 10, background: 'var(--surface2)', padding: '2px 4px', borderRadius: 4 }}>/stock/symbol</code>), server-cached ~6h. Use search to narrow the dropdown; no manual ticker field.
        </p>
      </form>

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
            {/* Prediction */}
            <div className="sp-card" style={{ borderLeft: \`3px solid \${predColor(data.prediction?.label)}\`, padding: '1.5rem', margin: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'DM Mono', monospace" }}>
                Prediction
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: predColor(data.prediction?.label) }}>
                {data.prediction?.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 6 }}>
                Confidence ~{data.prediction?.confidence}% · {data.prediction?.horizon}
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>
                {data.prediction?.summary}
              </p>
              <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 12, color: 'var(--muted2)' }}>
                {(data.prediction?.drivers || []).map((d, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{d}</li>
                ))}
              </ul>
              {data.prediction?.signalsUsed && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--muted2)', marginBottom: 6 }}>Score contributions (points)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <span>Momentum</span><span style={{color: 'var(--text)'}}>{data.prediction.signalsUsed.momentumPoints}</span>
                    <span>Analyst mix</span><span style={{color: 'var(--text)'}}>{data.prediction.signalsUsed.analystPoints}</span>
                    <span>Finnhub sent</span><span style={{color: 'var(--text)'}}>{data.prediction.signalsUsed.finnhubSentimentPoints}</span>
                    <span>Headlines</span><span style={{color: 'var(--text)'}}>{data.prediction.signalsUsed.headlineLexiconPoints}</span>
                    <span>Buzz adj.</span><span style={{color: 'var(--text)'}}>{data.prediction.signalsUsed.buzzAdjustPoints}</span>
                  </div>
                </div>
              )}
              {data.prediction?.methodology && (
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>
                  {data.prediction.methodology} {data.prediction.limitation}
                </p>
              )}
            </div>

            {/* Risk */}
            <div className="sp-card" style={{ borderLeft: \`3px solid \${riskColor(data.risk?.level)}\`, padding: '1.5rem', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={18} style={{ color: riskColor(data.risk?.level) }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'DM Mono', monospace" }}>
                  Risk
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: riskColor(data.risk?.level) }}>{data.risk?.level}</div>
              <div style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 6 }}>
                Score {data.risk?.score}/100
              </div>
              <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 12, color: 'var(--muted2)' }}>
                {(data.risk?.factors || []).map((f, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{f}</li>
                ))}
              </ul>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>{data.risk?.disclaimer}</p>
            </div>

            {/* Profit */}
            <div className="sp-card" style={{ borderLeft: '3px solid var(--blue)', padding: '1.5rem', margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp size={18} style={{ color: 'var(--blue)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'DM Mono', monospace" }}>
                  Profit outlook
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize', color: 'var(--text)' }}>
                {data.profit?.outlook || '—'}
              </div>
              {data.profit?.upsideVsMeanTargetPercent != null && (
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8, color: data.profit.upsideVsMeanTargetPercent >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {data.profit.upsideVsMeanTargetPercent >= 0 ? '+' : ''}{data.profit.upsideVsMeanTargetPercent.toFixed(1)}% vs mean target
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 10, lineHeight: 1.5 }}>
                {data.profit?.note}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{data.profit?.disclaimer}</p>
            </div>
          </div>

          <div className="sp-card" style={{ marginBottom: 20, padding: '1.5rem' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '1.2rem', fontFamily: "'DM Serif Display', serif" }}>{data.name} <span style={{color: 'var(--blue)', fontFamily: "'DM Mono', monospace", fontSize: '1rem' }}>({data.symbol})</span></div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              {data.exchange || '—'} · {data.currency || 'USD'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>Last</span>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: 'var(--text)' }}>\${Number(data.quote?.current).toFixed(2)}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>Change</span>
                <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: (data.quote?.changePercent ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {data.quote?.changePercent != null ? \`\${data.quote.changePercent >= 0 ? '+' : ''}\${data.quote.changePercent.toFixed(2)}%\` : '—'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>Prev close</span>
                <div style={{ fontSize: 20, fontFamily: "'DM Mono', monospace", color: 'var(--text)' }}>\${data.quote?.previousClose != null ? Number(data.quote.previousClose).toFixed(2) : '—'}</div>
              </div>
            </div>
          </div>

          <div className="sp-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Newspaper size={20} style={{ color: 'var(--blue)' }} />
              <span style={{ fontWeight: 600, fontFamily: "'Instrument Sans', sans-serif" }}>Latest news</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>(Finnhub company feed, last 7 days)</span>
            </div>
            {!data.news?.length ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>No headlines returned for this symbol right now.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.news.map((article) => (
                  <div
                    key={article.id || article.url}
                    style={{
                      display: 'flex',
                      gap: 14,
                      paddingBottom: 12,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {article.image && (
                      <img
                        src={article.image}
                        alt=""
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{article.source}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                          <ClockIcon size={10} /> {timeAgo(article.datetime)}
                        </span>
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}
                      >
                        {article.headline}
                        <ExternalLink size={12} style={{ marginLeft: 6, verticalAlign: 'middle', opacity: 0.6 }} />
                      </a>
                      {article.summary && (
                        <p style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 6, lineHeight: 1.45 }}>
                          {article.summary.length > 220 ? \`\${article.summary.slice(0, 220)}…\` : article.summary}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Shield size={18} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5, margin: 0 }}>
              Predictions combine momentum, analyst recommendation mix, and Finnhub news sentiment. They are educational only and can be wrong — always do your own research before trading.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
`;

// Remove the old StockSummaryTab and old activeTab UI
// 1. Remove old StockSummaryTab component code entirely (it's at the end of the file).
content = content.replace(/function StockSummaryTab\(\) \{[\s\S]*$/, summaryCode);

// 2. Remove the top-level tabs from the UI.
const tabsRegex = /\{\/\* Tabs \*\/\}\n\s*<div style=\{\{ display: 'flex'[\s\S]*?<\/div>/;
content = content.replace(tabsRegex, '');

// 3. Inject the Summary button into the "Analyse Stocks" card header.
// Original:
// <div className="sp-card-hdr">
//   <Search size={16} color="var(--blue)" />
//   <span className="sp-card-title">Analyse <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Stocks</em></span>
// </div>
//
// New:
// <div className="sp-card-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//   <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem' }}>
//     <Search size={16} color="var(--blue)" />
//     <span className="sp-card-title">Analyse <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Stocks</em></span>
//   </div>
//   <button className="sp-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.4rem .8rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '.5rem', color: 'var(--text)', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600 }} onClick={() => setActiveTab('summary')}>
//     <Sparkles size={14} color="var(--blue)" /> Stock Summary
//   </button>
// </div>
const analyzeCardHdrRegex = /<div className="sp-card-hdr">\s*<Search size=\{16\} color="var\(--blue\)" \/>\s*<span className="sp-card-title">Analyse <em style=\{\{ fontStyle: 'italic', color: 'var\(--blue\)' \}\}>Stocks<\/em><\/span>\s*<\/div>/;
content = content.replace(analyzeCardHdrRegex, \`<div className="sp-card-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem' }}>
              <Search size={16} color="var(--blue)" />
              <span className="sp-card-title">Analyse <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Stocks</em></span>
            </div>
            {activeTab === 'overview' ? (
              <button 
                className="sp-btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.4rem .8rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '.5rem', color: 'var(--text)', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, transition: 'all .2s' }} 
                onClick={() => setActiveTab('summary')}
              >
                <Sparkles size={14} color="var(--blue)" /> Stock Summary Form
              </button>
            ) : (
              <button 
                className="sp-btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.4rem .8rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '.5rem', color: 'var(--text)', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, transition: 'all .2s' }} 
                onClick={() => setActiveTab('overview')}
              >
                ← Back to Overview
              </button>
            )}
          </div>\`);

// Update logic so that activeTab completely determines what renders below the card.
// Wait, the search card needs to ONLY show when activeTab === 'overview'.
// Actually, it's fine if the Analyse Stocks form stays, and SummaryView is just rendered beneath it?
// The user said: "current present Analyse Stocks take presnet in that on right side add on summry button and that will give me this give code page"
// If they click the button, maybe I hide the Analyse Stocks form body, and just show the Summary view beneath the header!

// Let's wrap the card body and the rest of the file in {activeTab === 'overview' ? (...) : <SummaryView />}
const cardBodyWrapStartRegex = /<div className="sp-card-body">/;
content = content.replace(cardBodyWrapStartRegex, \`{activeTab === 'overview' ? (
          <>
            <div className="sp-card-body">\`);

// Where did I put the closing of the overview view? 
// <\/div>\n    <\/div>\n  \);\n\} // this was the end of the overview component before.
// Actually, I just need to close the ternary at the end of the Recommendations function.
// Let's replace the existing summary switch logic.
const oldSwitchRegex = /\{activeTab === 'summary' \? <StockSummaryTab \/> : \(\s*<>\s*/;
content = content.replace(oldSwitchRegex, ''); // remove the old switch
const oldSwitchEndRegex = /<\/>\s*\)\}\s*<\/div>\s*<\/div>\s*\);\s*\}/s;
content = content.replace(oldSwitchEndRegex, \`          </>
        ) : (
          <SummaryView />
        )}
      </div>
    </div>
  );
}\`);

// Add Loader2 to lucide imports
content = content.replace(/AlertTriangle, Clock as ClockIcon, Shield\n\} from 'lucide-react';/, \`AlertTriangle, Clock as ClockIcon, Shield, Loader2\n} from 'lucide-react';\`);

fs.writeFileSync(path, content);
console.log('Successfully injected summary view matching users code snippet');
