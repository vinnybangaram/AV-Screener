import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, LayoutDashboard, Search, TrendingUp, Cpu, User, Settings, LogOut, ChevronDown } from 'lucide-react';

const Navbar = ({ theme, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUserData(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    console.log("👋 [Auth] Logging out user...");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = "/login";
  };

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
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
        <NavLink to="/dashboard" active={location.pathname === '/dashboard'}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/analyse-stock" active={location.pathname === '/analyse-stock'}>
          <Search size={18} />
          Analysis
        </NavLink>
        <NavLink to="/multibagger" active={location.pathname === '/multibagger'}>
          <TrendingUp size={18} />
          Multibagger
        </NavLink>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingRight: '1.5rem', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>NIFTY 50</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                   +0.85% <TrendingUp size={12} />
                </div>
            </div>
        </div>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '12px',
              transition: 'background 0.2s'
            }}
            className="user-profile-btn"
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(124, 58, 237, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              overflow: 'hidden'
            }}>
              {userData?.picture ? (
                <img src={userData.picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={18} color="var(--accent-primary)" />
              )}
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {userData?.name || 'Trader'}
            </span>
            <ChevronDown size={14} color="var(--text-secondary)" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {showDropdown && (
            <>
              <div 
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999 }}
                onClick={() => setShowDropdown(false)}
              />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: '180px',
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                animation: 'slideInDown 0.2s ease-out'
              }}>
                <DropdownItem icon={<User size={16} />} label="Profile" />
                <DropdownItem icon={<Settings size={16} />} label="Settings" />
                <div style={{ height: '1px', background: '#1e293b', margin: '4px 0' }} />
                <DropdownItem 
                  icon={<LogOut size={16} />} 
                  label="Logout" 
                  onClick={handleLogout}
                  color="#ef4444"
                />
              </div>
            </>
          )}
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
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .user-profile-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .theme-btn:hover {
          color: var(--text-primary) !important;
        }
      `}</style>
    </nav>
  );
};

const DropdownItem = ({ icon, label, onClick, color = 'var(--text-primary)' }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '10px 12px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      color: color,
      transition: 'background 0.2s',
    }}
    className="dropdown-item"
  >
    {icon}
    {label}
  </div>
);

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

