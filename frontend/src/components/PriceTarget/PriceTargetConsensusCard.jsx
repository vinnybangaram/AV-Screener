import React, { useState, useEffect } from 'react';
import { fetchPriceTargets } from '../../services/api';
import ScenarioRangeBars from './ScenarioRangeBars';
import TargetTimeline from './TargetTimeline';
import { ChevronRight, ShieldCheck, Info } from 'lucide-react';

const PriceTargetConsensusCard = ({ symbol }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeHorizon, setActiveHorizon] = useState('30d');

  const horizons = [
    { id: '7d', label: '7 DAYS' },
    { id: '30d', label: '30 DAYS' },
    { id: '90d', label: '90 DAYS' }
  ];

  useEffect(() => {
    if (!symbol) return;
    getTargets();
  }, [symbol]);

  const getTargets = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPriceTargets(symbol);
      setData(result);
    } catch (err) {
      console.error(err);
      setError('Consensus engine temporarily offline');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="card shimmer" style={{ height: '400px' }} />;
  if (error || !data) return null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
            PRICE TARGET CONSENSUS
        </h3>
        <div style={{ padding: '4px 12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '30px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--accent-primary)' }}>
                CONFIDENCE: {data.targets[activeHorizon].confidence}
            </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
        {horizons.map(h => (
          <button
            key={h.id}
            onClick={() => setActiveHorizon(h.id)}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '0.7rem',
              fontWeight: '900',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeHorizon === h.id ? 'var(--accent-primary)' : 'transparent',
              color: activeHorizon === h.id ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            {h.label}
          </button>
        ))}
      </div>

      {/* Ranges View */}
      <ScenarioRangeBars timeframeData={data.targets[activeHorizon]} currentPrice={data.currentPrice} />

      {/* Drivers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <h4 style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} /> MODEL DRIVERS
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.drivers.map((d, i) => (
                    <li key={i} style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: '600' }}>{d}</li>
                ))}
            </ul>
        </div>
        
        {/* Path Visualizer */}
        <TargetTimeline targets={data.targets} />
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', textAlign: 'center' }}>
         <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Info size={12} /> Targets are probabilistic scenarios based on market data, not guarantees.
         </span>
      </div>

    </div>
  );
};

export default PriceTargetConsensusCard;
