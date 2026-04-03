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
    <div className="card" style={{ 
      padding: '1.25rem', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      borderTop: `3px solid ${color}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Icon size={18} color={color} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>{title}</span>
        </div>
        <div style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '4px', background: `${statusColor}20`, color: statusColor }}>
          {statusLabel}
        </div>
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
        {scoreValue}
      </div>
    </div>
  );
};

const ScoreBlocks = ({ scores }) => {
  if (!scores) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
      <ScoreCard title="Master Score" value={scores.final_score} label={scores.classification} icon={Award} color="var(--text-primary)" />
      <ScoreCard title="Durability" data={scores.durability} icon={Shield} color="var(--accent-primary)" />
      <ScoreCard title="Valuation" data={scores.valuation} icon={DollarSign} color="var(--warning)" />
      <ScoreCard title="Momentum" data={scores.momentum} icon={TrendingUp} color="var(--success)" />
    </div>
  );
};

export default ScoreBlocks;
