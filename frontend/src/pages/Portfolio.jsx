import { useEffect, useState } from 'react';
import {
  getPortfolios, getHoldings, addHolding, updateHolding,
  deleteHolding, getQuote, searchSymbol, getWatchlist,
} from '../api';
import {
  Plus, Search, Pencil, Trash2, Check, X,
  BarChart3, TrendingUp, TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  .pf-root {
    --blue:        #3b9eff;
    --blue-glow:   rgba(59,158,255,.14);
    --blue-border: rgba(59,158,255,.22);
    --obsidian:    #080b0f;
    --surface:     #0e1318;
    --surface2:    #141b22;
    --surface3:    #1c2630;
    --border:      rgba(255,255,255,.06);
    --text:        #e8edf2;
    --muted:       #5a6878;
    --muted2:      #8a9ab0;
    --green:       #34d399;
    --red:         #f87171;
    font-family: 'Instrument Sans', sans-serif;
    background: var(--obsidian);
    color: var(--text);
    min-height: 100vh;
    padding-bottom: 4rem;
  }

  /* Ticker */
  .pf-ticker-wrap { overflow: hidden; background: var(--surface); border-bottom: 1px solid var(--border); }
  .pf-ticker-inner { display: flex; width: max-content; animation: pfTick 42s linear infinite; }
  .pf-ticker-inner:hover { animation-play-state: paused; }
  @keyframes pfTick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  .pf-ticker-item { padding: 5px 1.75rem; font-family: 'DM Mono', monospace; font-size: .7rem; letter-spacing: .04em; white-space: nowrap; }
  .pf-ticker-item.up { color: var(--blue); } .pf-ticker-item.dn { color: var(--red); }

  /* Hero */
  .pf-hero { position: relative; padding: 3rem 0 2.25rem; overflow: hidden; }
  .pf-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 55% 80% at 5% 60%, rgba(59,158,255,.08) 0%, transparent 70%); pointer-events: none; }
  .pf-hero-grid { position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 75% 100% at 5% 60%, black 20%, transparent 80%); opacity: .35; }
  .pf-eyebrow { font-family: 'DM Mono', monospace; font-size: .65rem; letter-spacing: .18em; text-transform: uppercase; color: var(--blue); margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
  .pf-eyebrow::before { content: ''; width: 2rem; height: 1px; background: var(--blue); display: inline-block; }
  .pf-title { font-family: 'DM Serif Display', serif; font-size: clamp(2.4rem, 5vw, 4.2rem); line-height: 1.05; letter-spacing: -.02em; margin: 0; }
  .pf-title em { font-style: italic; color: var(--blue); }
  .pf-subtitle { color: var(--muted2); font-size: .95rem; margin-top: .65rem; line-height: 1.6; }
  .pf-live { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); animation: pfPulse 2s ease-out infinite; flex-shrink: 0; }
  @keyframes pfPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(59,158,255,.6) } 50% { box-shadow: 0 0 0 6px rgba(59,158,255,0) } }

  /* Cards */
  .pf-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; overflow: hidden; margin-bottom: 1.5rem; transition: border-color .25s; }
  .pf-card:hover { border-color: var(--blue-border); }
  .pf-card-hdr { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: .625rem; }
  .pf-card-title { font-family: 'DM Serif Display', serif; font-size: 1.3rem; }
  .pf-card-body { padding: 1.5rem; }

  /* Form */
  .pf-input { width: 100%; padding: .6rem 1rem; background: var(--surface2); border: 1px solid var(--border); border-radius: .75rem; color: var(--text); font-size: .875rem; outline: none; font-family: 'Instrument Sans', sans-serif; transition: border-color .2s, box-shadow .2s; }
  .pf-input:focus { border-color: var(--blue-border); box-shadow: 0 0 0 3px var(--blue-glow); }
  .pf-input::placeholder { color: var(--muted); }
  .pf-input-wrap { position: relative; }
  .pf-input-icon { position: absolute; left: .875rem; top: 50%; transform: translateY(-50%); pointer-events: none; }
  .pf-input-wrap .pf-input { padding-left: 2.5rem; }
  .pf-select { width: 100%; padding: .6rem 1rem; background: var(--surface2); border: 1px solid var(--border); border-radius: .75rem; color: var(--text); font-size: .875rem; outline: none; font-family: 'Instrument Sans', sans-serif; cursor: pointer; }
  .pf-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: .875rem; align-items: end; }

  /* Dropdown */
  .pf-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: var(--surface2); border: 1px solid var(--border); border-radius: 1rem; z-index: 50; max-height: 280px; overflow-y: auto; box-shadow: 0 16px 40px rgba(0,0,0,.45); }
  .pf-dropdown-item { width: 100%; text-align: left; padding: .7rem 1rem; border: none; background: transparent; color: var(--text); display: flex; align-items: center; gap: .75rem; cursor: pointer; border-bottom: 1px solid var(--border); font-size: .85rem; }
  .pf-dropdown-item:last-child { border-bottom: none; }
  .pf-dropdown-item:hover { background: var(--surface3); }
  .pf-dropdown-sym { font-family: 'DM Mono', monospace; font-size: .8rem; font-weight: 500; color: var(--blue); min-width: 60px; }

  /* Live preview */
  .pf-live-preview { padding: 1rem 1.25rem; background: var(--surface2); border: 1px solid var(--border); border-radius: .875rem; margin-top: .875rem; display: flex; gap: 2rem; flex-wrap: wrap; }
  .pf-preview-chip-lbl { font-family: 'DM Mono', monospace; font-size: .6rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); }
  .pf-preview-chip-val { font-family: 'DM Mono', monospace; font-size: .95rem; margin-top: .2rem; }

  /* Buttons */
  .pf-btn-primary { display: inline-flex; align-items: center; gap: .4rem; padding: .625rem 1.25rem; background: var(--blue); color: #fff; border: none; border-radius: .75rem; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s; font-family: 'Instrument Sans', sans-serif; }
  .pf-btn-primary:hover:not(:disabled) { background: var(--blue-dim, #1a7ee0); box-shadow: 0 4px 16px rgba(59,158,255,.3); }
  .pf-btn-primary:disabled { opacity: .45; cursor: not-allowed; }
  .pf-btn-ghost { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: .5rem; border: 1px solid var(--border); background: var(--surface2); color: var(--muted2); cursor: pointer; transition: all .15s; }
  .pf-btn-ghost:hover:not(:disabled) { background: var(--surface3); color: var(--text); }
  .pf-btn-ghost.danger:hover { border-color: rgba(248,113,113,.35); color: var(--red); }
  .pf-btn-ghost.success:hover { border-color: rgba(52,211,153,.35); color: var(--green); }
  .pf-btn-ghost:disabled { opacity: .4; cursor: not-allowed; }
  .pf-cur-btn { padding: .35rem .75rem; border-radius: .5rem; border: 1px solid var(--border); background: var(--surface2); color: var(--muted2); font-size: .75rem; font-weight: 600; cursor: pointer; transition: all .15s; font-family: 'DM Mono', monospace; }
  .pf-cur-btn.active { background: var(--blue); color: #fff; border-color: var(--blue); }

  /* Total value bar */
  .pf-total-bar { padding: 1.25rem 1.5rem; background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
  .pf-total-lbl { font-family: 'DM Mono', monospace; font-size: .65rem; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); }
  .pf-total-val { font-family: 'DM Mono', monospace; font-size: 1.75rem; font-weight: 500; color: var(--blue); margin-top: .2rem; }

  /* Holdings grid */
  .pf-holdings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
  @media (max-width: 900px) { .pf-holdings-grid { grid-template-columns: 1fr; } }

  /* Table */
  .pf-table { width: 100%; border-collapse: collapse; }
  .pf-table th { font-family: 'DM Mono', monospace; font-size: .6rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); padding: .5rem .75rem; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; }
  .pf-table td { padding: .75rem .75rem; font-size: .83rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .pf-table tr:last-child td { border-bottom: none; }
  .pf-table tr:hover td { background: rgba(59,158,255,.03); }
  .pf-table tr.editing td { background: rgba(59,158,255,.05); }
  .pf-sym-cell { font-family: 'DM Mono', monospace; font-weight: 500; color: var(--blue); }
  .pf-pnl-pos { color: var(--green); font-family: 'DM Mono', monospace; font-size: .8rem; }
  .pf-pnl-neg { color: var(--red);   font-family: 'DM Mono', monospace; font-size: .8rem; }
  .pf-table-input { width: 100%; padding: .3rem .6rem; background: var(--surface3); border: 1px solid var(--blue-border); border-radius: .5rem; color: var(--text); font-size: .8rem; outline: none; font-family: 'DM Mono', monospace; }

  /* Skel */
  .pf-skel { background: var(--surface); border: 1px solid var(--border); border-radius: 1.25rem; position: relative; overflow: hidden; }
  .pf-skel::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,.04) 50%, transparent 70%); background-size: 200% 100%; animation: pfShim 1.6s ease-in-out infinite; }
  @keyframes pfShim { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }

  @keyframes pfFadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  .pf-fade { animation: pfFadeUp .4s ease both; }

  .pf-empty { text-align: center; padding: 4rem 1.5rem; color: var(--muted2); }

  /* Pie chart tooltip override */
  .recharts-tooltip-wrapper .recharts-default-tooltip { background: var(--surface2) !important; border: 1px solid var(--border) !important; border-radius: .875rem !important; font-family: 'DM Mono', monospace !important; font-size: 13px !important; }
`;

const PIE_COLORS = ['#3b9eff','#1a7ee0','#0a5fb5','#34d399','#059669','#f59e0b','#8b5cf6','#ec4899'];
const TICKER_ITEMS = ['AAPL +1.2%','MSFT +0.8%','NVDA +3.4%','GOOGL -0.3%','AMZN +1.7%','META +2.1%','TSLA -1.4%'];

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

function inferHoldingCurrency(sym) {
  if (!sym || typeof sym !== 'string') return 'USD';
  const s = sym.toUpperCase();
  if (s.endsWith('.NS') || s.endsWith('.BO') || s.endsWith('.NSE')) return 'INR';
  return 'USD';
}

function formatMoney(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  const loc = currency === 'INR' ? 'en-IN' : 'en-US';
  try { return new Intl.NumberFormat(loc, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
}

function convertFiat(value, from, to, rate) {
  const v = Number(value);
  if (!Number.isFinite(v) || !rate) return v;
  if (from === to) return v;
  if (from === 'USD' && to === 'INR') return v * rate;
  if (from === 'INR' && to === 'USD') return v / rate;
  return v;
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.07) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="700">{`${(percent * 100).toFixed(0)}%`}</text>;
}

export default function Portfolio() {
  useEffect(() => { injectStyles('pf-styles', CSS); }, []);

  const [portfolio,   setPortfolio]   = useState(null);
  const [holdings,    setHoldings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [watchlist,   setWatchlist]   = useState([]);
  const [watchLoading,setWatchLoading]= useState(true);

  const [symbol,       setSymbol]       = useState('');
  const [assetName,    setAssetName]    = useState('');
  const [quantity,     setQuantity]     = useState('');
  const [purchasePrice,setPurchasePrice]= useState('');
  const [avgManual,    setAvgManual]    = useState(false);
  const [adding,       setAdding]       = useState(false);

  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchResults,setSearchResults]= useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [livePrice,    setLivePrice]    = useState(null);

  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [usdInr,           setUsdInr]          = useState(83);
  const [watchlistSel,     setWatchlistSel]     = useState('');

  const [editForm,   setEditForm]   = useState(null);
  const [savingId,   setSavingId]   = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const refreshHoldings = async () => {
    if (!portfolio?.id) return;
    try { const r = await getHoldings(portfolio.id); setHoldings(r.data?.data || r.data || []); }
    catch (e) { toast.error('Failed to refresh'); }
  };

  useEffect(() => { initPortfolio(); }, []);
  useEffect(() => { getWatchlist().then(r => setWatchlist(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setWatchLoading(false)); }, []);
  useEffect(() => { fetch('https://api.frankfurter.app/latest?from=USD&to=INR').then(r => r.json()).then(d => { if (d?.rates?.INR) setUsdInr(Number(d.rates.INR)); }).catch(() => {}); }, []);

  useEffect(() => {
    const q = parseFloat(quantity), t = parseFloat(purchasePrice);
    if (livePrice != null && !avgManual && !(Number.isFinite(t) && t > 0)) setPurchasePrice(Number(livePrice).toFixed(2));
  }, [livePrice, avgManual, quantity]);

  const initPortfolio = async () => {
    try {
      const res = await getPortfolios();
      const list = res.data?.data || res.data || [];
      const p = list[0];
      if (p) { setPortfolio(p); const h = await getHoldings(p.id); setHoldings(h.data?.data || h.data || []); }
    } catch { toast.error('Failed to load portfolio'); }
    finally { setLoading(false); }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q); setSymbol(q.toUpperCase()); setWatchlistSel('');
    if (q.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    try { const r = await searchSymbol(q); setSearchResults((r.data.result || []).slice(0, 8)); setShowDropdown(true); }
    catch { setSearchResults([]); setShowDropdown(false); }
  };

  const applySymbol = async (sym, nameHint, optPrice) => {
    const up = sym.toUpperCase();
    setSymbol(up); setAssetName(nameHint || up); setSearchQuery(up);
    setShowDropdown(false); setSearchResults([]); setAvgManual(false);
    if (optPrice != null && Number(optPrice) > 0) setLivePrice(Number(optPrice));
    try { const r = await getQuote(up); const p = r.data?.c; if (p && Number.isFinite(Number(p))) setLivePrice(Number(p)); }
    catch {}
  };

  const handleWatchlistSelect = async (e) => {
    const sym = e.target.value; setWatchlistSel(sym);
    if (!sym) { resetForm(); return; }
    const row = watchlist.find(w => w.symbol === sym);
    await applySymbol(sym, row?.symbol || sym, row?.current);
  };

  const handleAddStock = async () => {
    if (!symbol || !quantity || !purchasePrice) { toast.error('Symbol, Quantity & Price are required'); return; }
    setAdding(true);
    try {
      let curr = parseFloat(purchasePrice);
      try { const r = await getQuote(symbol.toUpperCase()); const p = r.data?.c; if (p && Number(p) > 0.01) curr = Number(p); } catch {}
      await addHolding(portfolio.id, { symbol: symbol.toUpperCase(), asset_name: assetName || symbol.toUpperCase(), quantity: parseFloat(quantity), purchase_price: parseFloat(purchasePrice), current_price: curr });
      toast.success('Stock added!');
      await refreshHoldings(); resetForm();
    } catch { toast.error('Failed to add stock.'); }
    finally { setAdding(false); }
  };

  const handleSaveEdit = async () => {
    if (!editForm || !portfolio) return;
    const qty = parseFloat(editForm.quantity), buy = parseFloat(editForm.purchase_price);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(buy) || buy <= 0) { toast.error('Enter valid qty & price'); return; }
    setSavingId(editForm.id);
    try {
      let curr = parseFloat(editForm.current_price); if (!Number.isFinite(curr) || curr <= 0) curr = buy;
      try { const r = await getQuote(editForm.symbol); const p = r.data?.c; if (p && Number(p) > 0.01) curr = Number(p); } catch {}
      await updateHolding(portfolio.id, editForm.id, { asset_name: editForm.asset_name || undefined, quantity: qty, purchase_price: buy, current_price: curr });
      toast.success('Updated'); setEditForm(null); await refreshHoldings();
    } catch { toast.error('Could not update'); }
    finally { setSavingId(null); }
  };

  const handleDelete = async (h) => {
    if (!portfolio || !window.confirm(`Remove ${h.symbol}?`)) return;
    setDeletingId(h.id);
    try { await deleteHolding(portfolio.id, h.id); toast.success('Removed'); if (editForm?.id === h.id) setEditForm(null); await refreshHoldings(); }
    catch { toast.error('Could not delete'); }
    finally { setDeletingId(null); }
  };

  const resetForm = () => { setSymbol(''); setAssetName(''); setQuantity(''); setPurchasePrice(''); setAvgManual(false); setLivePrice(null); setSearchQuery(''); setSearchResults([]); setShowDropdown(false); setWatchlistSel(''); };

  const holdingValueNative = h => Number(h.quantity) * (Number(h.current_price) || Number(h.purchase_price) || 0);

  const totalValue = holdings.reduce((sum, h) => {
    const nat = inferHoldingCurrency(h.symbol);
    return sum + convertFiat(holdingValueNative(h), nat, displayCurrency, usdInr);
  }, 0);

  const chartData = holdings.map(h => {
    const nat = inferHoldingCurrency(h.symbol);
    return { name: h.symbol, value: convertFiat(holdingValueNative(h), nat, displayCurrency, usdInr), asset_name: h.asset_name || h.symbol };
  }).sort((a, b) => b.value - a.value);

  const formCurrencyLabel = inferHoldingCurrency(symbol) === 'INR' ? '₹' : '$';
  const qtyNum = parseFloat(quantity) || 0;
  const ppNum  = parseFloat(purchasePrice);
  const estMarket = livePrice && qtyNum > 0 ? qtyNum * livePrice : null;
  const estAvg    = Number.isFinite(ppNum) && qtyNum > 0 ? qtyNum * ppNum : null;

  if (loading) return <div className="pf-skel" style={{ height: 400, margin: '1.25rem' }} />;

  const tickerItems = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="pf-root">
      {/* Ticker */}
      <div className="pf-ticker-wrap">
        <div className="pf-ticker-inner">
          {tickerItems.map((t, i) => (
            <span key={i} className={`pf-ticker-item ${t.includes('-') ? 'dn' : 'up'}`}>
              {t} <span style={{ color: 'var(--border)', marginLeft: '1rem' }}>|</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.25rem' }}>
        {/* Hero */}
        <div className="pf-hero">
          <div className="pf-hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="pf-eyebrow"><span className="pf-live" /> Portfolio Tracker</div>
            <h1 className="pf-title">My<br /><em>Portfolio</em></h1>
            <p className="pf-subtitle">Track your stocks with live market prices &amp; currency conversion.</p>
          </div>
        </div>

        {/* Add stock card */}
        <div className="pf-card pf-fade">
          <div className="pf-card-hdr">
            <Plus size={16} color="var(--blue)" />
            <span className="pf-card-title">Add <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Stock</em></span>
          </div>
          <div className="pf-card-body">
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '.72rem', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '.5rem' }}>
                From Watchlist
              </label>
              <select className="pf-select" value={watchlistSel} onChange={handleWatchlistSelect} disabled={watchLoading} style={{ maxWidth: 380 }}>
                <option value="">{watchLoading ? 'Loading…' : 'Select a stock (AAPL, MSFT…)'}</option>
                {watchlist.map(w => (
                  <option key={w.symbol} value={w.symbol}>{w.symbol}{w.current != null ? ` — $${Number(w.current).toFixed(2)}` : ''}</option>
                ))}
              </select>
            </div>

            <div className="pf-form-grid">
              {/* Symbol search */}
              <div style={{ position: 'relative' }}>
                <div className="pf-input-wrap">
                  <Search size={15} color="var(--blue)" className="pf-input-icon" />
                  <input className="pf-input" placeholder="Symbol (AAPL, RELIANCE)" value={searchQuery}
                    onChange={e => handleSearch(e.target.value)} />
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <div className="pf-dropdown">
                    {searchResults.map((s, i) => (
                      <button key={i} className="pf-dropdown-item" onMouseDown={e => e.preventDefault()}
                        onClick={() => applySymbol(s.symbol, s.description, null)}>
                        <span className="pf-dropdown-sym">{s.symbol}</span>
                        <span style={{ fontSize: '.78rem', color: 'var(--muted2)' }}>{s.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input className="pf-input" placeholder="Company Name (optional)" value={assetName} onChange={e => setAssetName(e.target.value)} />
              <input type="number" className="pf-input" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} />
              <input type="number" step="0.01" className="pf-input" placeholder="Avg Buy Price" value={purchasePrice}
                onChange={e => { setPurchasePrice(e.target.value); setAvgManual(true); }} />
              <button className="pf-btn-primary" onClick={handleAddStock} disabled={adding || !symbol || !quantity || !purchasePrice} style={{ height: 42 }}>
                <Plus size={16} /> {adding ? 'Adding…' : 'Add Stock'}
              </button>
            </div>

            {(livePrice !== null || estAvg != null) && (
              <div className="pf-live-preview">
                {livePrice !== null && (
                  <div><div className="pf-preview-chip-lbl">Live Price</div><div className="pf-preview-chip-val" style={{ color: 'var(--blue)' }}>{formCurrencyLabel}{livePrice.toFixed(2)}</div></div>
                )}
                {qtyNum > 0 && estMarket && (
                  <div><div className="pf-preview-chip-lbl">Market Value</div><div className="pf-preview-chip-val" style={{ color: 'var(--green)' }}>{formCurrencyLabel}{estMarket.toFixed(2)}</div></div>
                )}
                {qtyNum > 0 && estAvg && (
                  <div><div className="pf-preview-chip-lbl">Avg Buy Value</div><div className="pf-preview-chip-val" style={{ color: 'var(--blue)' }}>{formCurrencyLabel}{estAvg.toFixed(2)}</div></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Total value */}
        {holdings.length > 0 && (
          <div className="pf-total-bar pf-fade">
            <div>
              <div className="pf-total-lbl">Total Portfolio Value</div>
              <div className="pf-total-val">{formatMoney(totalValue, displayCurrency)}</div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {['INR', 'USD'].map(c => (
                <button key={c} className={`pf-cur-btn ${displayCurrency === c ? 'active' : ''}`} onClick={() => setDisplayCurrency(c)}>{c}</button>
              ))}
            </div>
          </div>
        )}

        {/* Holdings */}
        {holdings.length === 0 ? (
          <div className="pf-card"><div className="pf-empty">No stocks yet — add your first holding above.</div></div>
        ) : (
          <div className="pf-card pf-fade">
            <div className="pf-card-hdr">
              <BarChart3 size={16} color="var(--blue)" />
              <span className="pf-card-title">Holdings &amp; <em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>Allocation</em></span>
            </div>
            <div className="pf-card-body">
              <div className="pf-holdings-grid">
                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="pf-table">
                    <thead>
                      <tr>
                        <th>Symbol</th><th>Company</th><th>Qty</th>
                        <th>Buy</th><th>Current</th><th>Value ({displayCurrency})</th>
                        <th>P&amp;L %</th><th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map(h => {
                        const nat       = inferHoldingCurrency(h.symbol);
                        const curr      = Number(h.current_price) || Number(h.purchase_price) || 0;
                        const buy       = Number(h.purchase_price) || 0;
                        const valDisp   = convertFiat(Number(h.quantity) * curr, nat, displayCurrency, usdInr);
                        const buyDisp   = convertFiat(buy,  nat, displayCurrency, usdInr);
                        const currDisp  = convertFiat(curr, nat, displayCurrency, usdInr);
                        const pnl       = buy > 0 ? ((curr - buy) / buy) * 100 : 0;
                        const isEdit    = editForm?.id === h.id;
                        const busy      = savingId === h.id || deletingId === h.id;

                        return (
                          <tr key={h.id} className={isEdit ? 'editing' : ''}>
                            <td><span className="pf-sym-cell">{h.symbol}</span></td>
                            {isEdit ? (
                              <>
                                <td><input className="pf-table-input" value={editForm.asset_name} onChange={e => setEditForm({ ...editForm, asset_name: e.target.value })} /></td>
                                <td><input type="number" className="pf-table-input" value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: e.target.value })} /></td>
                                <td><input type="number" step="0.01" className="pf-table-input" value={editForm.purchase_price} onChange={e => setEditForm({ ...editForm, purchase_price: e.target.value })} /></td>
                                <td><input type="number" step="0.01" className="pf-table-input" value={editForm.current_price} onChange={e => setEditForm({ ...editForm, current_price: e.target.value })} /></td>
                                <td>—</td><td>—</td>
                              </>
                            ) : (
                              <>
                                <td style={{ color: 'var(--muted2)', fontSize: '.8rem' }}>{h.asset_name}</td>
                                <td style={{ fontFamily: "'DM Mono', monospace", fontSize: '.8rem' }}>{h.quantity}</td>
                                <td style={{ fontFamily: "'DM Mono', monospace", fontSize: '.8rem' }}>{formatMoney(buyDisp,  displayCurrency)}</td>
                                <td style={{ fontFamily: "'DM Mono', monospace", fontSize: '.8rem' }}>{formatMoney(currDisp, displayCurrency)}</td>
                                <td style={{ fontFamily: "'DM Mono', monospace", fontSize: '.8rem' }}>{formatMoney(valDisp,  displayCurrency)}</td>
                                <td className={pnl >= 0 ? 'pf-pnl-pos' : 'pf-pnl-neg'}>{pnl.toFixed(1)}%</td>
                              </>
                            )}
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '.35rem', justifyContent: 'flex-end' }}>
                                {isEdit ? (
                                  <>
                                    <button className="pf-btn-ghost success" onClick={handleSaveEdit} disabled={busy}><Check size={14} /></button>
                                    <button className="pf-btn-ghost" onClick={() => setEditForm(null)} disabled={busy}><X size={14} /></button>
                                  </>
                                ) : (
                                  <>
                                    {/* <button className="pf-btn-ghost" onClick={() => setEditForm({ id: h.id, symbol: h.symbol, asset_name: h.asset_name ?? '', quantity: String(h.quantity), purchase_price: String(h.purchase_price), current_price: String(h.current_price ?? h.purchase_price ?? '') })} disabled={busy || (editForm != null && editForm.id !== h.id)}><Pencil size={14} /></button> */}
                                    <button className="pf-btn-ghost danger" onClick={() => handleDelete(h)} disabled={busy || (editForm != null && editForm.id !== h.id)}><Trash2 size={14} /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pie chart */}
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '1rem', marginLeft: '1rem' }}>
                    Portfolio Allocation
                  </div>
                  <ResponsiveContainer width="80%" height={380}>
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="45%" innerRadius={80} outerRadius={130} paddingAngle={3} cornerRadius={5} dataKey="value" label={renderPieLabel} labelLine={false}>
                        {chartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => formatMoney(v, displayCurrency)} contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '.875rem', fontFamily: "'DM Mono', monospace", fontSize: 13 }} />
                      <Legend verticalAlign="bottom" height={90} iconType="circle"
                        formatter={(val, entry) => {
                          const pct = totalValue > 0 ? ((entry.payload.value / totalValue) * 100).toFixed(1) : '0';
                          return <span style={{ fontSize: 13, fontFamily: "'Instrument Sans', sans-serif" }}><strong>{val}</strong> — {pct}%</span>;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}