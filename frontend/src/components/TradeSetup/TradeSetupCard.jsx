import React, { useState, useEffect } from 'react';
import { fetchTradeSetup } from '../../services/api';
import SetupBadge from './SetupBadge';
import RiskRewardBar from './RiskRewardBar';
import { Compass, ShieldAlert, Zap, Target } from 'lucide-react';

const TradeSetupCard = ({ symbol }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;
    getSetup();
  }, [symbol]);

  const getSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTradeSetup(symbol);
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Trade engine unavailable');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
     return <div className="card shimmer" style={{ height: '350px' }} />;
  }

  if (error || !data) {
     return null; // Silent fail if no setup found
  }

  const PlanItem = ({ label, value, color = 'var(--text-primary)' }) => (
    <div style={{ 
      padding: '1rem', 
      backgroundColor: 'rgba(255,255,255,0.02)', 
      borderRadius: '12px', 
      border: '1px solid rgba(255,255,255,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '1.15rem', fontWeight: '900', color: color }}>{value}</span>
    </div>
  );

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '950', margin: 0, letterSpacing: '0.05em' }}>TRADE SETUP</h3>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
            <SetupBadge label={data.setupType} type="setup" />
            <SetupBadge label={data.status} type="status" />
            <SetupBadge label={data.confidence} type="confidence" />
        </div>
      </div>

      {/* Execution Plan Grid or Inactive State */}
      {data.setupType === 'Avoid' ? (
        <div style={{ 
            padding: '2.5rem 1.5rem', 
            backgroundColor: 'rgba(255,255,255,0.02)', 
            borderRadius: '16px', 
            border: '1px dashed rgba(255,255,255,0.08)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
        }}>
           <div style={{ fontSize: '1.5rem' }}>📵</div>
           <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>No High-Probability Setup Detected</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '300px', margin: '4px auto' }}>
                Quant algorithms indicate insufficient edge at current price levels. Terminal is in monitoring mode.
              </div>
           </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            <PlanItem label="Entry Zone" value={data.entryZone} color="#6366f1" />
            <PlanItem label="Stop Loss" value={`₹${data.stopLoss}`} color="#ef4444" />
            <PlanItem label="Target 1" value={`₹${data.targets.t1}`} color="#10b981" />
            <PlanItem label="Target 2" value={`₹${data.targets.t2}`} color="#10b981" />
          </div>
          <RiskRewardBar ratio={data.riskReward} />
        </>
      )}

      {/* Reasoning & Warnings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> TRADE RATIONALE
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.reasons.map((r, i) => (
                    <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-primary)', opacity: 0.9, fontWeight: '500' }}>{r}</li>
                ))}
            </ul>
        </div>

        {data.warnings.length > 0 && (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                <h4 style={{ fontSize: '0.7rem', fontWeight: '900', color: '#ef4444', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={14} /> RISK OVERLAY
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                    {data.warnings[0]}
                </p>
            </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', textAlign: 'center' }}>
         <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.6 }}>
            Trade setups are decision-support plans, not guaranteed outcomes.
         </span>
      </div>

    </div>
  );
};

export default TradeSetupCard;
