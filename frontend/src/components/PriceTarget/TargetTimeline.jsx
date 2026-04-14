import React from 'react';

const TargetTimeline = ({ targets }) => {
  if (!targets) return null;

  const points = [
    { label: 'NOW', price: 'Current', color: 'var(--text-muted)' },
    { label: '7D', price: targets['7d'].expected, color: 'var(--accent-primary)' },
    { label: '30D', price: targets['30d'].expected, color: 'var(--accent-primary)' },
    { label: '90D', price: targets['90d'].expected, color: 'var(--accent-primary)' },
  ];

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
      <h4 style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-secondary)', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>EXPECTED PRICE PATH</h4>
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 10px' }}>
        {/* Connector Line */}
        <div style={{ position: 'absolute', top: '24px', left: '20px', right: '20px', height: '2px', backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
        
        {points.map((p, i) => (
          <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
            <div style={{ 
                width: '12px', height: '12px', borderRadius: '50%', backgroundColor: p.label === 'NOW' ? 'var(--text-secondary)' : 'var(--accent-primary)',
                border: '3px solid var(--bg-card)',
                boxShadow: p.label === 'NOW' ? 'none' : '0 0 10px var(--accent-primary)40'
            }} />
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-primary)' }}>{p.label}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: '700', color: p.color }}>{p.price === 'Current' ? '---' : `₹${p.price}`}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TargetTimeline;
