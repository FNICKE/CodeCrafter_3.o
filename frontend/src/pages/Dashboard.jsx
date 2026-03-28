import { useEffect, useMemo, useState } from 'react';
import { getCompaniesWithNews } from '../api';
import NewsCard from '../components/NewsCard';
import {
  Building2,
  Globe,
  LineChart,
  Newspaper,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const NEWS_PER_STOCK = 8;
const ROW_PANEL_MAX = 'min(56vh, 520px)';

function formatCap(n, currency = 'USD') {
  if (n == null || Number.isNaN(Number(n))) return '—';
  let cap = Number(n);
  if (cap > 0 && cap < 1e12) cap *= 1e6;
  const mult = cap >= 1e12 ? [1e12, 'T'] : cap >= 1e9 ? [1e9, 'B'] : cap >= 1e6 ? [1e6, 'M'] : [1, ''];
  const v = cap / mult[0];
  return `${v < 10 ? v.toFixed(2) : v.toFixed(1)}${mult[1]} ${currency}`;
}

function formatPrice(c, currency) {
  if (c == null || c === 0) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(c);
  } catch {
    return `${c}`;
  }
}

/** Turn API payload into plain-language notes (education only, not advice). */
function buildThesis({ quote, profile, sentiment, localData }, opts = {}) {
  const compact = opts.compact === true;
  const maxDesc = compact ? 280 : 520;
  const bullets = [];
  const name = profile?.name || profile?.ticker || 'This company';
  const industry = profile?.finnhubIndustry;
  const country = profile?.country;
  const description = (profile?.description || '').trim();

  if (description) {
    const short =
      description.length > maxDesc ? `${description.slice(0, maxDesc).trim()}…` : description;
    bullets.push({
      title: 'What they do',
      body: short,
      icon: 'building',
    });
  }

  if (industry) {
    bullets.push({
      title: 'Sector positioning',
      body: `${name} operates in ${industry}${
        country ? ` (${country})` : ''
      }. Understanding the sector helps you compare peers and growth drivers.`,
      icon: 'globe',
    });
  }

  const dp = quote?.dp;
  const d = quote?.d;
  if (dp != null && typeof dp === 'number') {
    const direction = dp >= 0 ? 'up' : 'down';
    bullets.push({
      title: 'Recent price action',
      body: `The stock is ${direction} about ${Math.abs(dp).toFixed(2)}% vs prior close${
        d != null ? ` (${d >= 0 ? '+' : ''}${d.toFixed(2)} on the day)` : ''
      }. Traders often pair short-term moves with fundamentals and news.`,
      icon: 'chart',
    });
  }

  const bull = sentiment?.sentiment?.bullishPercent;
  const bear = sentiment?.sentiment?.bearishPercent;
  const buzz = sentiment?.buzz;
  const score = sentiment?.companyNewsScore;
  if (bull != null && bear != null) {
    bullets.push({
      title: 'News flow (company headlines)',
      body: `Finnhub sentiment on recent headlines: roughly ${Number(bull).toFixed(0)}% tagged bullish vs ${Number(
        bear
      ).toFixed(0)}% bearish.${
        score != null
          ? ` Aggregate news score for the symbol is ${Number(score).toFixed(3)} (scale varies by provider).`
          : ''
      }${
        buzz?.articlesInLastWeek
          ? ` About ${buzz.articlesInLastWeek} articles mentioned the stock in the last week.`
          : ''
      }`,
      icon: 'news',
    });
  }

  if (localData?.esg_score != null) {
    bullets.push({
      title: 'ESG (from your research DB)',
      body: `Recorded ESG score: ${localData.esg_score}. Higher scores are often used as a sustainability lens—not a buy signal by itself.`,
      icon: 'sparkle',
    });
  }

  if (!bullets.length) {
    bullets.push({
      title: 'Snapshot',
      body: 'Profile data was limited for this name—use the quote row and related headlines beside it.',
      icon: 'sparkle',
    });
  }

  bullets.push({
    title: 'Not financial advice',
    body:
      'HackTrix surfaces data to help you learn. Always verify filings, risk, and your own goals before investing.',
    icon: 'sparkle',
  });

  return bullets;
}

function iconFor(key) {
  const s = { color: 'var(--accent-blue)' };
  const sz = 16;
  if (key === 'building') return <Building2 size={sz} style={s} />;
  if (key === 'globe') return <Globe size={sz} style={s} />;
  if (key === 'chart') return <LineChart size={sz} style={s} />;
  if (key === 'news') return <Newspaper size={sz} style={s} />;
  return <Sparkles size={sz} style={s} />;
}

function CompanyRow({ company, rowIndex, highlighted }) {
  const newsFirst = rowIndex % 2 === 1;
  const quote = company.quote || {};
  const prof = company.profile || {};
  const currency = company.currency || prof.currency || 'USD';
  const thesis = buildThesis(
    {
      quote,
      profile: {
        ...prof,
        name: company.name || prof.name,
        exchange: company.exchange,
      },
      sentiment: {},
      localData: null,
    },
    { compact: true }
  );

  const newsList = Array.isArray(company.news)
    ? [...company.news].sort((a, b) => (b.datetime || 0) - (a.datetime || 0)).slice(0, NEWS_PER_STOCK)
    : [];

  const stockCard = (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: ROW_PANEL_MAX,
        minHeight: 280,
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        {prof.logo && (
          <img
            src={prof.logo}
            alt=""
            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', background: '#fff' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
            {company.exchange || '—'} · {company.symbol}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2, lineHeight: 1.25 }}>
            {company.name || company.symbol}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            <div>
              <div className="stat-label" style={{ fontSize: 10 }}>Last</div>
              <div className="stat-value" style={{ fontSize: 16, marginTop: 2 }}>{formatPrice(quote.c, currency)}</div>
            </div>
            <div>
              <div className="stat-label" style={{ fontSize: 10 }}>Chg</div>
              <div
                className="stat-value"
                style={{
                  fontSize: 16,
                  marginTop: 2,
                  color: (quote.dp || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                }}
              >
                {quote.d != null ? `${quote.d >= 0 ? '+' : ''}${quote.d.toFixed(2)}` : '—'}{' '}
                {quote.dp != null ? `(${quote.dp >= 0 ? '+' : ''}${quote.dp.toFixed(2)}%)` : ''}
              </div>
            </div>
            <div>
              <div className="stat-label" style={{ fontSize: 10 }}>Mkt cap</div>
              <div className="stat-value" style={{ fontSize: 16, marginTop: 2 }}>
                {formatCap(prof.marketCapitalization, currency)}
              </div>
            </div>
          </div>
          {prof.weburl && (
            <a
              href={prof.weburl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, marginTop: 6, display: 'inline-block', color: 'var(--accent-blue)' }}
            >
              Website →
            </a>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 16px 14px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          <TrendingUp size={16} />
          Context
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.45, flexShrink: 0 }}>
          From your overview API—not a buy/sell recommendation.
        </p>
        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingRight: 4,
          }}
        >
          {thesis.map((t, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 11px',
                borderRadius: 10,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--accent-blue)18',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {iconFor(t.icon)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{t.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const newsCard = (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: ROW_PANEL_MAX,
        minHeight: 280,
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <Newspaper size={16} />
          Latest: {company.symbol}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.45, marginBottom: 0 }}>
          Company headlines for this ticker (newest first).
        </p>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {newsList.length > 0 ? (
          newsList.map((article) => <NewsCard key={`${company.symbol}-${article.id}`} article={article} compact />)
        ) : (
          <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>No company news for {company.symbol}.</div>
        )}
      </div>
    </div>
  );

  return (
    <div
      id={`dash-company-${company.symbol}`}
      style={{
        marginBottom: 28,
        scrollMarginTop: 100,
        borderRadius: 14,
        transition: 'box-shadow 0.35s ease',
        boxShadow: highlighted ? '0 0 0 2px var(--accent-blue), 0 8px 32px rgba(63, 142, 245, 0.15)' : undefined,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        <div style={{ order: newsFirst ? 2 : 1, minWidth: 0 }}>{stockCard}</div>
        <div style={{ order: newsFirst ? 1 : 2, minWidth: 0 }}>{newsCard}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedSymbol, setHighlightedSymbol] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCompaniesWithNews({ newsLimit: NEWS_PER_STOCK })
      .then((r) => {
        if (cancelled) return;
        const rows = r.data?.companies;
        setCompanies(Array.isArray(rows) ? rows : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.response?.data?.message || e.message || 'Failed to load overview');
          setCompanies([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!companies.length) return [];
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        (c.name && String(c.name).toLowerCase().includes(q)) ||
        (c.industry && String(c.industry).toLowerCase().includes(q))
    );
  }, [companies, searchQ]);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const onDown = (e) => {
      if (e.target.closest?.('[data-dash-search]')) return;
      setSearchOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [searchOpen]);

  const goToCompany = (symbol) => {
    const id = `dash-company-${symbol}`;
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHighlightedSymbol(symbol);
    window.setTimeout(() => setHighlightedSymbol((s) => (s === symbol ? null : s)), 2200);
    setSearchQ('');
    setSearchOpen(false);
  };

  return (
    <div className="animate-in">
      <div
        className="page-header"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 className="page-title">Stocks & company news</h1>
          <p className="page-subtitle">
            Rows alternate layout (stock · news, then news · stock). Jump to any company from search.
          </p>
        </div>

        {!loading && companies.length > 0 && (
          <div data-dash-search style={{ position: 'relative', minWidth: 280, maxWidth: 400, width: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
              }}
            >
              <Search size={16} color="var(--text-muted)" />
              <input
                placeholder="Search company or symbol…"
                value={searchQ}
                onChange={(e) => {
                  setSearchQ(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            {searchOpen && (
              <div
                className="card"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '100%',
                  marginTop: 6,
                  zIndex: 30,
                  padding: 8,
                  maxHeight: 320,
                  overflowY: 'auto',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                }}
              >
                {suggestions.length === 0 ? (
                  <div style={{ padding: 12, fontSize: 13, color: 'var(--text-muted)' }}>No match.</div>
                ) : (
                  suggestions.map((c) => (
                    <button
                      key={c.symbol}
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        marginBottom: 4,
                        height: 'auto',
                        padding: '8px 10px',
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToCompany(c.symbol)}
                    >
                      <span style={{ fontWeight: 700, minWidth: 52 }}>{c.symbol}</span>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: 12, flex: 1 }}>
                        {c.name}
                        {c.industry ? (
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>{c.industry}</span>
                        ) : null}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 320 }} />
          ))}
        </div>
      ) : error ? (
        <div className="card" style={{ padding: 24, color: 'var(--accent-red)' }}>{error}</div>
      ) : companies.length === 0 ? (
        <div className="card" style={{ padding: 24, color: 'var(--text-secondary)' }}>No companies returned from the API.</div>
      ) : (
        companies.map((c, i) => (
          <CompanyRow key={c.symbol} company={c} rowIndex={i} highlighted={highlightedSymbol === c.symbol} />
        ))
      )}
    </div>
  );
}



