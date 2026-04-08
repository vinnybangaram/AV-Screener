import React, { useState, useEffect } from 'react';
import { X, Flame, ShieldAlert, TrendingUp, Info, Loader2, Target, Zap, Waves, BarChart3, Star, Cpu, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

const StockAnalysisPanel = ({ isOpen, onClose, stock }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && stock) {
      fetchAnalysis();
    } else {
      setAnalysis(null);
      setError(null);
    }
  }, [isOpen, stock]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/analyze-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: stock.symbol })
      });
      const result = await response.json();
      if (result.success) {
        setAnalysis(result.analysis);
      } else {
        throw new Error(result.error || 'Failed to fetch analysis');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '520px', background: 'var(--card-bg)',
      borderLeft: '1px solid var(--border-color)', boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
      zIndex: 2500, display: 'flex', flexDirection: 'column', color: 'var(--text-primary)',
      backdropFilter: 'blur(10px)', animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '2.5rem 2.5rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '64px', height: '64px', background: 'var(--accent-primary)',
            borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
          }}>
            {stock.score >= 80 ? <Flame size={32} /> : <Target size={32} />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.5px' }}>{stock?.company_name.replace('.NS', '')}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem' }}>
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>{stock?.symbol}</div>
               <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#22c55e' }}>{analysis?.sector || stock?.sector || 'Institutional Discovery'}</div>
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ 
          background: 'rgba(0,0,0,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.6rem', borderRadius: '12px'
        }}>
          <X size={24} />
        </button>
      </div>

      {/* Probability Ribbon */}
      <div style={{ 
        margin: '0 2.5rem 2rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '16px', 
        padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        border: '1px solid rgba(99, 102, 241, 0.15)'
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)' }}>Multibagger Probability</div>
        <div style={{ fontSize: '1.5rem', fontWeight: '950', color: 'var(--accent-primary)' }}>{stock?.score}%</div>
      </div>

      {/* Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 2.5rem 2.5rem' }}>
        {loading ? (
          <div style={{ padding: '6rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem' }}>
             <div className="discovery-spinner"></div>
             <div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.5rem' }}>Activating 3-Layer Logic...</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bypassing API throttles & consulting Gemini LLM</div>
             </div>
          </div>
        ) : error ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '1px dashed var(--error)' }}>
             <AlertTriangle size={48} color="var(--error)" style={{ marginBottom: '1.5rem', margin: '0 auto' }} />
             <div style={{ color: 'var(--error)', fontWeight: '800', fontSize: '1.1rem' }}>{error}</div>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Connection to Intelligence Hub lost. Service may be offline.</p>
          </div>
        ) : analysis ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Context Summary */}
            <section>
              <h3 className="section-title"><Activity size={18} /> Strategic Insight</h3>
              <p className="summary-text">{analysis.summary}</p>
            </section>

            {/* Qualitative Rating (1-10) */}
            <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
               <QualityCard label="Business" value={analysis.business_quality} />
               <QualityCard label="Growth" value={analysis.growth_potential} />
               <QualityCard label="Management" value={analysis.management_quality} />
            </section>

            {/* Growth Narrative & Risks */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
               <div className="narrative-box">
                  <div className="header"><TrendingUp size={16} /> Market Outlook</div>
                  <div className="content">{analysis.verdict} outlook for the short-to-medium term.</div>
               </div>
               <div className="risk-box">
                  <div className="header"><ShieldAlert size={16} /> Potential Risks</div>
                  <div className="content">{analysis.risks}</div>
               </div>
            </div>

            {/* AI Confidence Indicator */}
            <div style={{ 
               padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)',
               display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Cpu size={20} color="var(--text-secondary)" />
                  <div>
                     <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)' }}>INTELLIGENCE LAYER</div>
                     <div style={{ fontSize: '0.85rem', fontWeight: '800' }}>{analysis.confidence === 'High' ? 'Gemini 1.5 Flash (Optimized)' : 'Analytic Fallback Logic'}</div>
                  </div>
               </div>
               <div style={{ 
                  padding: '4px 12px', background: analysis.confidence === 'High' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '30px', fontSize: '0.7rem', fontWeight: '900', color: analysis.confidence === 'High' ? '#22c55e' : '#ef4444'
               }}>
                  {analysis.confidence}
               </div>
            </div>

          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .discovery-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255,255,255,0.05);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .section-title {
          font-size: 0.95rem; font-weight: 850; margin: 0 0 1rem 0;
          display: flex; alignItems: center; gap: 0.6rem; color: var(--text-primary);
        }
        .summary-text {
          font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); margin: 0;
        }
        .narrative-box, .risk-box {
          border-radius: 20px;
          padding: 1.25rem;
          border: 1px solid var(--border-color);
        }
        .narrative-box .header { font-size: 0.8rem; font-weight: 850; color: #22c55e; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; }
        .risk-box .header { font-size: 0.8rem; font-weight: 850; color: #ef4444; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; }
        .narrative-box .content, .risk-box .content { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }
        .narrative-box { background: rgba(34, 197, 94, 0.03); }
        .risk-box { background: rgba(239, 68, 68, 0.03); }
      `}</style>
    </div>
  );
};

const QualityCard = ({ label, value }) => (
  <div style={{ 
    background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '18px', border: '1px solid var(--border-color)',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '1.25rem', fontWeight: '900', color: value >= 8 ? '#22c55e' : value >= 5 ? '#6366f1' : '#f59e0b' }}>
      {value} / 10
    </div>
  </div>
);

export default StockAnalysisPanel;
