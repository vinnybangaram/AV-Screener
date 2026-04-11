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

const Intraday = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState('LONG');
    const [lastScan, setLastScan] = useState(null);

    useEffect(() => {
        loadScan();
        // Auto-refresh every 15 mins during market hours
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
        <div style={{ padding: '2rem 4rem', color: 'var(--text-primary)', background: 'var(--bg-primary)', minHeight: 'calc(100vh - 64px)' }}>

            {/* ── Hero ── */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#22c55e', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.4rem' }}>
                        <Zap size={16} /> Intraday Intelligence Engine
                    </div>
                    <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>
                        Intraday <span style={{ color: '#22c55e' }}>Radar</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
                        High-probability intraday setups · NSE · Long & Short · Auto-refreshes every 15 min
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '0.35rem 0.75rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: '800', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <div style={{ width: '7px', height: '7px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                            {data?.market_open ? 'MARKET OPEN' : 'MARKET CLOSED'}
                        </div>
                        {lastScan && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', padding: '0.35rem 0.75rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: '700', border: '1px solid var(--border-color)' }}>
                                <Clock size={12} /> Last scan: {lastScan}
                            </div>
                        )}
                        {data && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', padding: '0.35rem 0.75rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: '700', border: '1px solid var(--border-color)' }}>
                                <BarChart2 size={12} /> Scanned: {data.total_scanned} stocks
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => loadScan(true)}
                    disabled={loading}
                    style={{ background: '#22c55e', border: 'none', padding: '0.9rem 1.5rem', borderRadius: '14px', color: '#000', fontWeight: '800', fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}
                >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    Refresh Scan
                </button>
            </div>

            {/* ── Long / Short Tabs ── */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem' }}>
                {['LONG', 'SHORT'].map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: '0.6rem 1.75rem', borderRadius: '10px', fontWeight: '800',
                        fontSize: '0.9rem', cursor: 'pointer', border: '1px solid',
                        background: tab === t ? (t === 'LONG' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'transparent',
                        color: tab === t ? (t === 'LONG' ? '#22c55e' : '#ef4444') : 'var(--text-secondary)',
                        borderColor: tab === t ? (t === 'LONG' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--border-color)',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        {t === 'LONG' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {t} ({t === 'LONG' ? data?.longs?.length ?? 0 : data?.shorts?.length ?? 0})
                    </button>
                ))}
            </div>

            {/* ── Feed ── */}
            {loading ? (
                <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                    <div className="discovery-loader" style={{ borderTopColor: '#22c55e' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>⚡ Scanning {UNIVERSE_COUNT} NSE stocks...</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Calculating RSI · VWAP · Volume · Gap · S&R levels
                        </div>
                    </div>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '24px', border: '1px dashed var(--error)' }}>
                    <AlertTriangle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
                    <div style={{ color: 'var(--error)', fontWeight: '700' }}>{error}</div>
                </div>
            ) : stocks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    No high-probability {tab} setups found right now. Try refreshing after 9:15 AM IST.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {stocks.map((stock, i) => (
                        <motion.div key={stock.ticker} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <IntradayCard stock={stock} />
                        </motion.div>
                    ))}
                </div>
            )}

            <p style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                ⚠️ Intraday Radar is an analytical tool only. Not financial advice. Always use strict stop-losses.
            </p>

            <style>{`
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
        .discovery-loader { width:50px; height:50px; border:4px solid rgba(255,255,255,0.05); border-top-color:#22c55e; border-radius:50%; animation:spin 1s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .animate-spin { animation:spin 1s linear infinite; }
      `}</style>
        </div>
    );
};

const UNIVERSE_COUNT = 60;

const IntradayCard = ({ stock }) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const isLong = stock.direction === 'LONG';
    const cfg = CONVICTION_COLOR[stock.conviction] || CONVICTION_COLOR.LOW;
    const dirColor = isLong ? '#22c55e' : '#ef4444';
    const dirBg = isLong ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';

    return (
        <div style={{ background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '1.75rem', position: 'relative', overflow: 'hidden', transition: 'all 0.25s' }}
            className="intraday-card"
        >
            {/* Score badge */}
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: cfg.color, lineHeight: 1 }}>{stock.score}</div>
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
                       source: 'Intraday'
                     });
                     if (res && (res.id || res.success)) {
                       toast.success(`${stock.ticker} added to watchlist!`);
                     } else {
                       toast.error(`Failed to add ${stock.ticker} to watchlist.`);
                     }
                   }
                   }}
                   style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '6px' }}
                   onMouseEnter={e => e.target.style.color = '#22c55e'}
                   onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                   <Bookmark size={16} />
                </button>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: dirBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${dirColor}30` }}>
                    {isLong ? <TrendingUp size={26} color={dirColor} /> : <TrendingDown size={26} color={dirColor} />}
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900' }}>{stock.ticker}</h3>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', background: dirBg, color: dirColor, border: `1px solid ${dirColor}30` }}>
                            {stock.direction}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-secondary)' }}>₹{stock.price}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: stock.gap_pct >= 0 ? '#22c55e' : '#ef4444' }}>
                            {stock.gap_pct >= 0 ? '▲' : '▼'} {Math.abs(stock.gap_pct)}% gap
                        </span>
                    </div>
                </div>
            </div>

            {/* Score bar */}
            <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)' }}>Intraday Probability</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: '900', color: cfg.color }}>{stock.conviction} CONVICTION</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${stock.score}%` }} transition={{ duration: 0.9, ease: 'easeOut' }}
                        style={{ height: '100%', background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`, borderRadius: '99px' }} />
                </div>
            </div>

            {/* Target / SL / RR */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: '800', color: '#22c55e', textTransform: 'uppercase', marginBottom: '2px' }}>
                        <Target size={10} style={{ display: 'inline', marginRight: '3px' }} />Target
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#22c55e' }}>₹{stock.target}</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', marginBottom: '2px' }}>
                        <Shield size={10} style={{ display: 'inline', marginRight: '3px' }} />Stop Loss
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#ef4444' }}>₹{stock.stoploss}</div>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', marginBottom: '2px' }}>R:R Ratio</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#6366f1' }}>{stock.risk_reward}x</div>
                </div>
            </div>

            {/* Key signals */}
            <div style={{ marginBottom: '1.25rem' }}>
                {(stock.signals || []).slice(0, 3).map((s, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <span style={{ flexShrink: 0 }}>→</span>{s}
                    </div>
                ))}
            </div>

            {/* Breakdown toggle */}
            <div style={{ marginBottom: '1.25rem' }}>
                <button onClick={() => setShowBreakdown(!showBreakdown)}
                    style={{ background: 'none', border: 'none', color: dirColor, fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <HelpCircle size={13} /> {showBreakdown ? 'Hide' : 'Show'} Score Breakdown
                </button>

                <AnimatePresence>
                    {showBreakdown && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: '0.75rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'grid', gap: '0.5rem' }}>
                                {Object.entries(stock.breakdown || {}).map(([key, val]) => (
                                    <div key={key}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '3px' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'capitalize' }}>
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                            <span style={{ fontWeight: '900', color: dirColor }}>{val.score}/{val.max}</span>
                                        </div>
                                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px' }}>
                                            <div style={{ height: '100%', width: `${(val.score / val.max) * 100}%`, background: dirColor, borderRadius: '99px', transition: 'width 0.6s ease' }} />
                                        </div>
                                        {val.notes && <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{val.notes}</div>}
                                    </div>
                                ))}
                            </div>

                            {/* RSI / VWAP quick stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {[
                                    { label: 'RSI (14)', value: stock.rsi },
                                    { label: 'VWAP', value: `₹${stock.vwap}` },
                                    { label: 'Support', value: `₹${stock.support}` },
                                    { label: 'Resistance', value: `₹${stock.resistance}` },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '800' }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Vol ratio */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                    Vol: {stock.vol_ratio}x avg · Scanned {stock.scan_time}
                </span>
                {stock.red_flags?.length > 0 && (
                    <span style={{ fontSize: '0.65rem', color: '#f97316', fontWeight: '700' }}>
                        ⚠️ {stock.red_flags.length} flag{stock.red_flags.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <style>{`
        .intraday-card:hover {
          transform: translateY(-4px);
          border-color: ${dirColor}60 !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
      `}</style>
        </div>
    );
};

export default Intraday;