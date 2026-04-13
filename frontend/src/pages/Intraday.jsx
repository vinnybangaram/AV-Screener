import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Clock, Target, Shield, BarChart2, ChevronRight, HelpCircle, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchIntraday, addToWatchlist } from '../services/api';
import toast from 'react-hot-toast';

const CONVICTION_COLOR = {
    HIGH: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
    MEDIUM: { color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)' },
    LOW: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
};

const UNIVERSE_COUNT = 60;

const Intraday = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState('LONG');
    const [lastScan, setLastScan] = useState(null);

    useEffect(() => {
        loadScan();
        const interval = setInterval(loadScan, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const loadScan = async (refresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchIntraday(refresh);
            if (result.success) {
                setData(result.data);
                setLastScan(new Date().toLocaleTimeString('en-IN'));
            } else {
                throw new Error(result.error);
            }
        } catch (e) {
            setError("Intraday engine offline. Is backend running?");
        } finally {
            setLoading(false);
        }
    };

    const stocks = tab === 'LONG'
        ? (data?.longs || [])
        : (data?.shorts || []);

    return (
        <div className="container" style={{ paddingBottom: '4rem', minHeight: 'calc(100vh - 64px)' }}>

            {/* Hero Section */}
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--success)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                        <Zap size={18} /> Intraday Intelligence
                    </div>
                    <h1 className="page-title" style={{ margin: 0, fontWeight: '900', letterSpacing: '-1px' }}>
                        Intraday <span style={{ color: 'var(--success)' }}>Radar</span>
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '0.4rem 0.75rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                            <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                            {data?.market_open ? 'MARKET OPEN' : 'MARKET CLOSED'}
                        </div>
                        {lastScan && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                                Last Scan: {lastScan}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => loadScan(true)}
                    disabled={loading}
                    className="btn refresh-btn"
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(34,197,94,0.2)',
                        opacity: loading ? 0.7 : 1,
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        background: 'var(--success)',
                        color: '#000'
                    }}
                >
                    {loading ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                    Sync Radar
                </button>
            </div>

            {/* Direction Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                {['LONG', 'SHORT'].map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: '0.5rem 1.5rem', borderRadius: '10px', fontWeight: '700',
                        fontSize: '0.85rem', cursor: 'pointer', border: '1px solid',
                        background: tab === t ? (t === 'LONG' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent',
                        color: tab === t ? (t === 'LONG' ? '#22c55e' : '#ef4444') : 'var(--text-secondary)',
                        borderColor: tab === t ? (t === 'LONG' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : 'var(--border-color)',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        {t === 'LONG' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {t} ({t === 'LONG' ? data?.longs?.length ?? 0 : data?.shorts?.length ?? 0})
                    </button>
                ))}
            </div>

            {/* Content Feed */}
            {loading ? (
                <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                    <div className="discovery-loader" style={{ borderTopColor: 'var(--success)' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>⚡ Processing Liquidity Scans...</div>
                    </div>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '24px', border: '1px dashed var(--error)' }}>
                    <AlertTriangle size={48} color="var(--error)" style={{ marginBottom: '1rem', margin: '0 auto' }} />
                    <div style={{ color: 'var(--error)', fontWeight: '700' }}>{error}</div>
                </div>
            ) : (
                <div className="responsive-grid">
                    {stocks.map((stock, i) => (
                        <motion.div key={stock.ticker} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <IntradayCard stock={stock} />
                        </motion.div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
                .discovery-loader { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.05); border-top-color: var(--success); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

const IntradayCard = ({ stock }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const isLong = stock.direction === 'LONG';
    const cfg = CONVICTION_COLOR[stock.conviction] || CONVICTION_COLOR.LOW;
    const dirColor = isLong ? 'var(--success)' : 'var(--danger)';
    const bd = stock.breakdown || {};
    
    return (
        <div 
            className="card-interactive intraday-card"
            style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}
        >
            {/* Score Cluster */}
            <div style={{ position: 'absolute', top: '1rem', right: '1.25rem', textAlign: 'right' }}>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: cfg.color, lineHeight: 1 }}>{stock.score}</div>
                <button 
                   onClick={async (e) => {
                     e.stopPropagation();
                     const userStr = localStorage.getItem('user');
                     if (!userStr) { toast.error('Please login first.'); return; }
                     const user = JSON.parse(userStr);
                     const res = await addToWatchlist(user.id, { symbol: stock.ticker, added_price: stock.price, source: 'Intraday' });
                     if (res?.success) toast.success(`${stock.ticker} added!`);
                   }}
                   style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '0.4rem' }}
                >
                   <Bookmark size={14} />
                </button>
            </div>

            {/* Header */}
            <div style={{ marginBottom: '1.25rem' }}>
                <h3 
                    onClick={() => window.location.href = `/analyse-stock?symbol=${stock.ticker}`}
                    style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', cursor: 'pointer' }}
                >
                    {stock.ticker}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>₹{stock.price}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', background: isLong ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: dirColor }}>
                        {stock.direction}
                    </span>
                </div>
            </div>

            {/* Probability bar */}
            <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)' }}>PROBABILITY</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: cfg.color }}>{stock.conviction}</span>
                </div>
                <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stock.score}%`, background: cfg.color }} />
                </div>
            </div>

            {/* Levels Grid - Borderless */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div className="metric-item">
                    <span className="label" style={{ fontSize: '0.55rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target</span>
                    <span className="value" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--success)' }}>₹{stock.target}</span>
                </div>
                <div className="metric-item">
                    <span className="label" style={{ fontSize: '0.55rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stop Loss</span>
                    <span className="value" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--danger)' }}>₹{stock.stoploss}</span>
                </div>
                <div className="metric-item">
                    <span className="label" style={{ fontSize: '0.55rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>R:R Ratio</span>
                    <span className="value" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-primary)' }}>{stock.risk_reward}x</span>
                </div>
            </div>

            {/* Score Breakdown Section */}
            <div style={{ marginBottom: '1.25rem' }}>
                <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    style={{ background: 'none', border: 'none', color: cfg.color, fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                    <HelpCircle size={13} /> {showBreakdown ? 'HIDE INSIGHTS' : 'VIEW SCORE INSIGHTS'}
                </button>

                <AnimatePresence>
                    {showBreakdown && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '0.75rem', display: 'grid', gap: '0.6rem' }}>
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
                            
                            {/* RSI/VWAP Quick Badges */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {[
                                    { label: 'RSI', val: stock.rsi },
                                    { label: 'VWAP', val: `₹${stock.vwap}` }
                                ].map(m => (
                                    <div key={m.label} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '0.55rem', fontWeight: '700', color: 'var(--text-muted)' }}>{m.label}</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700' }}>{m.val}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Vol: {stock.vol_ratio}x · {stock.scan_time}</span>
                <button 
                  onClick={() => window.location.href = `/analyse-stock?symbol=${stock.ticker}`}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    ANALYZE <ChevronRight size={14} />
                </button>
            </div>

            <style>{`
                .intraday-card:hover { transform: translateY(-4px); border-color: var(--accent-primary)40 !important; }
                .metric-item { display: flex; flex-direction: column; gap: 0.1rem; }
            `}</style>
        </div>
    );
};

export default Intraday;