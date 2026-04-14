import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, Activity, BarChart3, ShieldCheck } from 'lucide-react';
import { fetchStockAnalysis, fetchStockNews } from '../services/api';
import Loader from '../components/Common/Loader';

import ScoreBlocks from '../components/ScoreBlocks';
import HighchartsComponent from '../components/HighchartsComponent';
import StockSearch from '../components/StockSearch';

// Institutional Terminal Components
import SummaryBanner from '../components/AnalysisTerminal/SummaryBanner';
import MarketSummary from '../components/AnalysisTerminal/MarketSummary';
import SessionTable from '../components/AnalysisTerminal/SessionTable';
import PerformanceStats from '../components/AnalysisTerminal/PerformanceStats';
import ForecastCard from '../components/Forecast/ForecastCard';
import ConfluenceCard from '../components/Confluence/ConfluenceCard';
import TradeSetupCard from '../components/TradeSetup/TradeSetupCard';
import PriceTargetConsensusCard from '../components/PriceTarget/PriceTargetConsensusCard';
import ShareMenu from '../components/Community/ShareMenu';
import CommentsPanel from '../components/Community/CommentsPanel';

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
    <div className="container animate-in" style={{ paddingBottom: '4rem', color: 'var(--text-primary)' }}>

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

      {loading && (
        <Loader message="Synthesizing Quant Data and Market Sentiments..." fullPage={false} />
      )}

      {/* ── THE TERMINAL ── */}
      {data && !loading && (
        <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SECTION 1: HERO OVERVIEW & AI BANNER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SummaryBanner insights={data.ai_insights} ticker={data.analysis.ticker} />
            
            <div className="terminal-hero-container" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1.8fr 1fr', 
              gap: '1.5rem'
            }}>
              {/* Chart Side */}
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="terminal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                      <h2 style={{ fontSize: '2.75rem', fontWeight: '900', margin: 0, letterSpacing: '-0.05em', lineHeight: 1, color: 'var(--text-primary)' }}>
                          {data.analysis.ticker.replace('.NS', '')}
                      </h2>
                      <div style={{ color: 'var(--accent-primary)', fontWeight: '900', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2.5px', marginTop: '8px' }}>
                          NSE EQUITY TERMINAL • {data.scores.classification}
                      </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2.75rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1 }}>
                          ₹{data.analysis.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ 
                          fontSize: '1.2rem', 
                          fontWeight: '800', 
                          marginTop: '4px',
                          color: data.analysis.change_pct >= 0 ? 'var(--success)' : 'var(--danger)',
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px'
                      }}>
                          {data.analysis.change_pct >= 0 ? '+' : ''}{data.analysis.change_pct.toFixed(2)}%
                          {data.analysis.change_pct >= 0 ? <TrendingUp size={18} /> : <Activity size={18} />}
                      </div>
                  </div>
                </div>
                <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none' }}>
                   <HighchartsComponent data={data.analysis.chart_data} symbol={data.analysis.ticker.replace('.NS', '')} />
                </div>
              </div>

              {/* Sidebar Side */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div className="card" style={{ 
                    flex: 1, 
                    padding: '2rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    border: '1px solid var(--accent-primary)40', 
                    backgroundColor: 'rgba(99, 102, 241, 0.04)',
                    boxShadow: '0 0 40px rgba(99, 102, 241, 0.05)'
                 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '1.5rem' }}>Neural Conviction</div>
                    <div style={{ fontSize: '5.5rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-4px' }}>{data.scores.final_score}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '0.5rem', letterSpacing: '1px' }}>INSTITUTIONAL ALPHA</div>
                    
                    <div style={{ 
                        marginTop: '2rem', 
                        padding: '0.75rem 2rem', 
                        borderRadius: '12px', 
                        backgroundColor: data.scores.classification.includes('Buy') ? 'var(--success)' : 'var(--warning)',
                        color: 'white',
                        fontSize: '0.85rem',
                        fontWeight: '950',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }}>
                        {data.scores.classification.toUpperCase()}
                    </div>
                 </div>
                 <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                       <ShareMenu symbol={data.analysis.ticker} />
                    </div>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent-primary)20' }}>
                        <ShieldCheck size={20} color="var(--accent-primary)" />
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: INTELLIGENCE GRID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '4px', height: '20px', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--text-secondary)' }}>QUANTITATIVE INTELLIGENCE</h3>
              </div>
              <div className="intelligence-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', 
                gap: '1.5rem'
              }}>
                <ForecastCard symbol={data.analysis.ticker} />
                <ConfluenceCard symbol={data.analysis.ticker} />
                <TradeSetupCard symbol={data.analysis.ticker} />
                <MarketSummary today={data.analysis.today} ticker={data.analysis.ticker} technical={data.analysis.technical} />
              </div>
          </div>

          {/* SECTION 3: STRATEGIC TARGETS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '4px', height: '20px', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--text-secondary)' }}>PRICE TARGETS & CONTEXT</h3>
              </div>
              <PriceTargetConsensusCard symbol={data.analysis.ticker} />
              <ScoreBlocks scores={data.scores} />
          </div>

          {/* SECTION 4: DATA DEPTH */}
          <div className="historical-performance-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.2fr 0.8fr', 
            gap: '1.5rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '4px', height: '20px', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--text-secondary)' }}>TRADE HISTORY</h3>
                </div>
                <SessionTable history={data.analysis.history} ticker={data.analysis.ticker} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '4px', height: '20px', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--text-secondary)' }}>PERFORMANCE</h3>
                </div>
                <PerformanceStats performance={data.analysis.technical.performance} ticker={data.analysis.ticker} />
            </div>
          </div>

          {/* SECTION 5: SOCIAL & NARRATIVE */}
          <div className="social-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <CommentsPanel symbol={data.analysis.ticker} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '4px', height: '20px', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '950', letterSpacing: '1px', margin: 0 }}>MARKET INTELLIGENCE</h3>
                </div>
                <div className="news-intelligence-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {news.length > 0 ? news.slice(0, 6).map(item => (
                        <div key={item.id} className="card card-interactive" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                <div style={{ background: item.sentiment === 'Bullish' ? 'var(--success-bg)' : 'var(--danger-bg)', padding: '0.75rem', borderRadius: '12px', border: item.sentiment === 'Bullish' ? '1px solid var(--success-border)' : '1px solid var(--danger-border)' }}>
                                    {item.sentiment === 'Bullish' ? <TrendingUp size={20} color="var(--success)" /> : <Activity size={20} color="var(--danger)" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.source} • {item.datetime}</span>
                                        <span className={`badge ${item.sentiment === 'Bullish' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>{item.sentiment}</span>
                                    </div>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem', lineHeight: 1.5, display: 'block' }}>
                                        {item.headline}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: '400px', borderStyle: 'dashed' }}>
                            No market intelligence found for this symbol.
                        </div>
                    )}
                </div>
            </div>
          </div>

        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1300px) {
          .terminal-hero-container { grid-template-columns: 1fr !important; }
          .historical-performance-grid { grid-template-columns: 1fr !important; }
          .social-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AnalyseStock;