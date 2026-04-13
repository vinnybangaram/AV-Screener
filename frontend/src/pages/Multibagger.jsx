import React, { useState, useEffect } from 'react';
import { Rocket, Flame, ShieldAlert, Cpu, Gem, Zap, TrendingUp, Info, Search, RefreshCw, BarChart, ChevronRight, CheckCircle2, AlertTriangle, HelpCircle, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import StockAnalysisPanel from '../components/StockAnalysisPanel';

import { fetchMultibaggers, fetchAiStatus, addToWatchlist } from '../services/api';

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
    <div className="container" style={{ paddingBottom: '4rem', color: 'var(--text-primary)', minHeight: 'calc(100vh - 64px)' }}>
      
      {/* Hero Section */}
      <div className="hero-section" style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
             <Rocket size={18} /> Multibagger Intelligence Engine
          </div>
          <h1 className="page-title" style={{ margin: 0, fontWeight: '900', letterSpacing: '-1px' }}>
            Discovery <span style={{ color: 'var(--accent-primary)' }}>Terminal</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '0.4rem 0.75rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                🟢 LIVE DATA ACTIVE
             </div>
             <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: aiStatus.status === 'OK' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: aiStatus.status === 'OK' ? '#6366f1' : '#ef4444', padding: '0.4rem 0.75rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <Cpu size={14} /> AI LAYER: {aiStatus.status}
             </div>
          </div>
        </div>
        <button 
           onClick={() => fetchMultibaggersData(true)}
          className="btn refresh-btn"
          disabled={loading}
          style={{
            padding: '1rem 1.75rem',
            borderRadius: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
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
        <div className="responsive-grid">
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
  const bd = stock.breakdown || {};

  return (
    <div className="card-interactive stock-card" style={{
      padding: '1.25rem',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Score Cluster - Top Right */}
      <div style={{ position: 'absolute', top: '1rem', right: '1.25rem', textAlign: 'right' }}>
        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Institutional Score</div>
        <div style={{ 
          fontSize: '1.5rem', fontWeight: '700', color: stock.score >= 80 ? 'var(--success)' : stock.score >= 60 ? 'var(--accent-primary)' : 'var(--text-muted)',
          lineHeight: 1
        }}>
          {stock.score}
        </div>
        <button 
           onClick={async (e) => {
             e.stopPropagation();
             const userStr = localStorage.getItem('user');
             if (!userStr) { toast.error('Please login first.'); return; }
             const user = JSON.parse(userStr);
             const res = await addToWatchlist(user.id, { symbol: stock.ticker || stock.symbol, added_price: stock.currentPrice, source: 'Multibagger' });
             if (res?.success) toast.success(`${stock.ticker || stock.symbol} added!`);
           }}
           style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '0.4rem' }}
        >
           <Bookmark size={14} />
        </button>
      </div>

      {/* Header - Compact */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 
          onClick={() => window.location.href = `/analyse-stock?symbol=${(stock.ticker || stock.symbol)}`}
          style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', cursor: 'pointer' }}
        >
          {(stock.company_name || stock.ticker || 'Stock').replace('.NS', '')}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>₹{stock.currentPrice?.toLocaleString()}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: '700', letterSpacing: '0.5px' }}>LIVE SCAN</span>
        </div>
      </div>

      {/* Probability bar */}
      <div style={{ marginBottom: '1.25rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)' }}>PROBABILITY</span>
            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: stock.score >= 80 ? 'var(--success)' : 'var(--accent-primary)' }}>{stock.score}%</span>
         </div>
         <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stock.score}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ 
                height: '100%', 
                background: stock.score >= 80 ? 'var(--success)' : 'var(--accent-primary)' 
              }} 
            />
         </div>
      </div>

      {/* Metrics Grid - Compact */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
         <div className="metric-item">
            <span className="label">Structure</span>
            <span className="value" style={{ color: stock.near52WeekHigh ? 'var(--success)' : 'inherit' }}>
                {stock.near52WeekHigh ? 'Breakout ↑' : 'Consolidating'}
            </span>
         </div>
         <div className="metric-item">
            <span className="label">Momentum</span>
            <span className="value" style={{ color: stock.trendUp ? 'var(--success)' : 'var(--danger)' }}>
                {stock.trendUp ? 'Bullish' : 'Neutral'}
            </span>
         </div>
      </div>

      {/* Breakdown Toggle */}
      <div style={{ marginBottom: '1.25rem' }}>
         <button 
           onClick={() => setShowExplanation(!showExplanation)}
           style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
         >
            <HelpCircle size={13} /> {showExplanation ? 'HIDE INSIGHTS' : 'VIEW SCORE INSIGHTS'}
         </button>
         
         <AnimatePresence>
           {showExplanation && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               style={{ overflow: 'hidden', marginTop: '0.75rem' }}
             >
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gap: '0.6rem' }}>
                   <ScoreLine label="Momentum" value={bd.momentum?.achieved} max={35} />
                   <ScoreLine label="Structure" value={bd.structure?.achieved} max={20} />
                   <ScoreLine label="AI Quality" value={bd.aiQuality?.achieved} max={25} />
                   <ScoreLine label="Risk" value={bd.risk?.achieved} max={20} />
                </div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button 
            onClick={onAnalyze}
            className="btn"
            style={{ 
              padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
           View Analysis <ChevronRight size={14} />
         </button>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '0.55rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>AI ENGINE</div>
            <div style={{ 
               fontSize: '0.7rem', fontWeight: '700', 
               color: stock.confidence === 'High' ? 'var(--success)' : stock.confidence === 'Fallback' ? 'var(--danger)' : 'var(--accent-primary)' 
            }}>
               {stock.confidence?.toUpperCase()}
            </div>
         </div>
      </div>

      <style>{`
        .stock-card:hover { transform: translateY(-4px); border-color: var(--accent-primary)40 !important; }
        .metric-item { display: flex; flex-direction: column; gap: 0.1rem; }
        .metric-item .label { font-size: 0.55rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
        .metric-item .value { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
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
