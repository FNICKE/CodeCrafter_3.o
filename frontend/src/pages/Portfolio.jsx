import { useEffect, useState } from 'react';
import { getPortfolios, getHoldings, addHolding, getQuote } from '../api';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3f8ef5', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);   // single portfolio
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [symbol, setSymbol] = useState('');
  const [assetName, setAssetName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    initPortfolio();
  }, []);

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

  const handleAddStock = async () => {
    if (!symbol || !quantity || !purchasePrice) {
      toast.error('Symbol, Quantity and Purchase Price are required');
      return;
    }

    setAdding(true);
    try {
      const quoteRes = await getQuote(symbol.trim().toUpperCase());
      const currentPrice = quoteRes.data?.c || parseFloat(purchasePrice);

      await addHolding(portfolio.id, {
        symbol: symbol.trim().toUpperCase(),
        asset_name: assetName.trim() || symbol.trim().toUpperCase(),
        quantity: parseFloat(quantity),
        purchase_price: parseFloat(purchasePrice),
        current_price: currentPrice,
      });

      toast.success('Stock added successfully!');

      // Refresh holdings
      const res = await getHoldings(portfolio.id);
      setHoldings(res.data?.data || res.data || []);

      // Clear form
      setSymbol('');
      setAssetName('');
      setQuantity('');
      setPurchasePrice('');

    } catch (err) {
      toast.error('Failed to add stock. Please check the symbol.');
    } finally {
      setAdding(false);
    }
  };

  const totalValue = holdings.reduce((sum, h) => {
    return sum + Number(h.quantity) * (Number(h.current_price) || Number(h.purchase_price) || 0);
  }, 0);

  if (loading) return <div className="skeleton" style={{ height: 400 }} />;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">My Portfolio</h1>
        <p className="page-subtitle">Track your stocks with live market prices</p>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <h3>Add New Stock</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 0.8fr 0.9fr auto', gap: 12, marginTop: 16 }}>
          <input
            className="input"
            placeholder="Symbol (AAPL, RELIANCE)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
          <input
            className="input"
            placeholder="Company Name (optional)"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
          />
          <input
            type="number"
            className="input"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <input
            type="number"
            step="0.01"
            className="input"
            placeholder="Avg Buy Price ₹"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
          <button 
            className="btn btn-primary"
            onClick={handleAddStock}
            disabled={adding || !symbol || !quantity || !purchasePrice}
          >
            <Plus size={18} /> {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20, fontSize: 20, fontWeight: 600 }}>
        Total Value: <span style={{ color: 'var(--accent-green)' }}>₹{totalValue.toLocaleString('en-IN')}</span>
      </div>

      {holdings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: 'var(--text-muted)' }}>No stocks added yet. Add your first stock above.</p>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
            <div>
              <h3>Your Holdings</h3>
              <table className="data-table" style={{ marginTop: 16 }}>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company</th>
                    <th>Qty</th>
                    <th>Buy Price</th>
                    <th>Current</th>
                    <th>Value</th>
                    <th>P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const curr = Number(h.current_price) || Number(h.purchase_price) || 0;
                    const value = Number(h.quantity) * curr;
                    const pnlPercent = Number(h.purchase_price) > 0 
                      ? ((curr - Number(h.purchase_price)) / Number(h.purchase_price)) * 100 
                      : 0;

                    return (
                      <tr key={h.id}>
                        <td><strong>{h.symbol}</strong></td>
                        <td>{h.asset_name}</td>
                        <td>{h.quantity}</td>
                        <td>₹{Number(h.purchase_price).toFixed(2)}</td>
                        <td>₹{curr.toFixed(2)}</td>
                        <td>₹{value.toLocaleString('en-IN')}</td>
                        <td style={{ color: pnlPercent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          {pnlPercent.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <h3>Allocation</h3>
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={holdings.map(h => ({
                      name: h.symbol,
                      value: Number(h.quantity) * (Number(h.current_price) || Number(h.purchase_price) || 0)
                    }))}
                    cx="50%" 
                    cy="50%"
                    innerRadius={85}
                    outerRadius={135}
                    dataKey="value"
                  >
                    {holdings.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}