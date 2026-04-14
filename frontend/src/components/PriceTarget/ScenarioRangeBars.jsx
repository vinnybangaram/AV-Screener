import React from 'react';

const ScenarioRangeBars = ({ timeframeData, currentPrice }) => {
  if (!timeframeData) return null;

  const scenarios = [
    { label: 'BULLISH', range: timeframeData.bullish, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
    { label: 'BASE CASE', range: timeframeData.base, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)' },
    { label: 'BEARISH', range: timeframeData.bearish, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
  ];

  const parseRange = (r) => r.split('-').map(v => parseFloat(v));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {scenarios.map((s) => {
        const [min, max] = parseRange(s.range);
        const isPositive = timeframeData.expected >= currentPrice;
        
        return (
          <div key={s.label} style={{
            padding: '1rem',
            backgroundColor: s.bg,
            borderRadius: '12px',
            border: `1px solid ${s.color}20`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '900', color: s.color, letterSpacing: '0.05em' }}>{s.label}</span>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{s.range}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '2px' }}>PROBABLE TARGET</div>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                    ₹{s.label === 'BASE CASE' ? timeframeData.expected : s.label === 'BULLISH' ? max : min }
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScenarioRangeBars;
