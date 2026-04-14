import React from 'react';

const SignalBreakdown = ({ breakdown }) => {
  if (!breakdown) return null;

  const items = [
    { label: 'TREND', value: breakdown.trend, max: 25, icon: '📈' },
    { label: 'MOMENTUM', value: breakdown.momentum, max: 20, icon: '⚡' },
    { label: 'VOLUME', value: breakdown.volume, max: 15, icon: '📊' },
    { label: 'RISK', value: breakdown.risk, max: 15, icon: '🛡️' },
    { label: 'CONTEXT', value: breakdown.marketContext, max: 10, icon: '🌐' },
    { label: 'SENTIMENT', value: breakdown.sentiment, max: 15, icon: '💬' }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
      gap: '12px',
      width: '100%'
    }}>
      {items.map((item) => (
        <div key={item.label} style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '14px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              {item.label}
            </span>
            <span style={{ fontSize: '0.8rem' }}>{item.icon}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-primary)' }}>
              {item.value}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              / {item.max}
            </span>
          </div>
          <div style={{ 
            height: '4px', 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            borderRadius: '10px' 
          }}>
            <div style={{ 
              height: '100%', 
              width: `${(item.value / item.max) * 100}%`, 
              backgroundColor: 'var(--accent-primary)',
              borderRadius: '10px',
              opacity: 0.8
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SignalBreakdown;
