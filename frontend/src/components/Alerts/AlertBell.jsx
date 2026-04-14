import React, { useState, useEffect } from 'react';
import { fetchUnreadAlertCount } from '../../services/api';
import { Bell } from 'lucide-react';

const AlertBell = ({ onClick }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000); // Pulse check every 30s
    return () => clearInterval(interval);
  }, []);

  const loadCount = async () => {
    try {
      const { count } = await fetchUnreadAlertCount();
      setCount(count);
    } catch (err) {
      // Periodic check fail is okay
    }
  };

  return (
    <div 
        onClick={onClick}
        style={{ 
            position: 'relative', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '8px',
            borderRadius: '50%',
            transition: 'background 0.2s',
            zIndex: 1010
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <Bell size={20} color={count > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'} strokeWidth={2.5} />
      {count > 0 && (
          <div style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '0.6rem',
              fontWeight: '950',
              borderRadius: '50%',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-main)',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
          }}>
              {count > 9 ? '9+' : count}
          </div>
      )}
    </div>
  );
};

export default AlertBell;
