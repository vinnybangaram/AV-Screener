import React, { useState, useEffect } from 'react';
import { Rocket, Flame, ShieldAlert, Cpu, Gem, Zap, TrendingUp, Info, Search, RefreshCw, BarChart, ChevronRight, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StockAnalysisPanel from '../components/StockAnalysisPanel';

import { fetchMultibaggers, fetchAiStatus } from '../services/api';

const Multibagger = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState({ status: 'OK' });

  useEffect(() => {
    fetchMultibaggersData();
    updateAiStatus();
  }, []);

  const fetchMultibaggersData = async (refresh = false) => {
    setLoading(true);
    try {
      const result = await fetchMultibaggers(refresh);
      if (result.success) {
        setStocks(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch");
      }
    } catch (err) {
      setError("Market Discovery Engine is offline. Is the terminal running 'node server.js'?");
    } finally {
      setLoading(false);
    }
  };

  const updateAiStatus = async () => {
    const result = await fetchAiStatus();
    setAiStatus(result);
  };

  const handleAnalyze = (stock) => {
    setSelectedStock(stock);
    setIsPanelOpen(true);
  };

  return (
    <div style={{ padding: '2rem 4rem', color: 'var(--text-primary)', background: 'var(--bg-primary)', minHeight: 'calc(100vh - 64px)' }}>
      
      {/* Hero Section */}
      <div style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
             <Rocket size={18} /> Multibagger Intelligence Engine
          </div>
          <h1 style={{ margin: 0, fontSize: '2.75rem', fontWeight: '900', letterSpacing: '-1px' }}>
            Discovery <span style={{ color: 'var(--accent-primary)' }}>Terminal</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '0.4rem 0.75rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                🟢 LIVE DATA ACTIVE
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: aiStatus.status === 'OK' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: aiStatus.status === 'OK' ? '#6366f1' : '#ef4444', padding: '0.4rem 0.75rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <Cpu size={14} /> AI LAYER: {aiStatus.status}
             </div>
          </div>
        </div>
        <button 
           onClick={() => fetchMultibaggersData(true)}
          className="refresh-btn"
          disabled={loading}
          style={{
            background: 'var(--accent-primary)',
            border: 'none',
            padding: '1rem 1.75rem',
            borderRadius: '16px',
            color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: '700',
            fontSize: '1rem',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />} 
          Run 3-Layer Scan
        </button>
      </div>

      {/* Discovery Feed */}
      {loading ? (
        <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <div className="discovery-loader" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Syncing with Nifty 50 Liquidity...</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Calculating institutional scores and real-time technicals...</div>
          </div>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '24px', border: '1px dashed var(--error)' }}>
          <AlertTriangle size={64} color="var(--error)" style={{ marginBottom: '1.5rem' }} />
          <div style={{ color: 'var(--error)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>{error}</div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>Ensure the backend server is running and accessible.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '2rem' }}>
          {stocks.map((stock, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={stock.symbol}
            >
               <StockCard stock={stock} onAnalyze={() => handleAnalyze(stock)} />
            </motion.div>
          ))}
        </div>
      )}

      {/* AI Intelligence Panel */}
      <StockAnalysisPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        stock={selectedStock} 
      />

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        .discovery-loader {
          width: 50px;
          height: 50px;
          border: 4px solid var(--accent-secondary);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .refresh-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(99, 102, 241, 0.4);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

const StockCard = ({ stock, onAnalyze }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="stock-card" style={{
      background: 'var(--card-bg)',
      borderRadius: '28px',
      border: '1px solid var(--border-color)',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {/* High Probability Glow */}
      {stock.score >= 80 && (
        <div style={{ 
          position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', 
          background: 'var(--accent-primary)', opacity: 0.08, filter: 'blur(50px)', borderRadius: '50%' 
        }}></div>
      )}

      {/* Score Cluster */}
      <div style={{
        position: 'absolute', top: '1.75rem', right: '1.75rem', textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
          Institutional Score
        </div>
        <div style={{ 
          fontSize: '2rem', fontWeight: '950', color: stock.score >= 80 ? '#22c55e' : stock.score >= 60 ? '#6366f1' : 'var(--text-secondary)',
          lineHeight: '1', letterSpacing: '-1px'
        }}>
          {stock.score}
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{
          width: '60px', height: '60px', background: 'rgba(99, 102, 241, 0.08)', 
          borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.15)'
        }}>
          {stock.score >= 80 ? <Flame size={32} /> : <Rocket size={28} />}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '900', letterSpacing: '-0.5px' }}>{(stock.company_name || stock.ticker || 'Stock').replace('.NS', '')}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
             <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '700' }}>₹{stock.currentPrice?.toLocaleString()}</span>
             <span style={{ height: '4px', width: '4px', background: 'var(--border-color)', borderRadius: '50%' }}></span>
             <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingUp size={12} /> Live
             </span>
          </div>
        </div>
      </div>

      {/* Main Score Bar */}
      <div style={{ marginBottom: '2rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)' }}>Multibagger Probability</span>
            <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-primary)' }}>{stock.score}%</span>
         </div>
         <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stock.score}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ 
                height: '100%', 
                background: `linear-gradient(90deg, #6366f1 0%, ${stock.score >= 80 ? '#22c55e' : '#4f46e5'} 100%)` 
              }} 
            />
         </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
         <div className="metric-item">
            <span className="label">Structure</span>
            <span className="value" style={{ color: stock.near52WeekHigh ? '#22c55e' : 'inherit' }}>
                {stock.near52WeekHigh ? 'Near 52W High' : 'Consolidating'}
            </span>
         </div>
         <div className="metric-item">
            <span className="label">Momentum</span>
            <span className="value" style={{ color: stock.trendUp ? '#22c55e' : '#ef4444' }}>
                {stock.trendUp ? 'Bullish Trend' : 'Testing DMA'}
            </span>
         </div>
      </div>

      {/* Explanation Section */}
      <div style={{ marginBottom: '2rem' }}>
         <button 
           onClick={() => setShowExplanation(!showExplanation)}
           style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
         >
            <HelpCircle size={14} /> {showExplanation ? 'Hide Score Breakdown' : 'Explain Score Logic'}
         </button>
         
         <AnimatePresence>
           {showExplanation && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               style={{ overflow: 'hidden', marginTop: '1rem' }}
             >
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'grid', gap: '0.75rem' }}>
                   <ScoreLine label="Market Momentum" value={stock.breakdown.momentum.achieved} max={35} />
                   <ScoreLine label="Price Structure" value={stock.breakdown.structure.achieved} max={20} />
                   <ScoreLine label="AI Quality Score" value={stock.breakdown.aiQuality.achieved} max={25} />
                   <ScoreLine label="Risk Profile" value={stock.breakdown.risk.achieved} max={20} />
                </div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
         <button 
           onClick={onAnalyze}
           style={{ 
             flex: 1, background: 'var(--accent-primary)', border: 'none', padding: '1rem', borderRadius: '14px',
             color: 'white', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', display: 'flex',
             alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'filter 0.2s'
           }}
           className="action-btn"
         >
           Institutional Analysis <ChevronRight size={18} />
         </button>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: '900', color: 'var(--text-secondary)' }}>AI CONFIDENCE</div>
            <div style={{ 
               fontSize: '0.75rem', fontWeight: '900', 
               color: stock.confidence === 'High' ? '#22c55e' : stock.confidence === 'Fallback' ? '#ef4444' : '#6366f1' 
            }}>
               {stock.confidence}
            </div>
         </div>
      </div>

      <style>{`
        .stock-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent-primary);
          box-shadow: 0 16px 40px rgba(0,0,0,0.3);
        }
        .metric-item {
          background: rgba(255,255,255,0.02);
          padding: 0.75rem 1rem;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          border: 1px solid var(--border-color);
        }
        .metric-item .label {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .metric-item .value {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .action-btn:hover {
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
};

const ScoreLine = ({ label, value, max }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
    <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>{label}</span>
    <span style={{ fontWeight: '900' }}>{value} / {max}</span>
  </div>
);

export default Multibagger;
