import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { fetchStockAnalysis, fetchStockNews } from '../services/api';

import ScoreBlocks from '../components/ScoreBlocks';
import MetricsGrid from '../components/MetricsGrid';
import FinancialTable from '../components/FinancialTable';
import TechnicalSummaries from '../components/TechnicalSummaries';
import HighchartsComponent from '../components/HighchartsComponent';
import AIInsightBox from '../components/AIInsightBox';
import TradingViewChart from '../components/TradingViewChart';
import StockSearch from '../components/StockSearch';

const AnalyseStock = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-trigger from navbar search ?symbol=
  useEffect(() => {
    const symbol = searchParams.get('symbol');
    if (symbol) handleSearch(symbol);
  }, [searchParams]);

  const handleSearch = async (symbol) => {
    setLoading(true);
    setError(null);
    setData(null);
    const result = await fetchStockAnalysis(symbol);
    if (result && result.scores) {
      setData(result);
      // Fetch news in parallel
      fetchStockNews(symbol).then(setNews);
    } else {
      setError(`Analysis engine could not retrieve data for "${symbol}". Ensure ticker is valid for NSE.`);
    }
    setLoading(false);
  };

  return (
    <div className="container animate-in" style={{ paddingBottom: '5rem' }}>

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)',
          color: 'var(--danger)', padding: '1.25rem', borderRadius: '12px',
          marginBottom: '2rem', textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '2rem' }}>
          <div className="loader-ring" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
              Neural Engine <span className="text-gradient">ACTIVE</span>
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
              Calculating institutional scores and real-time technicals...
            </div>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {data && !loading && (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>

          {/* Section 0: Header */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                {data.analysis.ticker.replace('.NS', '')}
              </h2>
              <div className={data.scores.final_score > 60 ? 'badge badge-success' : 'badge badge-warning'}>
                {data.scores.final_score > 75 ? 'Market Leader' : 'Mid Performer'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  ₹{data.analysis.price.toLocaleString()}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '1rem', fontWeight: '600', color: data.analysis.change_pct >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {data.analysis.change_pct >= 0 ? '+' : ''}{data.analysis.change_pct.toFixed(2)}%
                </span>
              </div>
              <div style={{ height: '30px', width: '1px', background: 'var(--border-color)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Vol (NSE)</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {(data.analysis.volume.current / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Score Cards */}
          <ScoreBlocks scores={data.scores} />

          {/* Section 2: Metrics + Financials */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.25fr) 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <MetricsGrid fundamentals={data.analysis.fundamentals} technical={data.analysis.technical} />
            <FinancialTable fundamentals={data.analysis.fundamentals} />
          </div>

          {/* Section 3: Technicals */}
          <TechnicalSummaries technical={data.analysis.technical} />

          {/* Section 4: Live Chart */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--accent-primary)" /> Live Advanced Chart
            </h3>
            <TradingViewChart symbol={data.analysis.ticker} />
          </div>

          {/* Section 5: AI + Highcharts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <AIInsightBox insights={data.ai_insights} />
            <HighchartsComponent data={data.analysis.chart_data} symbol={data.analysis.ticker.replace('.NS', '')} />
          </div>

          {/* Section 6: Accurate News System */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--accent-primary)" /> Market Intelligence & News
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {news.length > 0 ? news.map(item => (
                <div key={item.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.datetime} | {item.source}</span>
                    <span className={`badge ${item.sentiment === 'Bullish' ? 'badge-success' : item.sentiment === 'Bearish' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>
                      {item.sentiment}
                    </span>
                  </div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', textDecoration: 'none' }}>
                    {item.headline}
                  </a>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineBreak: 'anywhere' }}>
                    {item.summary.length > 120 ? item.summary.substring(0, 120) + '...' : item.summary}
                  </p>
                </div>
              )) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem' }}>No recent news found for this ticker.</div>
              )}
            </div>
          </div>

          {/* Section 6: Trade Recommendation */}
          <div className="card-accent" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Trade Recommendation</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                Based on quantitative scoring and institutional volume flow
              </p>
            </div>
            <div
              className={data.scores.classification === 'Strong Buy' || data.scores.classification === 'Buy' ? 'badge badge-success' : 'badge badge-warning'}
              style={{ fontSize: '1.1rem', padding: '0.5rem 1rem' }}
            >
              {data.scores.classification}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state — no symbol yet ── */}
      {!data && !loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '2rem', textAlign: 'center' }}>
          <div style={{ 
            width: '120px', height: '120px', background: 'var(--accent-primary)', borderRadius: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 20px 50px rgba(99, 102, 241, 0.3)', marginBottom: '1rem',
            animation: 'pulse 2s infinite'
          }}>
            <TrendingUp size={60} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
              Equity <span className="text-gradient">Intelligence</span>
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
              Instant quantitative scoring, institutional flows, and Gemini AI insights for any NSE/BSE listed asset.
            </p>
          </div>
          
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <StockSearch onSearch={handleSearch} />
          </div>

          <div style={{ marginTop: '2rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>
              Trending Terminals
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ZOMATO', 'TATAMOTORS', 'ADANIENT'].map(s => (
                <button key={s} onClick={() => handleSearch(s)} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)', padding: '0.6rem 1.25rem', borderRadius: '30px',
                    cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s'
                }}
                    onMouseEnter={e => { e.target.style.background = 'var(--accent-primary)'; e.target.style.color = 'white'; }}
                    onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.color = 'var(--text-primary)'; }}
                >
                    {s}
                </button>
                ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .loader-ring {
          display: inline-block; width: 80px; height: 80px;
          border: 6px solid var(--accent); border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 20px 50px rgba(99, 102, 241, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 25px 60px rgba(99, 102, 241, 0.5); }
          100% { transform: scale(1); box-shadow: 0 20px 50px rgba(99, 102, 241, 0.3); }
        }
      `}</style>
    </div>
  );
};

export default AnalyseStock;