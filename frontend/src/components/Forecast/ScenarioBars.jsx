import React from 'react';

const ScenarioBars = ({ scenarios }) => {
  if (!scenarios) return null;

  const data = [
    { 
      id: 'bullish', 
      label: 'BULLISH', 
      prob: scenarios.bullish.probability, 
      range: scenarios.bullish.range, 
      color: '#10b981' 
    },
    { 
      id: 'neutral', 
      label: 'NEUTRAL', 
      prob: scenarios.neutral.probability, 
      range: scenarios.neutral.range, 
      color: '#64748b' 
    },
    { 
      id: 'bearish', 
      label: 'BEARISH', 
      prob: scenarios.bearish.probability, 
      range: scenarios.bearish.range, 
      color: '#ef4444' 
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {data.map((item) => (
        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: item.color, letterSpacing: '0.05em' }}>
                {item.label}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                {item.range}
              </span>
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-primary)' }}>
              {item.prob}%
            </span>
          </div>
          <div style={{ 
            height: '10px', 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            borderRadius: '20px', 
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.03)'
          }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${item.prob}%`, 
                backgroundColor: item.color,
                borderRadius: '20px',
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 10px ${item.color}33`
              }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScenarioBars;
