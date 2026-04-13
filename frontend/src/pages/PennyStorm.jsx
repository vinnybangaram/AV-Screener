import React, { useState, useEffect } from 'react';
import {
    Zap, Flame, Cpu, TrendingUp, RefreshCw,
    ChevronRight, AlertTriangle, HelpCircle,
    ShieldAlert, Gem, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import StockAnalysisPanel from '../components/StockAnalysisPanel';
import { fetchPennyStorm, fetchAiStatus, addToWatchlist } from '../services/api';

const VERDICT_CONFIG = {
    'STORM READY': { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', emoji: '🟢' },
    'BREWING': { color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)', emoji: '🟡' },
    'DRIZZLE': { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)', emoji: '🟠' },
    'DRY': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', emoji: '🔴' },
};

const PennyStorm = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStock, setSelected] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [aiStatus, setAiStatus] = useState({ status: 'OK' });
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        loadStocks();
        fetchAiStatus().then(setAiStatus);
    }, []);

    const loadStocks = async (refresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchPennyStorm(refresh);
            if (result.success) {
                setStocks(result.data);
            } else {
                throw new Error(result.error || 'Failed to fetch');
            }
        } catch (err) {
            setError("Penny Storm engine is offline. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = (stock) => {
        setSelected(stock);
        setIsPanelOpen(true);
    };

    const FILTERS = ['ALL', 'STORM READY', 'BREWING', 'DRIZZLE', 'DRY'];

    const filtered = filter === 'ALL'
        ? stocks
        : stocks.filter(s => s.verdict === filter);

    return (
    <div className="container" style={{
        paddingBottom: '4rem',
        color: 'var(--text-primary)',
        background: 'var(--bg-primary)',
        minHeight: 'calc(100vh - 64px)'
    }}>

        {/* ── Hero ── */}
        <div className="hero-section" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    color: '#eab308', fontWeight: 'bold', marginBottom: '0.5rem',
                    fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1.5px'
                }}>
                    <Zap size={18} /> Penny Storm Intelligence Engine
                </div>
                <h1 className="page-title" style={{ margin: 0, fontWeight: '900', letterSpacing: '-1px' }}>
                    Storm <span style={{ color: '#eab308' }}>Radar</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                    Under ₹100 · High-probability rankings
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                    <div className="badge-live">
                        🟢 LIVE SCAN
                    </div>
                </div>
            </div>

            <button
                onClick={() => loadStocks(true)}
                disabled={loading}
                className="btn-storm refresh-btn"
                style={{
                    padding: '1rem 1.75rem',
                    borderRadius: '16px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 24px rgba(234,179,8,0.3)',
                    opacity: loading ? 0.7 : 1
                }}
            >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                Run Storm Scan
            </button>
        </div>

        {/* ── Verdict Filter Tabs ── */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {FILTERS.map(v => {
                const cfg = VERDICT_CONFIG[v];
                const isActive = filter === v;
                return (
                    <button
                        key={v}
                        onClick={() => setFilter(v)}
                        style={{
                            padding: '0.5rem 1.25rem', borderRadius: '30px', fontSize: '0.8rem',
                            fontWeight: '800', cursor: 'pointer', border: '1px solid',
                            background: isActive ? (cfg?.bg || 'rgba(255,255,255,0.1)') : 'transparent',
                            color: isActive ? (cfg?.color || 'var(--text-primary)') : 'var(--text-secondary)',
                            borderColor: isActive ? (cfg?.border || 'var(--border-color)') : 'var(--border-color)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cfg?.emoji || '⚡'} {v}
                    </button>
                );
            })}
        </div>

        {/* ── Feed ── */}
        {loading ? (
            <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                <div className="discovery-loader" style={{ borderTopColor: '#eab308' }} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>⚡ Scanning market...</div>
                </div>
            </div>
        ) : error ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '24px', border: '1px dashed var(--error)' }}>
                <AlertTriangle size={64} color="var(--error)" style={{ marginBottom: '1.5rem' }} />
                <div style={{ color: 'var(--error)', fontSize: '1.25rem', fontWeight: '700' }}>{error}</div>
            </div>
        ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                No stocks found.
            </div>
        ) : (
            <div className="responsive-grid">
                {filtered.map((stock, i) => (
                    <motion.div
                        key={stock.ticker}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <StormCard stock={stock} onAnalyze={() => handleAnalyze(stock)} />
                    </motion.div>
                ))}
            </div>
        )}

            {/* ── Analysis Panel (reuses your existing component) ── */}
            <StockAnalysisPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                stock={selectedStock}
            />

            <style>{`
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        .discovery-loader {
          width: 50px; height: 50px;
          border: 4px solid var(--accent-secondary);
          border-top-color: #eab308;
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.5,0,0.5,1) infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .refresh-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(234,179,8,0.4); }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
        </div>
    );
};


/* ─────────────────────────────────────────────
   StormCard — matches StockCard style exactly
───────────────────────────────────────────── */
const StormCard = ({ stock, onAnalyze }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const cfg = VERDICT_CONFIG[stock.verdict] || VERDICT_CONFIG['DRY'];
    const bd = stock.breakdown || {};

    return (
        <div className="card-interactive storm-card" style={{
            padding: '2rem',
            transition: 'all 0.3s ease'
        }}>

            {/* Glow for Storm Ready */}
            {stock.verdict === 'STORM READY' && (
                <div style={{
                    position: 'absolute', top: '-50px', right: '-50px',
                    width: '150px', height: '150px',
                    background: '#eab308', opacity: 0.06,
                    filter: 'blur(50px)', borderRadius: '50%'
                }} />
            )}

            {/* Score — top right (same as StockCard) */}
            <div style={{ position: 'absolute', top: '1.75rem', right: '1.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    Storm Score
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '950', color: cfg.color, lineHeight: '1', letterSpacing: '-1px' }}>
                    {stock.score}
                </div>
                <button 
                   onClick={async (e) => {
                     e.stopPropagation();
                   const userStr = localStorage.getItem('user');
                   if (!userStr) {
                     toast.error('Please login to add stocks to your watchlist.');
                     return;
                   }
                   const user = JSON.parse(userStr);
                   if (user && user.id) {
                     const res = await addToWatchlist(user.id, {
                       symbol: stock.ticker,
                       added_price: stock.price,
                       source: 'PennyStorm'
                     });
                     if (res && (res.id || res.success)) {
                       toast.success(`${stock.ticker} added to watchlist!`);
                     } else {
                       toast.error(`Failed to add ${stock.ticker} to watchlist.`);
                     }
                   }
                   }}
                   style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '8px' }}
                   onMouseEnter={e => e.target.style.color = '#eab308'}
                   onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                   <Bookmark size={18} />
                </button>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
                <div>
                    <h3 
                        onClick={() => window.location.href = `/analyse-stock?symbol=${stock.ticker}`}
                        style={{ margin: 0, fontSize: '1.35rem', fontWeight: '900', letterSpacing: '-0.5px', cursor: 'pointer', color: 'var(--text-primary)' }}
                        onMouseEnter={e => e.target.style.color = '#eab308'}
                        onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}
                    >
                        {stock.ticker}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                            ₹{stock.price?.toLocaleString() ?? '—'}
                        </span>
                        <span style={{ height: '4px', width: '4px', background: 'var(--border-color)', borderRadius: '50%' }} />
                        <span style={{
                            fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px',
                            borderRadius: '20px', background: cfg.bg, color: cfg.color
                        }}>
                            {cfg.emoji} {stock.verdict}
                        </span>
                    </div>
                </div>
            </div>

            {/* Storm Score Bar */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)' }}>Storm Probability</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-primary)' }}>{stock.score}/100</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stock.score}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', background: `linear-gradient(90deg, ${cfg.color}88 0%, ${cfg.color} 100%)` }}
                    />
                </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card-stat metric-item">
                    <span className="label">Risk Level</span>
                    <span className="value" style={{ color: stock.risk_level === 'Low' ? '#22c55e' : stock.risk_level === 'Extreme' ? '#ef4444' : '#eab308' }}>
                        {stock.risk_level || '—'}
                    </span>
                </div>
                <div className="card-stat metric-item">
                    <span className="label">Sector</span>
                    <span className="value">{stock.sector || '—'}</span>
                </div>
                <div className="card-stat metric-item">
                    <span className="label">Suggested Action</span>
                    <span className="value" style={{ fontSize: '0.75rem' }}>{stock.suggested_action || '—'}</span>
                </div>
                <div className="card-stat metric-item">
                    <span className="label">Change</span>
                    <span className="value" style={{ color: (stock.change_pct ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                        {(stock.change_pct ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(stock.change_pct ?? 0).toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* One-liner */}
            {stock.one_liner && (
                <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
                    borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.5rem',
                    fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic'
                }}>
                    "{stock.one_liner}"
                </div>
            )}

            {/* Score Breakdown toggle */}
            <div style={{ marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    style={{ background: 'none', border: 'none', color: cfg.color, fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                    <HelpCircle size={14} /> {showBreakdown ? 'Hide Breakdown' : 'Show Score Breakdown'}
                </button>

                <AnimatePresence>
                    {showBreakdown && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden', marginTop: '1rem' }}
                        >
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'grid', gap: '0.75rem' }}>
                                {Object.entries(bd).map(([key, val]) => (
                                    <StormScoreLine
                                        key={key}
                                        label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        value={val.score ?? 0}
                                        max={val.max ?? 25}
                                        notes={val.notes}
                                        color={cfg.color}
                                    />
                                ))}
                            </div>

                            {/* Red / Green flags */}
                            {(stock.red_flags?.length > 0 || stock.green_flags?.length > 0) && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                                    <div style={{ background: 'rgba(239,68,68,0.05)', borderRadius: '12px', padding: '0.75rem', border: '1px solid rgba(239,68,68,0.15)' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#ef4444', marginBottom: '0.5rem' }}>🚨 RED FLAGS</div>
                                        {(stock.red_flags || []).map((f, i) => (
                                            <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>• {f}</div>
                                        ))}
                                    </div>
                                    <div style={{ background: 'rgba(34,197,94,0.05)', borderRadius: '12px', padding: '0.75rem', border: '1px solid rgba(34,197,94,0.15)' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#22c55e', marginBottom: '0.5rem' }}>✅ GREEN FLAGS</div>
                                        {(stock.green_flags || []).map((f, i) => (
                                            <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>• {f}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* CTA — same style as StockCard */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={onAnalyze}
                    className="btn-storm action-btn"
                    style={{
                        flex: 1, padding: '1rem',
                        borderRadius: '14px',
                        cursor: 'pointer',
                    }}
                >
                    Full Storm Analysis <ChevronRight size={18} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '900', color: 'var(--text-secondary)' }}>SECTOR TREND</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '900', color: cfg.color }}>
                        {stock.sector_tailwind ? '↑ Tailwind' : 'Neutral'}
                    </div>
                </div>
            </div>

            <style>{`
        .storm-card:hover {
          transform: translateY(-8px);
          border-color: ${cfg.color};
          box-shadow: 0 16px 40px rgba(0,0,0,0.3);
        }
        .metric-item {
          padding: 0.75rem 1rem; border-radius: 14px;
          display: flex; flex-direction: column; gap: 0.25rem;
        }
        .metric-item .label { font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; }
        .metric-item .value { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); }
        .action-btn:hover { filter: brightness(1.1); }
      `}</style>
        </div>
    );
};

const StormScoreLine = ({ label, value, max, notes, color }) => (
    <div style={{ display: 'grid', gap: '0.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>{label}</span>
            <span style={{ fontWeight: '900', color }}>{value}/{max}</span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
        </div>
        {notes && <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{notes}</div>}
    </div>
);

export default PennyStorm;