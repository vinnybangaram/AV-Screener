import React from 'react';
import { Brain, AlertCircle, TrendingUp, Zap } from 'lucide-react';

const AIInsightBox = ({ insights }) => {
  if (!insights) return null;

  const { summary, strength, risk, outlook } = insights;

  const getOutlookColor = (o) => o === 'Bullish' ? '#10b981' : o === 'Bearish' ? '#ef4444' : '#f59e0b';
  const getRiskColor = (r) => r === 'High' ? '#ef4444' : r === 'Moderate' ? '#f59e0b' : '#10b981';

  return (
    <div className="card" style={{ padding: '2rem', border: '1px solid var(--accent)', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Brain size={32} color="var(--accent)" />
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Google Gemini Analysis</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            <Zap size={16} /> <span>Strength</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{strength}</div>
        </div>
        
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            <AlertCircle size={16} /> <span>Risk Level</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: getRiskColor(risk) }}>{risk}</div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            <TrendingUp size={16} /> <span>Outlook</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: getOutlookColor(outlook) }}>{outlook}</div>
        </div>
      </div>

      <div style={{ background: 'rgba(99, 102, 241, 0.1)', borderLeft: '4px solid var(--accent)', padding: '1.5rem', borderRadius: '4px' }}>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'white', margin: 0 }}>
          {summary}
        </p>
      </div>
    </div>
  );
};

export default AIInsightBox;
