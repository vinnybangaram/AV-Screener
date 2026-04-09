import React from 'react';

const StockCard = ({ stock }) => {
  const { ticker, current_price, score, signal_classification, background, scores_breakdown } = stock;

  const getScoreColor = (scoreValue) => {
    if (scoreValue >= 80) return "var(--success)";
    if (scoreValue >= 60) return "var(--warning)";
    return "var(--danger)";
  };

  const getBadgeClass = (signal) => {
    if (signal === "Strong Buy") return "badge-success";
    if (signal === "Buy") return "badge-success";
    if (signal === "Watchlist") return "badge-warning";
    return "badge-danger";
  };

  return (
    <div className="card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>{ticker}</h3>
          <span className={`badge ${getBadgeClass(signal_classification)}`} style={{ fontSize: '0.65rem' }}>
            {signal_classification}
          </span>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: getScoreColor(score) }}>
          {score}
        </div>
      </div>
      
      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
        ₹{current_price.toLocaleString()}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', marginTop: '0.5rem' }}>
        <ScoreBar label="QT" value={scores_breakdown.fundamental_score} color="var(--accent-primary)" />
        <ScoreBar label="MO" value={scores_breakdown.momentum_score} color="var(--accent-secondary)" />
        <ScoreBar label="VO" value={scores_breakdown.volume_score} color="var(--success)" />
        <ScoreBar label="RK" value={scores_breakdown.risk_score} color="var(--warning)" />
      </div>
    </div>
  );
};

const ScoreBar = ({ label, value, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div style={{ width: '100%', height: '2px', background: 'var(--border-color)', borderRadius: '1px', overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, background: color, height: '100%' }}></div>
    </div>
  </div>
);

export default StockCard;
