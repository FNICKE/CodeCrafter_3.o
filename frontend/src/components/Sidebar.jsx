import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, TrendingUp, Briefcase, Newspaper,
  Bell, Search, LogOut, Activity, Bitcoin, Shield, Lightbulb, Target
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/recommendations', icon: Lightbulb, label: 'Smart Predictor' },
  { to: '/market', icon: TrendingUp, label: 'Market' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/research', icon: Newspaper, label: 'Research Hub' },
  { to: '/crypto', icon: Bitcoin, label: 'Crypto' },
  { to: '/screener', icon: Search, label: 'Screener' },
  { to: '/stock', icon: Target, label: 'Quick Lookup' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 240,
      background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gradient-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>HackTrix</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Smart Finance</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 8px 8px' }}>
          Navigation
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              transition: 'all 0.15s ease',
              background: isActive ? 'rgba(63, 142, 245, 0.12)' : 'transparent',
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderLeft: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
            })}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        {user && (
          <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--gradient-blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Shield size={10} /> {user.role}
                </div>
              </div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  );
}
