import React from 'react';

const ScoreGauge = ({ score, label }) => {
  const size = 200;
  const strokeWidth = 16;
  const r = 80;
  const cx = 100;
  const cy = 100;
  
  // For a semi-circle (top half)
  const circumference = Math.PI * r;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 85) return '#10b981';
    if (s >= 70) return '#34d399';
    if (s >= 55) return '#6366f1';
    if (s >= 40) return '#94a3b8';
    if (s >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(score);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%',
      position: 'relative',
      paddingTop: '1rem'
    }}>
      <div style={{ position: 'relative', width: size, height: size / 1.5, overflow: 'hidden' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track (Semi-circle) */}
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress Bar (Semi-circle) */}
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ 
                transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                filter: `drop-shadow(0 0 8px ${color}40)`
            }}
          />
        </svg>
        
        {/* Score Text Center */}
        <div style={{ 
          position: 'absolute', 
          bottom: '15%', 
          left: '50%', 
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '2.75rem', 
            fontWeight: '950', 
            color: 'var(--text-primary)',
            lineHeight: 1
          }}>
            {score}
          </div>
          <div style={{ 
            fontSize: '0.7rem', 
            fontWeight: '800', 
            color: 'var(--text-secondary)',
            letterSpacing: '0.1em',
            marginTop: '4px'
          }}>
            SCORE
          </div>
        </div>
      </div>

      {/* Label Badge */}
      <div style={{
        marginTop: '-10px',
        padding: '8px 20px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        border: `1px solid ${color}40`,
        borderRadius: '12px',
        color: color,
        fontSize: '0.85rem',
        fontWeight: '900',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
        zIndex: 2
      }}>
        {label}
      </div>
    </div>
  );
};

export default ScoreGauge;
