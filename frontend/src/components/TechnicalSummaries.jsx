import React from 'react';

const TechnicalSummaries = ({ technical }) => {
  if (!technical) return null;

  const { ma_stack, rsi, mfi, macd, pivots } = technical;

  // Calculate bullish/bearish counts
  let bullish = 0;
  let bearish = 0;

  // MA Logic
  Object.values(ma_stack.sma).forEach((val, idx) => {
    if (val > 0) {
      if (technical.price > val) bullish++;
      else bearish++;
    }
  });

  // Indicators
  if (rsi > 50) bullish++; else bearish++;
  if (mfi > 50) bullish++; else bearish++;
  if (macd.status === 'Bullish') bullish++; else bearish++;

  const total = bullish + bearish;
  const bullishPct = (bullish / total) * 100;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
      {/* Indicator Summary */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Indicator Summary</h3>
        <div style={{ position: 'relative', height: '4px', background: 'var(--border-color)', borderRadius: '2px', marginBottom: '1.25rem' }}>
          <div style={{ 
            position: 'absolute', 
            left: 0, 
            height: '100%', 
            width: `${bullishPct}%`, 
            background: 'var(--success)', 
            borderRadius: '2px'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--success)', lineHeight: 1 }}>{bullish}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.2rem' }}>Bullish</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-secondary)', lineHeight: 1 }}>0</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.2rem' }}>Neutral</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--danger)', lineHeight: 1 }}>{bearish}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.2rem' }}>Bearish</div>
          </div>
        </div>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: bullish > bearish ? 'var(--success)' : 'var(--danger)' }}>
                {bullish > bearish ? 'STRONGLY BULLISH' : 'STRONGLY BEARISH'}
            </div>
        </div>
      </div>

      {/* Pivot Points Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Pivot Levels</h3>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: '700', background: 'var(--nav-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Pivot: ₹{pivots.pivot.toFixed(2)}</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--danger)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Support</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>S1</span>
                <span style={{ fontWeight: '600' }}>₹{pivots.s1.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>S2</span>
                <span style={{ fontWeight: '600' }}>₹{pivots.s2.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', opacity: 0.7 }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>S3</span>
                <span style={{ fontWeight: '600' }}>₹{pivots.s3.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Resistance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>R1</span>
                <span style={{ fontWeight: '600' }}>₹{pivots.r1.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>R2</span>
                <span style={{ fontWeight: '600' }}>₹{pivots.r2.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', opacity: 0.7 }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>R3</span>
                <span style={{ fontWeight: '600' }}>₹{pivots.r3.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalSummaries;
