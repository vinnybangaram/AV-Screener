import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// import { LayoutDashboard, TrendingUp, Zap } from 'lucide-react';
import { LayoutDashboard, TrendingUp, Zap, Activity, BarChart, X } from 'lucide-react';

const NAV_ITEMS = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/watchlist', icon: <BarChart size={20} />, label: 'Watchlist' },
    { to: '/multibagger', icon: <TrendingUp size={20} />, label: 'Multibagger' },
    { to: '/penny-storm', icon: <Zap size={20} />, label: 'Penny Storm' },
    { to: '/intraday', icon: <Activity size={20} />, label: 'Intraday', badge: 'LIVE' },
];

const ADMIN_NAV_ITEM = { to: '/admin', icon: <TrendingUp size={20} />, label: 'Admin Tools' };

const Sidebar = ({ onClose }) => {
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    const items = [...NAV_ITEMS];
    if (isAdmin) items.push(ADMIN_NAV_ITEM);

    return (
        <aside style={{
            width: '260px',
            minWidth: '220px',
            background: 'var(--nav-bg)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 1rem',
            gap: '0.375rem',
            minHeight: 'calc(100vh - 64px)',
            position: 'sticky',
            top: '64px',
            alignSelf: 'flex-start',
            zIndex: 10
        }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 0.5rem' }}>
                    Navigation
                </div>
                <button onClick={onClose} className="mobile-only" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            {items.map(({ to, icon, label }) => {
                const active = location.pathname === to;
                return (
                    <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                        <div className={`sidebar-item ${active ? 'active' : ''}`} style={{
                            display: 'flex', alignItems: 'center', gap: '0.875rem',
                            padding: '0.7rem 0.875rem', borderRadius: '10px', cursor: 'pointer',
                            fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s',
                            color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                            border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                        }}>
                            <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
                            {label}
                            {label === 'Penny Storm' && (
                                <span style={{
                                    marginLeft: 'auto', fontSize: '0.6rem', fontWeight: '900',
                                    background: '#eab308', color: '#000', padding: '2px 6px',
                                    borderRadius: '6px', letterSpacing: '0.5px'
                                }}>NEW</span>
                            )}
                        </div>
                    </Link>
                );
            })}

            <style>{`
        .sidebar-item:hover {
          background: rgba(255,255,255,0.04) !important;
          color: var(--text-primary) !important;
        }
        .sidebar-item.active:hover {
          background: rgba(99,102,241,0.12) !important;
          color: var(--accent-primary) !important;
        }
      `}</style>
        </aside>
    );
};

export default Sidebar;