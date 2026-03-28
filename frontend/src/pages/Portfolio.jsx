import { useEffect, useState } from 'react';
import { getPortfolios, createPortfolio, getHoldings, deletePortfolio } from '../api';
import { Plus, Trash2, ChevronDown, ChevronRight, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3f8ef5', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function Portfolio() {
  const [portfolios, setPortfolios] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [holdings, setHoldings] = useState({});
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = () => {
    getPortfolios().then((r) => setPortfolios(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createPortfolio({ name: newName });
      toast.success('Portfolio created!');
      setNewName('');
      loadPortfolios();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating portfolio');
    } finally { setCreating(false); }
  };

  const handleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!holdings[id]) {
      try {
        const res = await getHoldings(id);
        setHoldings((prev) => ({ ...prev, [id]: res.data }));
      } catch { toast.error('Failed to load holdings'); }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this portfolio?')) return;
    try {
      await deletePortfolio(id);
      toast.success('Portfolio deleted');
      loadPortfolios();
      if (expanded === id) setExpanded(null);
    } catch { toast.error('Delete failed'); }
  };

  const riskColor = (score) => {
    if (score <= 3) return 'var(--accent-green)';
    if (score <= 6) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">💼 Portfolio Manager</h1>
        <p className="page-subtitle">Build and track your investment portfolios</p>
      </div>

      {/* Create Portfolio */}
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <input
          id="portfolio-name-input"
          className="input"
          placeholder="New portfolio name (e.g. Growth 2025)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <button id="portfolio-create-btn" type="submit" className="btn btn-primary" disabled={creating}>
          <Plus size={16} /> {creating ? 'Creating...' : 'Create'}
        </button>
      </form>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Briefcase size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 500 }}>No portfolios yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>Create your first portfolio above</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {portfolios.map((p) => (
            <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', cursor: 'pointer' }}
                onClick={() => handleExpand(p.id)}
              >
                <div style={{ display: 'flex', align: 'center', gap: 16 }}>
                  {expanded === p.id ? <ChevronDown size={18} style={{ color: 'var(--accent-blue)', marginTop:2 }} /> : <ChevronRight size={18} style={{ color: 'var(--text-muted)', marginTop:2 }} />}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {p.holding_count || 0} holdings · Risk:{' '}
                      <span style={{ color: riskColor(p.risk_score) }}>{p.risk_score}/10</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', align: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right', marginRight: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                      ${Number(p.total_value || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>total value</div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    title="Delete portfolio"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expanded === p.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '20px' }}>
                  {!holdings[p.id] ? (
                    <div className="skeleton" style={{ height: 100 }} />
                  ) : holdings[p.id].length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 13 }}>
                      No holdings added yet
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Ticker</th>
                              <th>Name</th>
                              <th>Alloc</th>
                              <th>Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {holdings[p.id].map((h) => (
                              <tr key={h.id}>
                                <td style={{ fontWeight: 700 }}>{h.ticker}</td>
                                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{h.asset_name}</td>
                                <td><span className="badge badge-blue">{h.allocation_percent}%</span></td>
                                <td>{h.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={holdings[p.id].map((h, i) => ({ name: h.ticker, value: Number(h.allocation_percent) }))} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                              {holdings[p.id].map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Allocation']} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
