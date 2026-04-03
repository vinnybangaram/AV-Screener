import React from 'react';
import { TrendingUp, Activity, BarChart2, Shield, Target } from 'lucide-react';

const Card = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
      <div style={{ padding: '0.5rem', background: `${color}22`, borderRadius: '8px' }}>
        <Icon size={20} color={color} />
      </div>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{title}</span>
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{value}</div>
    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{subtext}</div>
  </div>
);

const TechnicalCards = ({ data }) => {
  if (!data) return null;

  const { rsi, macd, trend, support, resistance, volume } = data;

  const getRsiColor = (val) => val > 70 ? '#ef4444' : val < 30 ? '#10b981' : '#6366f1';
  const getTrendColor = (t) => t === 'Uptrend' ? '#10b981' : t === 'Downtrend' ? '#ef4444' : '#f59e0b';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
      <Card 
        title="RSI (14)" 
        value={rsi.toFixed(1)} 
        subtext={rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'} 
        icon={Activity} 
        color={getRsiColor(rsi)} 
      />
      <Card 
        title="MACD" 
        value={macd.status} 
        subtext={`Value: ${macd.macd.toFixed(2)}`} 
        icon={TrendingUp} 
        color={macd.status === 'Bullish' ? '#10b981' : '#ef4444'} 
      />
      <Card 
        title="Current Trend" 
        value={trend} 
        subtext="Primary momentum" 
        icon={Target} 
        color={getTrendColor(trend)} 
      />
      <Card 
        title="S / R Levels" 
        value={`₹${support} - ₹${resistance}`} 
        subtext="Recent range" 
        icon={Shield} 
        color="#6366f1" 
      />
      <Card 
        title="Volume" 
        value={volume} 
        subtext="Activity level" 
        icon={BarChart2} 
        color={volume === 'Spike' ? '#f59e0b' : '#6366f1'} 
      />
    </div>
  );
};

export default TechnicalCards;
