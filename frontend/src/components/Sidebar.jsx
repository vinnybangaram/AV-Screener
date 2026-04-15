import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// import { LayoutDashboard, TrendingUp, Zap } from 'lucide-react';
import { LayoutDashboard, TrendingUp, Zap, Activity, BarChart, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
    const [collapsed, setCollapsed] = React.useState(false);

    const items = [...NAV_ITEMS];
    if (isAdmin) items.push(ADMIN_NAV_ITEM);

    return (
        <aside style={{
            width: collapsed ? '80px' : '260px',
            minWidth: collapsed ? '80px' : '220px',
            background: 'var(--nav-bg)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            padding: collapsed ? '1.5rem 0.5rem' : '1.5rem 1rem',
            gap: '0.375rem',
            height: 'calc(100vh - 96px)',
            position: 'sticky',
            top: '96px',
            alignSelf: 'flex-start',
            overflowY: 'auto',
            overflowX: 'hidden',
            transition: 'all 0.3s ease',
            zIndex: 10
        }}>

            <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'space-between', alignItems: 'center', marginBottom: '1rem', padding: collapsed ? '0' : '0 0.5rem' }}>
                {!collapsed && (
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                        Navigation
                    </div>
                )}
                <button onClick={() => setCollapsed(!collapsed)} className="desktop-only" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
                <button onClick={onClose} className="mobile-only" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            {items.map(({ to, icon, label }) => {
                const active = location.pathname === to;
                return (
                    <Link key={to} to={to} style={{ textDecoration: 'none' }} title={collapsed ? label : ''}>
                        <div className={`sidebar-item ${active ? 'active' : ''}`} style={{
                            display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '0.875rem',
                            padding: collapsed ? '0.7rem' : '0.7rem 0.875rem', 
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            borderRadius: '10px', cursor: 'pointer',
                            fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s',
                            color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                            border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                        }}>
                            <span style={{ opacity: active ? 1 : 0.7, display: 'flex', alignItems: 'center' }}>{icon}</span>
                            
                            {!collapsed && (
                                <>
                                    {label}
                                    {label === 'Penny Storm' && (
                                        <span style={{
                                            marginLeft: 'auto', fontSize: '0.6rem', fontWeight: '900',
                                            background: '#eab308', color: '#000', padding: '2px 6px',
                                            borderRadius: '6px', letterSpacing: '0.5px'
                                        }}>NEW</span>
                                    )}
                                </>
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