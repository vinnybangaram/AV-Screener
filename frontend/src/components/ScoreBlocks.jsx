import React from 'react';
import { Shield, TrendingUp, DollarSign, Award, Cpu } from 'lucide-react';

const ScoreCard = ({ title, data, value, label, icon: Icon, color }) => {
  const getStatusColor = (statusLabel) => {
    if (['Strong', 'Strong Buy', 'Bullish', 'Undervalued'].includes(statusLabel)) return 'var(--success)';
    if (['Buy', 'Moderate', 'Neutral', 'Fair'].includes(statusLabel)) return 'var(--warning)';
    return 'var(--danger)';
  };

  const scoreValue = data ? data.score : value;
  const statusLabel = data ? data.label : label;
  const statusColor = getStatusColor(statusLabel);

  return (
    <div className="card-stat" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      borderTop: `2px solid ${color}`,
      padding: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <Icon size={14} color={color} />
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
        </div>
        <div style={{ fontSize: '0.6rem', fontWeight: '800', padding: '0.15rem 0.4rem', borderRadius: '4px', background: `${statusColor}15`, color: statusColor }}>
          {statusLabel?.toUpperCase()}
        </div>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1 }}>
        {scoreValue}
      </div>
    </div>
  );
};

const ScoreBlocks = ({ scores }) => {
  if (!scores) return null;

  return (
    <div className="responsive-grid" style={{ marginBottom: '1rem' }}>
      <ScoreCard title="Master Score" value={scores.final_score} label={scores.classification} icon={Award} color="var(--text-primary)" />
      <ScoreCard title="Durability" data={scores.durability} icon={Shield} color="var(--accent-primary)" />
      <ScoreCard title="Valuation" data={scores.valuation} icon={DollarSign} color="var(--warning)" />
      <ScoreCard title="Momentum" data={scores.momentum} icon={TrendingUp} color="var(--success)" />
    </div>
  );
};

export default ScoreBlocks;
