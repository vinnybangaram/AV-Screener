import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchScreenerResults } from '../services/api';
import StockCard from '../components/StockCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('');

  const loadData = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    const data = await fetchScreenerResults(refresh);
    if (data) {
      setStocks(data.top_stocks || []);
      setTimeframe(data.timeframe_mode || '');
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Sentiment Engine</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Top 10 High-Probability Momentum Signals</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {timeframe && (
            <div style={{ padding: '0.5rem 1rem', background: 'var(--glare)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Timeframe:</span> <strong style={{ color: 'var(--accent-primary)' }}>{timeframe}</strong>
            </div>
          )}
          <button 
            className="btn" 
            onClick={() => loadData(true)} 
            disabled={loading || refreshing}
            style={{ minWidth: '180px', justifyContent: 'center' }}
          >
            {refreshing ? 'Scanning Market...' : '🔄 Run Screener'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
          <div style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Loading alpha signals...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {stocks.map((stock) => (
            <StockCard key={stock.ticker} stock={stock} />
          ))}
          {stocks.length === 0 && !loading && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              No high-probability setups found right now.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
