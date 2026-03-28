import { useEffect, useState } from 'react';
import { getAlerts, createAlert, deleteAlert, toggleAlert } from '../api';
import { Bell, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ALERT_TYPES = ['price_above', 'price_below', 'news', 'regulatory', 'risk_breach'];

export default function AlertsCenter() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ asset_id: '', alert_type: 'price_above', threshold_value: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    getAlerts().then((r) => setAlerts(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.asset_id) { toast.error('Enter an asset ID'); return; }
    setCreating(true);
    try {
      await createAlert(form);
      toast.success('Alert created!');
      setForm({ asset_id: '', alert_type: 'price_above', threshold_value: '' });
      loadAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create alert');
    } finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAlert(id);
      toast.success('Alert deleted');
      loadAlerts();
    } catch { toast.error('Delete failed'); }
  };

  const handleToggle = async (id) => {
    try {
      await toggleAlert(id);
      loadAlerts();
    } catch { toast.error('Toggle failed'); }
  };

  const alertTypeColor = (type) => {
    const map = { price_above: 'badge-green', price_below: 'badge-red', news: 'badge-blue', regulatory: 'badge-amber', risk_breach: 'badge-purple' };
    return map[type] || 'badge-blue';
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">🔔 Alerts Center</h1>
        <p className="page-subtitle">Get notified of price moves, news, and regulatory events</p>
      </div>

      {/* Create Alert */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} style={{ color: 'var(--accent-blue)' }} /> Create New Alert
        </div>
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 14, alignItems: 'end' }}>
          <div>
            <label className="label">Asset ID</label>
            <input
              id="alert-asset-id"
              className="input"
              placeholder="e.g. 1 (from assets table)"
              value={form.asset_id}
              onChange={(e) => setForm({ ...form, asset_id: e.target.value })}
              type="number"
            />
          </div>
          <div>
            <label className="label">Alert Type</label>
            <select id="alert-type" className="input" value={form.alert_type} onChange={(e) => setForm({ ...form, alert_type: e.target.value })}>
              {ALERT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Threshold Value</label>
            <input
              id="alert-threshold"
              className="input"
              placeholder="e.g. 150.00"
              value={form.threshold_value}
              onChange={(e) => setForm({ ...form, threshold_value: e.target.value })}
              type="number"
              step="0.01"
            />
          </div>
          <button id="alert-create-btn" type="submit" className="btn btn-primary" disabled={creating}>
            <Bell size={16} /> {creating ? '...' : 'Add Alert'}
          </button>
        </form>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 64 }} />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Bell size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-secondary)' }}>No alerts configured</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map((alert) => (
            <div key={alert.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: alert.is_active ? 'var(--accent-green)' : 'var(--text-muted)',
                }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {alert.ticker || `Asset #${alert.asset_id}`}
                    </span>
                    <span className={`badge ${alertTypeColor(alert.alert_type)}`}>{alert.alert_type.replace(/_/g, ' ')}</span>
                    {!alert.is_active && <span className="badge" style={{ background: 'rgba(100,100,100,0.15)', color: 'var(--text-muted)' }}>Paused</span>}
                  </div>
                  {alert.threshold_value > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Threshold: ${Number(alert.threshold_value).toFixed(2)}</div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => handleToggle(alert.id)} className="btn btn-ghost btn-sm" title="Toggle alert">
                  {alert.is_active ? <ToggleRight size={18} style={{ color: 'var(--accent-green)' }} /> : <ToggleLeft size={18} style={{ color: 'var(--text-muted)' }} />}
                </button>
                <button onClick={() => handleDelete(alert.id)} className="btn btn-danger btn-sm">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
