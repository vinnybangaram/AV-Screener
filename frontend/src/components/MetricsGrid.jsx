import React from 'react';

const MetricItem = ({ label, value, subtext, color = 'var(--text-primary)' }) => (
  <div style={{ padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{label}</span>
      {subtext && <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{subtext}</span>}
    </div>
    <span style={{ fontSize: '1rem', fontWeight: '800', color: color }}>{value}</span>
  </div>
);

const MetricsGrid = ({ fundamentals, technical }) => {
  if (!fundamentals || !technical) return null;

  const formatLargeNumber = (num) => {
    if (num >= 1000000000) return `₹${(num / 1000000000).toFixed(2)}B`;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    return `₹${num.toLocaleString()}`;
  };

  const getPerfColor = (val) => val >= 0 ? '#10b981' : '#ef4444';

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
         QUANTITATIVE METRICS
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <MetricItem label="Market Cap" value={formatLargeNumber(fundamentals.market_cap)} />
          <MetricItem label="PE Ratio" value={fundamentals.pe || "25.0"} color={(fundamentals.pe || 25) < 30 ? 'var(--success)' : 'var(--warning)'} />
          <MetricItem label="ROE" value={`${(fundamentals.roe * 100).toFixed(1)}%`} color={fundamentals.roe > 0.15 ? 'var(--success)' : 'var(--warning)'} />
          <MetricItem label="Debt to Equity" value={fundamentals.debt_to_equity.toFixed(2)} color={fundamentals.debt_to_equity < 0.5 ? 'var(--success)' : 'var(--danger)'} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <MetricItem label="Revenue Growth" value={`${(fundamentals.revenue_growth * 100).toFixed(1)}%`} color={fundamentals.revenue_growth > 0.1 ? 'var(--success)' : 'var(--warning)'} />
          <MetricItem label="Profit Growth" value={`${(fundamentals.earnings_growth * 100).toFixed(1)}%`} color={fundamentals.earnings_growth > 0.1 ? 'var(--success)' : 'var(--warning)'} />
          <MetricItem 
            label="1M Alpha" 
            value={`${technical.performance["1m"].toFixed(1)}%`} 
            color={getPerfColor(technical.performance["1m"])} 
          />
          <MetricItem 
            label="1Y Alpha" 
            value={`${technical.performance["1y"].toFixed(1)}%`} 
            color={getPerfColor(technical.performance["1y"])} 
          />
        </div>
      </div>
    </div>
  );
};

export default MetricsGrid;
