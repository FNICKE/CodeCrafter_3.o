import { useState } from "react";
import { getStock } from "../api";

const Stock = () => {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStock = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    try {
      const res = await getStock(symbol);
      setData(res.data["Global Quote"]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">🔍 Quick Stock Lookup</h1>
        <p className="page-subtitle">Fetch fundamental info for any valid symbol</p>
      </div>

      <div className="card" style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input"
            placeholder="Enter stock (e.g. IBM...)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
          <button onClick={fetchStock} className="btn btn-primary" disabled={loading} style={{ padding: '0 20px' }}>
            {loading ? "..." : "Search"}
          </button>
        </div>

        {data && (
          <div className="animate-in" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <p className="label">Ticker</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>{data["01. symbol"]}</p>
            
            <p className="label">Latest Price</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>${Number(data["05. price"]).toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stock;
