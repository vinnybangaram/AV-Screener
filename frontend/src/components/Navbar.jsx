import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Cpu, User, Settings, LogOut, ChevronDown, Search, TrendingUp, X, Bell, MailOpen, Check, Menu } from 'lucide-react';
import { searchTickers, fetchNotifications, markNotificationRead } from '../services/api';

const Navbar = ({ theme, toggleTheme, onMenuClick }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [userData, setUserData] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUserData(u);
      loadNotifications(u.id);
    }
  }, []);

  const loadNotifications = async (userId) => {
    const res = await fetchNotifications(userId);
    if (Array.isArray(res)) setNotifications(res);
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(userData.id, id);
    loadNotifications(userData.id);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setResults([]);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await searchTickers(query);
      setResults(Array.isArray(res) ? res.slice(0, 6) : []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleSelect = (ticker) => {
    setQuery('');
    setResults([]);
    navigate(`/analyse-stock?symbol=${ticker}`);
  };

  return (
    <nav className="navbar" style={{
      background: 'var(--nav-bg)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 1.5rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      transition: 'all 0.3s ease'
    }}>

      {/* ── Left Section ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onMenuClick} className="mobile-menu-btn mobile-only" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.5rem' }}>
          <Menu size={24} />
        </button>

        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div className="navbar-logo-icon" style={{
            width: '36px', height: '36px', background: 'var(--accent-primary)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Cpu color="white" size={20} />
          </div>
          <div className="desktop-only">
            <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              AV SCREENER
            </span>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Institutional Terminal
            </div>
          </div>
        </Link>
      </div>

      {/* ── Search Bar ── */}
      <div ref={searchRef} className="navbar-search desktop-only" style={{ position: 'relative', flex: 1, maxWidth: '480px', margin: '0 1.5rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'var(--card-bg)', border: '1px solid var(--border-color)',
          borderRadius: '12px', padding: '0 1rem', height: '40px',
          transition: 'border-color 0.2s'
        }}
          className="search-wrap"
        >
          <Search size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search stocks…"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '0.9rem', width: '100%',
              fontWeight: '500'
            }}
          />
          {query && (
            <X size={14} color="var(--text-secondary)" style={{ cursor: 'pointer', flexShrink: 0 }}
              onClick={() => { setQuery(''); setResults([]); }} />
          )}
        </div>

        {/* Results dropdown */}
        {(results.length > 0 || searching) && (
          <div className="card" style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
            overflow: 'hidden', zIndex: 2000
          }}>
            {searching ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Searching…
              </div>
            ) : (
              results.map((r, i) => (
                <div key={i}
                  onClick={() => handleSelect(r.symbol || r.ticker || r)}
                  style={{
                    padding: '0.75rem 1.25rem', cursor: 'pointer',
                    borderBottom: i < results.length - 1 ? '1px solid #1e293b' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'background 0.15s'
                  }}
                  className="search-result-item"
                >
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {r.symbol || r.ticker || r}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {r.name || r.company_name || ''}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Right Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>

        {/* NIFTY ticker - Hide on mobile */}
        <div className="desktop-only" style={{ paddingRight: '1rem', borderRight: '1px solid var(--border-color)', textAlign: 'right', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>NIFTY 50</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
              +0.85% <TrendingUp size={12} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Notifications Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
             <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
             >
                <Bell size={20} />
                {notifications.some(n => !n.is_read) && (
                    <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%', border: '2px solid var(--nav-bg)' }} />
                )}
             </button>

             {showNotifications && (
                 <div className="card" style={{ 
                    position: 'absolute', top: 'calc(100% + 15px)', right: '-10px', width: '280px', 
                    maxHeight: '400px', overflowY: 'auto', padding: '0.5rem', zIndex: 2000 
                }}>
                    <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>NOTIFICATIONS</span>
                        <MailOpen size={14} color="var(--text-secondary)" />
                    </div>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            Zero alerts right now.
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} style={{ 
                                padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', 
                                opacity: n.is_read ? 0.6 : 1, transition: 'all 0.2s', position: 'relative' 
                            }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px' }}>{n.title}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.message}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                    {new Date(n.created_at).toLocaleTimeString()}
                                    {!n.is_read && <button onClick={() => handleMarkRead(n.id)} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: '800', fontSize: '0.65rem' }}>
                                        <Check size={10} /> Mark read
                                    </button>}
                                </div>
                            </div>
                        ))
                    )}
                 </div>
             )}
          </div>

          {/* User Dropdown */}
          <div style={{ position: 'relative' }}>
            <div onClick={() => setShowDropdown(!showDropdown)}
              className="user-profile-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '4px', borderRadius: '12px' }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(124,58,237,0.2)', overflow: 'hidden'
              }}>
                {userData?.picture
                  ? <img src={userData.picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={16} color="var(--accent-primary)" />}
              </div>
              <ChevronDown className="desktop-only" size={14} color="var(--text-secondary)"
                style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {showDropdown && (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999 }}
                  onClick={() => setShowDropdown(false)} />
                <div className="card" style={{
                  position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '180px',
                  padding: '8px', zIndex: 1000,
                  animation: 'slideInDown 0.2s ease-out'
                }}>
                  <div style={{ padding: '8px 12px', marginBottom: '4px' }} className="mobile-only">
                      <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{userData?.name || 'Trader'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{userData?.email}</div>
                  </div>
                  <DropdownItem icon={<User size={16} />} label="Profile" />
                  {userData?.role === 'admin' && (
                    <DropdownItem 
                      icon={<Cpu size={16} />} 
                      label="Admin Panel" 
                      onClick={() => navigate('/admin')} 
                      color="var(--accent-primary)"
                    />
                  )}
                  <DropdownItem icon={<Settings size={16} />} label="Settings" />
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                  <DropdownItem icon={<LogOut size={16} />} label="Logout" onClick={handleLogout} color="#ef4444" />
                </div>
              </>
            )}
          </div>

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="theme-btn"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        .user-profile-btn:hover { background: rgba(255,255,255,0.05); }
        .theme-btn:hover { color: var(--text-primary) !important; }
        .search-wrap:focus-within { border-color: var(--accent-primary) !important; }
        .search-result-item:hover { background: rgba(255,255,255,0.04); }

        @media (max-width: 480px) {
          .navbar { padding: 0 1rem; }
          .navbar-logo-icon { width: 32px; height: 32px; }
        }
      `}</style>
    </nav>
  );
};

const DropdownItem = ({ icon, label, onClick, color = 'var(--text-primary)' }) => (
  <div onClick={onClick} className="dropdown-item"
    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', color, transition: 'background 0.2s' }}>
    {icon}{label}
  </div>
);

export default Navbar;