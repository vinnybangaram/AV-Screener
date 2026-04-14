import React, { useState, useEffect } from 'react';
import { fetchAlerts, markAllAlertsRead, markAlertRead } from '../../services/api';
import AlertCard from './AlertCard';
import { X, CheckCheck, RefreshCcw, Filter } from 'lucide-react';

const AlertsCenter = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllAlertsRead();
      setAlerts(alerts.map(a => ({ ...a, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRead = async (id) => {
    try {
      await markAlertRead(id);
      setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = alerts.filter(a => {
      if (activeTab === 'Critical') return a.priority === 'Critical';
      if (activeTab === 'Unread') return !a.is_read;
      return true;
  });

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      backgroundColor: 'var(--bg-card)',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      animation: 'slideIn 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '950', margin: 0, letterSpacing: '0.05em' }}>SURVEILLANCE CENTER</h2>
            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>REAL-TIME MARKET MONITORING</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
      </div>

      {/* Tabs / Toolbar */}
      <div style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
            {['All', 'Unread', 'Critical'].map(t => (
                <span 
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{ fontSize: '0.65rem', fontWeight: '900', color: activeTab === t ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer' }}
                >
                    {t}
                </span>
            ))}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
            <RefreshCcw size={14} className={loading ? 'spin' : ''} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={loadAlerts} />
            <CheckCheck size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={handleReadAll} />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredAlerts.length > 0 ? (
            filteredAlerts.map(a => <AlertCard key={a.id} alert={a} onRead={handleRead} />)
        ) : (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', opacity: 0.5 }}>
                <Filter size={40} style={{ marginBottom: '1rem' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>No signals currently filtered</span>
            </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
         <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.6 }}>
            Alerts are automated signals based on current data and user settings.
         </span>
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AlertsCenter;
