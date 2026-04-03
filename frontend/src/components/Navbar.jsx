import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, LayoutDashboard, Search, TrendingUp, Cpu } from 'lucide-react';

const Navbar = ({ theme, toggleTheme }) => {
  const location = useLocation();

  return (
    <nav style={{
      background: 'var(--nav-bg)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 4rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      transition: 'all 0.3s ease'
    }}>
      {/* Brand */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          background: 'var(--accent-primary)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Cpu color="white" size={20} />
        </div>
        <div>
          <span style={{ 
            fontSize: '1.15rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px'
          }}>
            AV SCREENER
          </span>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
            Institutional Trading Terminal
          </div>
        </div>
      </Link>

      {/* Navigation Links */}
      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
        <NavLink to="/" active={location.pathname === '/'}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/analyse-stock" active={location.pathname === '/analyse-stock'}>
          <Search size={18} />
          Analysis
        </NavLink>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingRight: '2rem', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>NIFTY 50</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                   +0.85% <TrendingUp size={12} />
                </div>
            </div>
        </div>

        <button 
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            padding: '0.5rem',
            cursor: 'pointer',
            transition: 'color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="theme-btn"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <style>{`
        .theme-btn:hover {
          color: var(--text-primary) !important;
        }
      `}</style>
    </nav>
  );
};

const NavLink = ({ to, active, children }) => (
  <Link 
    to={to} 
    style={{ 
      textDecoration: 'none', 
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      fontSize: '0.95rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 0',
      borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
      transition: 'all 0.3s'
    }}
    onMouseEnter={(e) => { if(!active) e.target.style.color = 'var(--text-primary)'; }}
    onMouseLeave={(e) => { if(!active) e.target.style.color = 'var(--text-secondary)'; }}
  >
    {children}
  </Link>
);

export default Navbar;
