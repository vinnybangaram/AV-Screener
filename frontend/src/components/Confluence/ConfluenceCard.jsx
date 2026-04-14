import React, { useState, useEffect } from 'react';
import { fetchConfluence } from '../../services/api';
import ScoreGauge from './ScoreGauge';
import SignalBreakdown from './SignalBreakdown';
import { AlertCircle, Target, CheckCircle2 } from 'lucide-react';

const ConfluenceCard = ({ symbol }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;
    getData();
  }, [symbol]);

  const getData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchConfluence(symbol);
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Signal confluence offline');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="shimmer-loader" style={{ width: '100%', height: '300px' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>⚠️ {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1.5rem 2rem' }}>
      
      {/* Header section with Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
        <h3 style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-secondary)', 
            fontWeight: '900', 
            letterSpacing: '0.15em',
            margin: '0 0 1rem 0',
            textTransform: 'uppercase'
        }}>
          CONFLUENCE ALIGNMENT
        </h3>
        <ScoreGauge score={data.score} label={data.label} />
      </div>

      {/* Grid Layout for Drivers & Warnings */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.25rem',
        marginTop: '1rem' 
      }}>
        
        {/* Drivers */}
        <div style={{ 
          backgroundColor: 'rgba(16, 185, 129, 0.04)', 
          borderRadius: '16px', 
          border: '1px solid rgba(16, 185, 129, 0.12)',
          padding: '1.25rem'
        }}>
          <h4 style={{ fontSize: '0.7rem', fontWeight: '900', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
            <CheckCircle2 size={14} /> KEY SIGNAL DRIVERS
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.drivers.map((d, i) => (
              <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '600', opacity: 0.9 }}>{d}</li>
            ))}
          </ul>
        </div>

        {/* Warnings */}
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.04)', 
          borderRadius: '16px', 
          border: '1px solid rgba(239, 68, 68, 0.12)',
          padding: '1.25rem'
        }}>
          <h4 style={{ fontSize: '0.7rem', fontWeight: '900', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
            <AlertCircle size={14} /> RISK OVERLAYS
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.warnings.length > 0 ? data.warnings.map((w, i) => (
              <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '600', opacity: 0.9 }}>{w}</li>
            )) : (
              <li style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>No major structural warnings.</li>
            )}
          </ul>
        </div>

      </div>

      {/* Breakdown Grid */}
      <section style={{ marginTop: '0.5rem' }}>
        <h4 style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            SIGNAL COMPOSITION
        </h4>
        <SignalBreakdown breakdown={data.breakdown} />
      </section>

      {/* Footer / Disclaimer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.02em' }}>
                LAST COMPUTE: {new Date(data.updatedAt).toLocaleTimeString()}
            </span>
        </div>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: '500', opacity: 0.6 }}>
          Decision Support Metric • Non-Financial Advice
        </span>
      </div>

    </div>
  );
};

export default ConfluenceCard;
