import React from 'react';

const SetupBadge = ({ label, type = 'setup' }) => {
  const getColors = () => {
    // Colors for Setup Types
    if (type === 'setup') {
        switch (label) {
            case 'Breakout': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.2)' };
            case 'Pullback': return { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.2)' };
            case 'Reversal': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' };
            default: return { bg: 'rgba(255, 255, 255, 0.05)', text: '#94a3b8', border: 'rgba(255, 255, 255, 0.1)' };
        }
    }
    // Colors for Status
    if (type === 'status') {
        switch (label) {
            case 'Valid': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
            case 'Watchlist': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
            case 'Avoid': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
            default: return { bg: 'rgba(255, 255, 255, 0.05)', text: '#94a3b8', border: 'rgba(255, 255, 255, 0.1)' };
        }
    }
    // Colors for Confidence
    if (type === 'confidence') {
        switch (label) {
            case 'High': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'none' };
            case 'Medium': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'none' };
            case 'Low': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', border: 'none' };
            default: return { bg: 'rgba(255, 255, 255, 0.05)', text: '#94a3b8', border: 'none' };
        }
    }
    return { bg: 'rgba(255, 255, 255, 0.05)', text: '#94a3b8', border: 'none' };
  };

  const { bg, text, border } = getColors();

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      backgroundColor: bg,
      color: text,
      border: border !== 'none' ? `1px solid ${border}` : 'none',
      borderRadius: '6px',
      fontSize: '0.65rem',
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {label}
    </div>
  );
};

export default SetupBadge;
