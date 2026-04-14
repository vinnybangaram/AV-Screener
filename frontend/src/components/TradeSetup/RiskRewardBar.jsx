import React from 'react';

const RiskRewardBar = ({ ratio }) => {
  // ratio is string like "1:2.8"
  const val = parseFloat(ratio.split(':')[1]) || 1;
  const maxVal = 5; // Normalize for UI
  const percentage = Math.min((val / maxVal) * 100, 100);
  
  const getColor = () => {
    if (val >= 2.5) return '#10b981';
    if (val >= 1.5) return '#6366f1';
    return '#f59e0b';
  };

  const color = getColor();

  return (
    <div style={{ width: '100%', marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)' }}>RISK/REWARD</span>
        <span style={{ fontSize: '0.8rem', fontWeight: '950', color: color }}>{ratio}</span>
      </div>
      <div style={{ 
        height: '8px', 
        width: '100%', 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          height: '100%', 
          width: `${percentage}%`, 
          backgroundColor: color,
          borderRadius: '10px',
          boxShadow: `0 0 10px ${color}30`,
          transition: 'width 1s ease-out'
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
         <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Low Alpha</span>
         <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>High Edge</span>
      </div>
    </div>
  );
};

export default RiskRewardBar;
