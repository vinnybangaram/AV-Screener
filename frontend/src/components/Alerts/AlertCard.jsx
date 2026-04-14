import React from 'react';
import { Target, ShieldAlert, Zap, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react';

const AlertCard = ({ alert, onRead }) => {
  const getIcon = () => {
    switch (alert.type) {
        case 'TARGET_HIT': return <Target size={18} color="#10b981" />;
        case 'SL_HIT': return <ShieldAlert size={18} color="#ef4444" />;
        case 'BREAKOUT': return <Zap size={18} color="#6366f1" />;
        case 'SETUP_ACTIVATED': return <TrendingUp size={18} color="#10b981" />;
        case 'TREND_WEAKENING': return <AlertTriangle size={18} color="#f59e0b" />;
        default: return <MessageSquare size={18} color="#94a3b8" />;
    }
  };

  const getPriorityColor = () => {
    switch (alert.priority) {
        case 'Critical': return '#ef4444';
        case 'High': return '#10b981';
        case 'Medium': return '#f59e0b';
        default: return '#94a3b8';
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div 
        onClick={() => !alert.is_read && onRead(alert.id)}
        style={{
            padding: '1rem',
            backgroundColor: alert.is_read ? 'transparent' : 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative'
        }}
    >
      {!alert.is_read && (
          <div style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', width: '4px', height: '40%', backgroundColor: getPriorityColor(), borderRadius: '10px' }} />
      )}
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ padding: '8px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
          {getIcon()}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-primary)' }}>{alert.title}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>{timeAgo(alert.created_at)}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{alert.message}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--accent-primary)', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    {alert.symbol}
                </span>
                {alert.action && (
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textDecoration: 'underline' }}>{alert.action}</span>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
