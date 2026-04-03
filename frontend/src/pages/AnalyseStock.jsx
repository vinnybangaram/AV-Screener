import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Brain, BarChart3, TrendingUp, Search } from 'lucide-react';
import { fetchStockAnalysis } from '../services/api';

// New Components
import StockSearch from '../components/StockSearch';
import ScoreBlocks from '../components/ScoreBlocks';
import MetricsGrid from '../components/MetricsGrid';
import FinancialTable from '../components/FinancialTable';
import TechnicalSummaries from '../components/TechnicalSummaries';
import CandlestickChart from '../components/CandlestickChart';
import AIInsightBox from '../components/AIInsightBox';
import TradingViewChart from '../components/TradingViewChart';

const AnalyseStock = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (symbol) => {
    setLoading(true);
    setError(null);
    setData(null);

    const result = await fetchStockAnalysis(symbol);
    if (result && result.scores) {
      setData(result);
    } else {
      setError(`Analysis engine could not retrieve data for "${symbol}". Ensure ticker is valid for NSE.`);
    }
    setLoading(false);
  };

  return (
    <div className="container animate-in" style={{ paddingBottom: '5rem' }}>
      {/* Primary Search Control */}
      <div style={{ marginBottom: '3rem' }}>
        <StockSearch onSearch={handleSearch} loading={loading} />
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '1.25rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '2rem' }}>
          <div className="loader-ring"></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
                Neural Engine <span className="text-gradient">ACTIVE</span>
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Calculating institutional scores and real-time technicals...</div>
          </div>
        </div>
      )}

      {data && !loading && (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
          {/* Section 0: Market Context Header */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>{data.analysis.ticker.replace('.NS', '')}</h2>
              <div className={data.scores.final_score > 60 ? "badge badge-success" : "badge badge-warning"}>
                  {data.scores.final_score > 75 ? 'Market Leader' : 'Mid Performer'}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>₹{data.analysis.price.toLocaleString()}</span>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '1rem', fontWeight: '600', color: data.analysis.change_pct >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {data.analysis.change_pct >= 0 ? '+' : ''}{data.analysis.change_pct.toFixed(2)}%
                </span>
              </div>
              <div style={{ height: '30px', width: '1px', background: 'var(--border-color)' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Vol (NSE)</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{(data.analysis.volume.current / 1000000).toFixed(2)}M</span>
              </div>
            </div>
          </div>

          {/* Section 1: Visual Score Cards */}
          <ScoreBlocks scores={data.scores} />

          {/* Section 2: Metrics Grid & Financials (Two column) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.25fr) 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <MetricsGrid fundamentals={data.analysis.fundamentals} technical={data.analysis.technical} />
            <FinancialTable fundamentals={data.analysis.fundamentals} />
          </div>

          {/* Section 3: Technicals & Pivots */}
          <TechnicalSummaries technical={data.analysis.technical} />

          {/* Section 4: Live Interactive Chart */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--accent-primary)" /> Live Advanced Chart
            </h3>
            <TradingViewChart symbol={data.analysis.ticker} />
          </div>

          {/* Section 5: AI Analysis & Context Chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
             <AIInsightBox insights={data.ai_insights} />
             <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '700' }}>Historical Perspective (60D)</div>
                <CandlestickChart data={data.analysis.chart_data} />
             </div>
          </div>

          {/* Section 6: Trade Setup Summary */}
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Trade Recommendation</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Based on quantitative scoring and institutional volume flow</p>
            </div>
            <div className={
                data.scores.classification === 'Strong Buy' ? 'badge badge-success' : 
                data.scores.classification === 'Buy' ? 'badge badge-success' : 'badge badge-warning'
              }
              style={{ fontSize: '1.1rem', padding: '0.5rem 1rem' }}
            >
              {data.scores.classification}
            </div>
          </div>

        </div>
      )}

      {/* Empty State Footer */}
      {!data && !loading && !error && (
        <div style={{ textAlign: 'center', marginTop: '5rem' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Popular stock searches for professional analysis:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ZOMATO', 'TATAMOTORS', 'ADANIENT'].map(s => (
                    <button key={s} onClick={() => handleSearch(s)} style={{ 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        border: '1px solid rgba(99, 102, 241, 0.3)', 
                        color: 'white', 
                        padding: '0.6rem 1.25rem', 
                        borderRadius: '30px', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--accent)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(99, 102, 241, 0.1)'}
                    >
                    {s}
                    </button>
                ))}
            </div>
        </div>
      )}

      <style>{`
        .loader-ring {
          display: inline-block;
          width: 80px;
          height: 80px;
          border: 6px solid var(--accent);
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AnalyseStock;
