import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, Activity, BarChart3, ShieldCheck } from 'lucide-react';
import { fetchStockAnalysis, fetchStockNews } from '../services/api';

import ScoreBlocks from '../components/ScoreBlocks';
import HighchartsComponent from '../components/HighchartsComponent';
import StockSearch from '../components/StockSearch';

// Institutional Terminal Components
import SummaryBanner from '../components/AnalysisTerminal/SummaryBanner';
import MarketSummary from '../components/AnalysisTerminal/MarketSummary';
import SessionTable from '../components/AnalysisTerminal/SessionTable';
import PerformanceStats from '../components/AnalysisTerminal/PerformanceStats';

const AnalyseStock = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      fetchStockNews(symbol).then(setNews);
    } else {
      setError(`Neural engine could not find data for "${symbol}". Ensure the ticker is valid.`);
    }
    setLoading(false);
  };

  return (
    <div className="container animate-in" style={{ paddingBottom: '3rem', maxWidth: '1280px' }}>

      {/* ── Search Bar (Minimized if data) ── */}
      {!data && !loading && (
        <div style={{ marginBottom: '2rem', textAlign: 'center', paddingTop: '3rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Terminal <span className="text-gradient">Intelligence</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem', fontWeight: '500' }}>
            Institutional Stock Research & Analysis
          </p>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
             <StockSearch onSearch={handleSearch} />
          </div>
        </div>
      )}

      {/* ── THE TERMINAL ── */}
      {data && !loading && (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
          
          {/* 1. AI Summary Banner */}
          <SummaryBanner insights={data.ai_insights} ticker={data.analysis.ticker} />

          {/* 2. Page Header / Price Overview */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', padding: '0 0.5rem' }}>
            <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    {data.analysis.ticker.replace('.NS', '')}
                </h2>
                <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '0.2rem' }}>
                    NSE • Equity • Market Segment
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1 }}>
                    ₹{data.analysis.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    marginTop: '0.4rem',
                    color: data.analysis.change_pct >= 0 ? 'var(--success)' : 'var(--danger)',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem'
                }}>
                    {data.analysis.change_pct >= 0 ? '+' : ''}{data.analysis.change_pct.toFixed(2)}%
                    {data.analysis.change_pct >= 0 ? <TrendingUp size={14} /> : <Activity size={14} />}
                </div>
            </div>
          </div>

          {/* 3. Core Chart (Highcharts Stock) */}
          <div style={{ marginBottom: '1rem' }}>
             <HighchartsComponent data={data.analysis.chart_data} symbol={data.analysis.ticker.replace('.NS', '')} />
          </div>

          {/* 4. Market Summary card */}
          <MarketSummary today={data.analysis.today} ticker={data.analysis.ticker} technical={data.analysis.technical} />

          {/* 5. Institutional Scores */}
          <div style={{ marginBottom: '1rem' }}>
             <ScoreBlocks scores={data.scores} />
          </div>

          {/* 6. Last 10 Sessions Table */}
          <SessionTable history={data.analysis.history} ticker={data.analysis.ticker} />

          {/* 7. Performance & Returns */}
          <PerformanceStats performance={data.analysis.technical.performance} ticker={data.analysis.ticker} />

          {/* 8. News Intelligence */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)' }}>
                <Activity size={14} /> News Intelligence
            </h3>
            <div className="news-intelligence-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {news.length > 0 ? news.slice(0, 5).map(item => (
                    <div key={item.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ background: item.sentiment === 'Bullish' ? 'var(--success-bg)' : 'var(--danger-bg)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
                             {item.sentiment === 'Bullish' ? <TrendingUp size={16} color="var(--success)" /> : <Activity size={16} color="var(--danger)" />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>{item.source.toUpperCase()} • {item.datetime}</span>
                                <span style={{ fontSize: '0.65rem', fontWeight: '700', color: item.sentiment === 'Bullish' ? 'var(--success)' : 'var(--danger)' }}>{item.sentiment.toUpperCase()}</span>
                            </div>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.85rem', display: 'block' }}>
                                {item.headline}
                            </a>
                        </div>
                    </div>
                )) : (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No recent news data found for this symbol.</div>
                )}
            </div>
          </div>

          {/* 9. Bottom Action Card */}
          <div className="card" style={{ 
              background: 'var(--bg-card-hover)', 
              border: '1px solid var(--accent-primary)20',
              padding: '1.25rem 1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--accent-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={22} color="white" />
                </div>
                <div>
                   <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>Institutional Verdict</h4>
                   <p style={{ margin: '1px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '500' }}>Alpha Score: {data.scores.final_score} | Sentiment: {data.scores.classification}</p>
                </div>
            </div>
            <div style={{ 
                background: data.scores.classification.includes('Buy') ? 'var(--success)' : 'var(--warning)', 
                color: 'white', 
                padding: '0.5rem 1.5rem', 
                borderRadius: '6px', 
                fontWeight: '700',
                fontSize: '0.85rem',
                letterSpacing: '0.5px'
            }}>
                {data.scores.classification.toUpperCase()}
            </div>
          </div>

        </div>
      )}

      <style>{`
        .loader-ring {
          display: inline-block; width: 60px; height: 60px;
          border: 5px solid var(--accent-primary); border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AnalyseStock;