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
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(234,179,8,0.2)',
                    opacity: loading ? 0.7 : 1,
                    fontSize: '0.85rem',
                    fontWeight: '600'
                }}
            >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
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
        <div 
            className="card-interactive storm-card" 
            style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}
        >
            {/* Score Cluster - Top Right */}
            <div style={{ position: 'absolute', top: '1rem', right: '1.25rem', textAlign: 'right' }}>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Storm Score</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: cfg.color, lineHeight: 1 }}>{stock.score}</div>
                <button 
                   onClick={async (e) => {
                     e.stopPropagation();
                     const userStr = localStorage.getItem('user');
                     if (!userStr) { toast.error('Please login first.'); return; }
                     const user = JSON.parse(userStr);
                     const res = await addToWatchlist({ 
                       symbol: stock.ticker, 
                       added_price: stock.price, 
                       source_module: 'PennyStorm', 
                       category: 'Penny' 
                     });
                     if (res?.success) toast.success(`${stock.ticker} added!`);
                   }}
                   style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '0.4rem' }}
                >
                   <Bookmark size={14} />
                </button>
            </div>

            {/* Header - Compact */}
            <div style={{ marginBottom: '1.25rem' }}>
                <h3 
                    onClick={() => window.location.href = `/analyse-stock?symbol=${stock.ticker}`}
                    style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', cursor: 'pointer' }}
                >
                    {stock.ticker}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>₹{stock.price}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', background: cfg.bg, color: cfg.color, textTransform: 'uppercase' }}>
                        {stock.verdict}
                    </span>
                </div>
            </div>

            {/* Probability Progress Bar */}
            <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)' }}>STORM PROBABILITY</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', color: cfg.color }}>{stock.score}%</span>
                </div>
                <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stock.score}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', background: cfg.color }}
                    />
                </div>
            </div>

            {/* Metrics Grid- Compact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div className="metric-item">
                    <span className="label">Risk Level</span>
                    <span className="value" style={{ color: stock.risk_level === 'Low' ? 'var(--success)' : stock.risk_level === 'Extreme' ? 'var(--danger)' : cfg.color }}>
                        {stock.risk_level || '—'}
                    </span>
                </div>
                <div className="metric-item">
                    <span className="label">Sector</span>
                    <span className="value">{stock.sector || '—'}</span>
                </div>
                <div className="metric-item">
                    <span className="label">Change 24h</span>
                    <span className="value" style={{ color: (stock.change_pct ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {(stock.change_pct ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(stock.change_pct ?? 0).toFixed(2)}%
                    </span>
                </div>
                <div className="metric-item">
                   <span className="label">Radar</span>
                   <span className="value" style={{ color: stock.sector_tailwind ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {stock.sector_tailwind ? 'Tailwind ↑' : 'Neutral'}
                   </span>
                </div>
            </div>

            {/* One-liner Highlight */}
            {stock.one_liner && (
                <div style={{
                    background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', padding: '0.6rem 0.8rem', marginBottom: '1.25rem',
                    fontSize: '0.75rem', color: 'var(--text-secondary)', borderLeft: `3px solid ${cfg.color}`
                }}>
                    {stock.one_liner}
                </div>
            )}

            {/* Breakdown Toggle */}
            <div style={{ marginBottom: '1.25rem' }}>
                <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    style={{ background: 'none', border: 'none', color: cfg.color, fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                    <HelpCircle size={13} /> {showBreakdown ? 'HIDE INSIGHTS' : 'VIEW SCORE INSIGHTS'}
                </button>

                <AnimatePresence>
                    {showBreakdown && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: '0.75rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'grid', gap: '0.6rem' }}>
                                {Object.entries(bd).map(([key, val]) => (
                                    <div key={key}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '3px' }}>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}</span>
                                            <span style={{ fontWeight: '800', color: cfg.color }}>{val.score}/{val.max}</span>
                                        </div>
                                        <div style={{ height: '3px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${(val.score / val.max) * 100}%`, background: cfg.color }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Action Footer */}
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
                <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                    SCAN: {stock.suggested_action}
                </div>
            </div>

            <style>{`
                .storm-card:hover { transform: translateY(-4px); border-color: ${cfg.color}40 !important; }
                .metric-item { display: flex; flex-direction: column; gap: 0.1rem; }
                .metric-item .label { font-size: 0.55rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
                .metric-item .value { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
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