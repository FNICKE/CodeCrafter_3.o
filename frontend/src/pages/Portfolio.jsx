import { useEffect, useState } from 'react';
import {
  getPortfolios,
  getHoldings,
  addHolding,
  updateHolding,
  deleteHolding,
  getQuote,
  searchSymbol,
  getWatchlist,
} from '../api';
import { Plus, Search, Pencil, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#00425A', '#2D9596', '#E88D5D', '#C5A059', '#06b6d4', '#3f8ef5', '#8B5CF6', '#EC4899'];

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);
  const [watchLoading, setWatchLoading] = useState(true);

  // Form State
  const [symbol, setSymbol] = useState('');
  const [assetName, setAssetName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [totalPaid, setTotalPaid] = useState('');
  const [avgManual, setAvgManual] = useState(false);
  const [adding, setAdding] = useState(false);

  // Search + Live Quote
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [livePrice, setLivePrice] = useState(null);

  // Display currency
  const [displayCurrency, setDisplayCurrency] = useState('INR');
  const [usdInr, setUsdInr] = useState(83);
  const [watchlistSelection, setWatchlistSelection] = useState('');

  /** Inline edit: { id, symbol, asset_name, quantity, purchase_price, current_price } */
  const [editForm, setEditForm] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const refreshHoldings = async () => {
    if (!portfolio?.id) return;
    try {
      const res = await getHoldings(portfolio.id);
      setHoldings(res.data?.data || res.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to refresh holdings');
    }
  };

  useEffect(() => {
    initPortfolio();
  }, []);

  useEffect(() => {
    getWatchlist()
      .then((r) => setWatchlist(Array.isArray(r.data) ? r.data : []))
      .catch(() => setWatchlist([]))
      .finally(() => setWatchLoading(false));
  }, []);

  // Fetch USD → INR rate
  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=USD&to=INR')
      .then((res) => res.json())
      .then((d) => {
        if (d?.rates?.INR) setUsdInr(Number(d.rates.INR));
      })
      .catch(() => {});
  }, []);

  // Auto-fill purchase price
  useEffect(() => {
    const q = parseFloat(quantity);
    const t = parseFloat(totalPaid);
    if (Number.isFinite(t) && t > 0 && Number.isFinite(q) && q > 0) return;
    if (livePrice != null && !avgManual) {
      setPurchasePrice(Number(livePrice).toFixed(2));
    }
  }, [livePrice, avgManual, quantity, totalPaid]);

  useEffect(() => {
    const q = parseFloat(quantity);
    const t = parseFloat(totalPaid);
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(t) || t <= 0) return;
    setPurchasePrice((t / q).toFixed(2));
    setAvgManual(false);
  }, [quantity, totalPaid]);

  const initPortfolio = async () => {
    try {
      const res = await getPortfolios();
      const portfolios = res.data?.data || res.data || [];
      const defaultPortfolio = portfolios[0];
      if (defaultPortfolio) {
        setPortfolio(defaultPortfolio);
        const holdingsRes = await getHoldings(defaultPortfolio.id);
        setHoldings(holdingsRes.data?.data || holdingsRes.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    setSymbol(q.toUpperCase());
    setWatchlistSelection('');
    if (q.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await searchSymbol(q);
      const results = res.data.result || [];
      setSearchResults(results.slice(0, 8));
      setShowDropdown(true);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const applySymbolAndQuote = async (selectedSymbol, nameHint, optionalPrice) => {
    const upper = selectedSymbol.toUpperCase();
    setSymbol(upper);
    setAssetName(nameHint || upper);
    setSearchQuery(upper);
    setShowDropdown(false);
    setSearchResults([]);
    setAvgManual(false);
    setTotalPaid('');
    if (optionalPrice != null && Number(optionalPrice) > 0) {
      setLivePrice(Number(optionalPrice));
    }
    try {
      const quoteRes = await getQuote(upper);
      const price = quoteRes.data?.c;
      if (price != null && Number.isFinite(Number(price))) {
        setLivePrice(Number(price));
      }
    } catch (err) {
      console.error('Failed to fetch live price:', err);
    }
  };

  const handleWatchlistSelect = async (e) => {
    const sym = e.target.value;
    setWatchlistSelection(sym);
    if (!sym) {
      resetForm();
      return;
    }
    const row = watchlist.find((w) => w.symbol === sym);
    await applySymbolAndQuote(sym, row?.symbol || sym, row?.current);
  };

  const handleSelectStock = async (stock) => {
    setWatchlistSelection('');
    await applySymbolAndQuote(stock.symbol, stock.description || stock.symbol, null);
  };

  const handleAddStock = async () => {
    if (!symbol || !quantity || !purchasePrice) {
      toast.error('Symbol, Quantity and Purchase Price are required');
      return;
    }
    setAdding(true);
    try {
      let currentPriceToSave = parseFloat(purchasePrice);
      try {
        const quoteRes = await getQuote(symbol.trim().toUpperCase());
        const apiPrice = quoteRes.data?.c;
        if (apiPrice != null && Number(apiPrice) > 0.01) {
          currentPriceToSave = Number(apiPrice);
        }
      } catch (quoteErr) {
        console.warn(`Quote API failed for ${symbol}. Using purchase price.`, quoteErr);
      }

      await addHolding(portfolio.id, {
        symbol: symbol.trim().toUpperCase(),
        asset_name: assetName.trim() || symbol.trim().toUpperCase(),
        quantity: parseFloat(quantity),
        purchase_price: parseFloat(purchasePrice),
        current_price: currentPriceToSave,
      });

      toast.success('Stock added successfully!');
      await refreshHoldings();
      resetForm();
    } catch (err) {
      toast.error('Failed to add stock. Please check the symbol.');
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (h) => {
    setEditForm({
      id: h.id,
      symbol: h.symbol,
      asset_name: h.asset_name ?? '',
      quantity: String(h.quantity),
      purchase_price: String(h.purchase_price),
      current_price: String(h.current_price ?? h.purchase_price ?? ''),
    });
  };

  const cancelEdit = () => setEditForm(null);

  const handleSaveEdit = async () => {
    if (!editForm || !portfolio) return;
    const qty = parseFloat(editForm.quantity);
    const buy = parseFloat(editForm.purchase_price);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(buy) || buy <= 0) {
      toast.error('Enter valid quantity and buy price');
      return;
    }
    setSavingId(editForm.id);
    try {
      let curr = parseFloat(editForm.current_price);
      if (!Number.isFinite(curr) || curr <= 0) curr = buy;
      try {
        const quoteRes = await getQuote(editForm.symbol);
        const apiPrice = quoteRes.data?.c;
        if (apiPrice != null && Number(apiPrice) > 0.01) curr = Number(apiPrice);
      } catch (_) {
        /* keep manual / buy */
      }

      await updateHolding(portfolio.id, editForm.id, {
        asset_name: editForm.asset_name.trim() || undefined,
        quantity: qty,
        purchase_price: buy,
        current_price: curr,
      });
      toast.success('Holding updated');
      setEditForm(null);
      await refreshHoldings();
    } catch (err) {
      console.error(err);
      toast.error('Could not update holding');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteHolding = async (h) => {
    if (!portfolio) return;
    if (!window.confirm(`Remove ${h.symbol} from this portfolio?`)) return;
    setDeletingId(h.id);
    try {
      await deleteHolding(portfolio.id, h.id);
      toast.success('Holding removed');
      if (editForm?.id === h.id) setEditForm(null);
      await refreshHoldings();
    } catch (err) {
      console.error(err);
      toast.error('Could not delete holding');
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setSymbol('');
    setAssetName('');
    setQuantity('');
    setPurchasePrice('');
    setTotalPaid('');
    setAvgManual(false);
    setLivePrice(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setWatchlistSelection('');
  };

  const formCurrency = inferHoldingCurrency(symbol || searchQuery);
  const formCurrencyLabel = formCurrency === 'INR' ? '₹' : '$';
  const qtyNum = parseFloat(quantity) || 0;
  const ppNum = parseFloat(purchasePrice);
  const estimatedAtMarket = livePrice != null && qtyNum > 0 ? qtyNum * livePrice : null;
  const estimatedAtAvg = Number.isFinite(ppNum) && qtyNum > 0 ? qtyNum * ppNum : null;

  const holdingValueNative = (h) =>
    Number(h.quantity) * (Number(h.current_price) || Number(h.purchase_price) || 0);

  const totalValueDisplay = holdings.reduce((sum, h) => {
    const native = inferHoldingCurrency(h.symbol);
    const v = holdingValueNative(h);
    return sum + convertFiat(v, native, displayCurrency, usdInr);
  }, 0);

  // Chart Data - Based purely on current value (no P&L)
  const chartData = holdings
    .map((h) => {
      const native = inferHoldingCurrency(h.symbol);
      const value = holdingValueNative(h);
      return {
        name: h.symbol,
        value: convertFiat(value, native, displayCurrency, usdInr),
        asset_name: h.asset_name || h.symbol,
      };
    })
    .sort((a, b) => b.value - a.value);   // Largest first

  // Show percentage inside pie slices (only for bigger slices)
  const renderPercentageLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.07) return null; // Don't show on very small slices

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="12"
        fontWeight="700"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) return <div className="skeleton" style={{ height: 400 }} />;

  return (
    <div className="animate-in portfolio-page">
      <div className="page-header">
        <h1 className="page-title">My Portfolio</h1>
        <p className="page-subtitle">Track your stocks with live market prices</p>
      </div>

      <div className="card card-elevated" style={{ marginBottom: 32 }}>
        <h3>Add New Stock</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8, marginBottom: 16 }}>
          Choose from watchlist or search. Live price auto-fills average buy when you pick a symbol.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
            From Market Watchlist
          </label>
          <select
            className="input"
            value={watchlistSelection}
            onChange={handleWatchlistSelect}
            disabled={watchLoading}
            style={{ maxWidth: 420 }}
          >
            <option value="">{watchLoading ? 'Loading stocks…' : 'Select a stock (AAPL, MSFT, …)'}</option>
            {watchlist.map((w) => (
              <option key={w.symbol} value={w.symbol}>
                {w.symbol} {w.current != null ? `— $${Number(w.current).toFixed(2)}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-blue)' }} />
              <input
                className="input"
                placeholder="Symbol (AAPL, RELIANCE)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ paddingLeft: 46 }}
              />
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                marginTop: 6,
                zIndex: 100,
                maxHeight: 280,
                overflow: 'auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
              }}>
                {searchResults.map((stock, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectStock(stock)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: index < searchResults.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    className="hover:bg-[var(--bg-card-hover)]"
                  >
                    <strong>{stock.symbol}</strong>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stock.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <input className="input" placeholder="Company Name (optional)" value={assetName} onChange={(e) => setAssetName(e.target.value)} />
          <input type="number" className="input" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <input type="number" step="0.01" className="input" placeholder="Avg Buy Price" value={purchasePrice} onChange={(e) => { setPurchasePrice(e.target.value); setAvgManual(true); }} />
          <input
            type="number"
            step="0.01"
            className="input"
            placeholder="Total Paid (optional)"
            value={totalPaid}
            onChange={(e) => setTotalPaid(e.target.value)}
            aria-hidden={true}
            tabIndex={-1}
            style={{ display: 'none' }}
          />
          
          <button className="btn btn-primary" onClick={handleAddStock} disabled={adding || !symbol || !quantity || !purchasePrice} style={{ height: 44 }}>
            <Plus size={18} /> {adding ? 'Adding...' : 'Add'}
          </button>
        </div>

        {(livePrice !== null || estimatedAtAvg != null) && (
          <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
            {livePrice !== null && (
              <div>Current price ({formCurrency}): <strong style={{ color: 'var(--accent-green)' }}>{formCurrencyLabel}{livePrice.toFixed(2)}</strong></div>
            )}
            {qtyNum > 0 && estimatedAtMarket && (
              <div>Market Value: <strong style={{ color: 'var(--accent-green)' }}>{formCurrencyLabel}{estimatedAtMarket.toFixed(2)}</strong></div>
            )}
            {qtyNum > 0 && estimatedAtAvg && (
              <div>Avg Buy Value: <strong style={{ color: 'var(--accent-blue)' }}>{formCurrencyLabel}{estimatedAtAvg.toFixed(2)}</strong></div>
            )}
          </div>
        )}
      </div>

      {/* Total Value */}
      <div style={{ marginBottom: 20, fontSize: 20, fontWeight: 600 }}>
        Total value ({displayCurrency}):{' '}
        <span style={{ color: 'var(--accent-green)' }}>
          {formatMoney(totalValueDisplay, displayCurrency)}
        </span>
      </div>

      {holdings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: 'var(--text-muted)' }}>No stocks added yet.</p>
        </div>
      ) : (
        <div className="card card-elevated">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
            {/* Holdings Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="section-title">Your Holdings</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['INR', 'USD'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setDisplayCurrency(c)}
                      className={displayCurrency === c ? 'btn-currency btn-currency--active' : 'btn-currency'}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-sm)' }}>
                <table className="data-table data-table--holdings">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Company</th>
                      <th>Qty</th>
                      <th>Buy</th>
                      <th>Current</th>
                      <th>Value ({displayCurrency})</th>
                      <th>P&L %</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => {
                      const native = inferHoldingCurrency(h.symbol);
                      const curr = Number(h.current_price) || Number(h.purchase_price) || 0;
                      const buy = Number(h.purchase_price) || 0;
                      const valueNative = Number(h.quantity) * curr;
                      const valueDisp = convertFiat(valueNative, native, displayCurrency, usdInr);
                      const buyDisp = convertFiat(buy, native, displayCurrency, usdInr);
                      const currDisp = convertFiat(curr, native, displayCurrency, usdInr);
                      const pnlPercent = buy > 0 ? ((curr - buy) / buy) * 100 : 0;
                      const isRowEdit = editForm?.id === h.id;
                      const busy = savingId === h.id || deletingId === h.id;

                      return (
                        <tr key={h.id} className={isRowEdit ? 'data-table__row--edit' : ''}>
                          <td><strong>{h.symbol}</strong></td>
                          {isRowEdit ? (
                            <>
                              <td>
                                <input
                                  className="input input--table"
                                  value={editForm.asset_name}
                                  onChange={(e) => setEditForm({ ...editForm, asset_name: e.target.value })}
                                  placeholder="Company"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input input--table"
                                  value={editForm.quantity}
                                  min="0"
                                  step="any"
                                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input input--table"
                                  value={editForm.purchase_price}
                                  step="0.01"
                                  onChange={(e) => setEditForm({ ...editForm, purchase_price: e.target.value })}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input input--table"
                                  value={editForm.current_price}
                                  step="0.01"
                                  title="Current price (refreshed from market on save when available)"
                                  onChange={(e) => setEditForm({ ...editForm, current_price: e.target.value })}
                                />
                              </td>
                              <td colSpan={1}>—</td>
                              <td>—</td>
                            </>
                          ) : (
                            <>
                              <td>{h.asset_name}</td>
                              <td>{h.quantity}</td>
                              <td>{formatMoney(buyDisp, displayCurrency)}</td>
                              <td>{formatMoney(currDisp, displayCurrency)}</td>
                              <td>{formatMoney(valueDisp, displayCurrency)}</td>
                              <td style={{ color: pnlPercent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                {pnlPercent.toFixed(1)}%
                              </td>
                            </>
                          )}
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {isRowEdit ? (
                              <div className="holdings-actions">
                                <button
                                  type="button"
                                  className="btn-icon btn-icon--success"
                                  onClick={handleSaveEdit}
                                  disabled={busy}
                                  title="Save"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={cancelEdit}
                                  disabled={busy}
                                  title="Cancel"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="holdings-actions">
                                <button
                                  type="button"
                                  className="btn-icon btn-icon--primary"
                                  onClick={() => startEdit(h)}
                                  disabled={busy || (editForm != null && editForm.id !== h.id)}
                                  title="Edit"
                                  aria-hidden={true}
                                  tabIndex={-1}
                                  style={{ display: 'none' }}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon btn-icon--danger"
                                  onClick={() => handleDeleteHolding(h)}
                                  disabled={busy || (editForm != null && editForm.id !== h.id)}
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Clean Portfolio Allocation Chart - Based on Value Only */}
            <div>
              <h3>Portfolio Allocation</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: 16 }}>
                Percentage of total portfolio value by each holding
              </p>

              <ResponsiveContainer width="100%" height={450}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={88}
                    outerRadius={145}
                    paddingAngle={3}
                    cornerRadius={6}
                    dataKey="value"
                    label={renderPercentageLabel}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>

                  <Tooltip formatter={(value) => formatMoney(value, displayCurrency)} />

                  <Legend
                    verticalAlign="bottom"
                    height={100}
                    iconType="circle"
                    formatter={(value, entry) => {
                      const percent = totalValueDisplay > 0 
                        ? ((entry.payload.value / totalValueDisplay) * 100).toFixed(1)
                        : '0';
                      return (
                        <span style={{ fontSize: '13.5px' }}>
                          <strong>{value}</strong> — {percent}%
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Keep these helper functions at the bottom
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
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function convertFiat(value, nativeCurrency, targetCurrency, usdInr) {
  const v = Number(value);
  if (!Number.isFinite(v) || !usdInr || usdInr <= 0) return v;
  if (nativeCurrency === targetCurrency) return v;
  if (nativeCurrency === 'USD' && targetCurrency === 'INR') return v * usdInr;
  if (nativeCurrency === 'INR' && targetCurrency === 'USD') return v / usdInr;
  return v;
}