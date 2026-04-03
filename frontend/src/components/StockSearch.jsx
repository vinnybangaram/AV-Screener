import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchTickers } from '../services/api';

const StockSearch = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef(null);

  // Debounced search for suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setSearching(true);
        const results = await searchTickers(query);
        setSuggestions(results || []);
        setShowDropdown(true);
        setSearching(false);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      handleSelect(query.trim().toUpperCase());
    }
  };

  const handleSelect = (symbol) => {
    setQuery(symbol);
    setShowDropdown(false);
    onSearch(symbol);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', margin: '0 auto 1.5rem auto' }} ref={dropdownRef}>
      <form onSubmit={handleSubmit}>
        <div className="search-container" style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-main)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '0.5rem 1.5rem',
          transition: 'all 0.2s ease'
        }}>
          {searching ? (
            <Loader2 size={24} color="var(--accent-primary)" className="animate-spin" style={{ marginRight: '1.25rem' }} />
          ) : (
            <Search size={24} color="var(--text-secondary)" style={{ marginRight: '1.25rem' }} />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            placeholder="Search Global Indian Symbols (e.g. RELIANCE, TCS, ZOMATO)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.25rem',
              fontWeight: '600',
              outline: 'none',
              padding: '1rem 0'
            }}
          />
          <button 
            type="submit" 
            className="btn" 
            disabled={loading || searching}
            style={{ padding: '0.6rem 2rem', borderRadius: '8px' }}
          >
            {loading ? 'CRUNCHING...' : 'ANALYZE'}
          </button>
        </div>
      </form>

      {/* Auto-complete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginTop: '0.5rem',
          zIndex: 2000,
          maxHeight: '400px',
          overflowY: 'auto',
          boxShadow: 'var(--shadow)',
          padding: '0.5rem'
        }}>
          {suggestions.map((item) => (
            <div
              key={item.symbol}
              onClick={() => handleSelect(item.symbol)}
              style={{
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                borderRadius: '12px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              className="suggestion-item"
            >
              <div>
                <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{item.symbol}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{item.name}</div>
              </div>
              <div style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 'bold', 
                  color: 'white', 
                  background: 'var(--accent-primary)', 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '4px' 
              }}>
                NSE
              </div>
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        .search-container:focus-within {
          border-color: var(--accent-primary) !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .suggestion-item:hover {
          background: var(--bg-card-hover) !important;
        }
      `}</style>
    </div>
  );
};

export default StockSearch;
