import React, { useState, useEffect } from 'react';
import ScenarioBars from './ScenarioBars';
import { fetchForecast } from '../../services/api';

const ForecastCard = ({ symbol }) => {
  const [horizon, setHorizon] = useState('30D');
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const horizons = ['7D', '30D', '90D'];

  useEffect(() => {
    if (!symbol) return;
    getForecast();
  }, [symbol, horizon]);

  const getForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchForecast(symbol, horizon);
      setForecast(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Forecast service temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.05em' }}>
            PROBABILITY FORECAST
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: '800', 
              padding: '2px 8px', 
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              CONFIDENCE: <span style={{ color: forecast?.confidence === 'High' ? '#10b981' : forecast?.confidence === 'Medium' ? '#f59e0b' : '#ef4444' }}>
                {forecast?.confidence || '...'}
              </span>
            </span>
          </div>
        </div>

        {/* Horizon Pills */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '8px' }}>
          {horizons.map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              style={{
                padding: '4px 12px',
                fontSize: '0.7rem',
                fontWeight: '800',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: horizon === h ? 'var(--accent-color)' : 'transparent',
                color: horizon === h ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="shimmer" style={{ width: '100%', height: '150px', borderRadius: '8px' }} />
        </div>
      ) : (
        <>
          <ScenarioBars scenarios={forecast?.scenarios} />

          {/* Reasoning */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              QUANT REASONING
            </span>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {forecast?.reasoning.map((r, i) => (
                <li key={i} style={{ opacity: 0.9 }}>{r}</li>
              ))}
            </ul>
          </div>

          <p style={{ marginTop: '1.25rem', fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }}>
            Forecasts are probability estimates based on market data, not financial advice.
          </p>
        </>
      )}
    </div>
  );
};

export default ForecastCard;
