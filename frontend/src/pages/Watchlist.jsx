import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, TrendingUp, TrendingDown, Edit3, Trash2, ChevronRight, Plus, Filter, Search, Clock, Activity } from 'lucide-react';
import { fetchWatchlist, updateWatchlist, removeFromWatchlist } from '../services/api';
import toast from 'react-hot-toast';

const Watchlist = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        loadWatchlist();
    }, []);

    const loadWatchlist = async () => {
        setLoading(true);
        try {
            const result = await fetchWatchlist();
            if (Array.isArray(result)) {
                setWatchlist(result);
            } else if (result && result.detail) {
                toast.error(result.detail);
            }
        } catch (error) {
            console.error("Failed to load watchlist:", error);
            toast.error("Could not connect to watchlist service.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id, data) => {
        try {
            await updateWatchlist(id, data);
            toast.success('Strategy updated');
            loadWatchlist();
        } catch (e) {
            toast.error('Failed to update strategy');
        }
    };

    const handleRemove = async (id) => {
        const promise = removeFromWatchlist(id);
        toast.promise(promise, {
            loading: 'Archiving position to history...',
            success: 'Position archived. Historical snapshots preserved.',
            error: 'Failed to archive',
        });
        await promise;
        loadWatchlist();
    };

    const filteredWatchlist = activeTab === 'All' 
        ? watchlist 
        : watchlist.filter(item => {
            if (!item.category) return false;
            const cat = item.category.toLowerCase();
            const tab = activeTab.toLowerCase();
            return cat.includes(tab) || tab.includes(cat);
        });

    const tabs = ['All', 'Multibagger', 'Intraday', 'Penny', 'Manual'];

    return (
        <div className="container" style={{ paddingBottom: '4rem', color: 'var(--text-primary)', maxWidth: '1400px' }}>
            <div style={{ marginBottom: '3rem', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <Activity size={16} /> Asset Intelligence Center
                </div>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px' }}>
                    Tracking <span className="text-gradient">Portfolio Memory</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: '500' }}>
                    Automatic historical price capture for every tracked opportunity
                </p>
            </div>

            {/* Tabs */}
            <div className="desktop-tabs-container" style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                {tabs.map(tab => {
                    const count = tab === 'All' 
                        ? watchlist.length 
                        : watchlist.filter(item => {
                            if (!item.category) return false;
                            const cat = item.category.toLowerCase();
                            const t = tab.toLowerCase();
                            return cat.includes(t) || t.includes(cat);
                        }).length;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: 'none', border: 'none', padding: '0.75rem 1.5rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
                                color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
                                fontWeight: '800', cursor: 'pointer', position: 'relative',
                                transition: 'all 0.3s'
                            }}
                        >
                            {tab}
                            <span style={{ 
                                background: activeTab === tab ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)', 
                                color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
                                padding: '2px 8px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: '900',
                                border: `1px solid ${activeTab === tab ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)'}`
                            }}>
                                {count}
                            </span>
                            {activeTab === tab && (
                                <motion.div layoutId="watchlist-tab-line" style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '3px', background: 'var(--accent-primary)', borderRadius: '10px 10px 0 0' }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem' }}><div className="loader-ring" /></div>
            ) : filteredWatchlist.length === 0 ? (
                <div className="card glass-card shadow-glow" style={{ textAlign: 'center', padding: '6rem 2rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div className="empty-icon-pulse" style={{ fontSize: '4rem', marginBottom: '2rem' }}>💎</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Memory Cache Empty</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>
                        Add stocks from discover modules. The system will immediately begin historical tracking.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                    <AnimatePresence>
                        {filteredWatchlist.map((item, i) => (
                            <WatchlistCard 
                                key={item.id} 
                                item={item} 
                                onUpdate={(data) => handleUpdate(item.id, data)}
                                onRemove={() => handleRemove(item.id)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <style>{`
                .glass-card {
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .shadow-glow {
                    box-shadow: 0 0 40px -10px rgba(99, 102, 241, 0.1);
                }
                .text-gradient {
                    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .empty-icon-pulse {
                    animation: float 3s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
            `}</style>
        </div>
    );
};

const WatchlistCard = ({ item, onUpdate, onRemove }) => {
    const isUp = item.latest_pnl_percent >= 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card-interactive glass-card"
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
        >
            {/* Background Glow based on performance */}
            <div style={{ 
                position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', 
                background: isUp ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                filter: 'blur(60px)', borderRadius: '50%', zIndex: 0
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                <div>
                    <h3 
                        onClick={() => window.location.href = `/analyse-stock?symbol=${item.symbol}`}
                        style={{ margin: 0, fontSize: '1.35rem', fontWeight: '900', cursor: 'pointer', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}
                    >
                        {item.symbol}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: '950', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            {item.category}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={10} /> {new Date(item.added_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: '950', color: isUp ? '#22c55e' : '#ef4444', letterSpacing: '-0.5px' }}>
                        {isUp ? '+' : ''}{Number(item.latest_pnl_percent || 0).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', opacity: 0.6, color: isUp ? '#22c55e' : '#ef4444' }}>
                        {isUp ? '↑' : '↓'} ₹{formatNumber(Math.abs(item.latest_pnl || 0))}
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                <div className="metric-item">
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Memory Entry</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>₹{formatNumber(item.entry_price || 0)}</span>
                </div>
                <div className="metric-item">
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pulse Price</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>₹{formatNumber(item.latest_price || 0)}</span>
                </div>
            </div>

            {/* Risk Control */}
            <div style={{ 
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', 
                padding: '1.25rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)'
            }}>
                <div className="metric-item">
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '4px', letterSpacing: '0.8px' }}>STOP LOSS ENGINE</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#ef4444' }}>
                        {item.stop_loss ? `₹${formatNumber(item.stop_loss)}` : '---'}
                    </div>
                </div>
                <div className="metric-item">
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '4px', letterSpacing: '0.8px' }}>PROFIT TARGET</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#22c55e' }}>
                        {item.target_price ? `₹${formatNumber(item.target_price)}` : '---'}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', position: 'relative', zIndex: 1 }}>
                <button 
                  onClick={() => window.location.href = `/analyse-stock?symbol=${item.symbol}`}
                  className="track-btn"
                  style={{ 
                      background: 'var(--accent-primary)', border: 'none', color: 'white', 
                      fontSize: '0.75rem', fontWeight: '900', cursor: 'pointer', 
                      display: 'flex', alignItems: 'center', gap: '0.4rem', 
                      padding: '0.5rem 1.25rem', borderRadius: '8px', transition: 'all 0.3s'
                  }}>
                    INTEL ANALYSIS <ChevronRight size={14} />
                </button>
                <button 
                    onClick={onRemove}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: '700' }}
                    onMouseEnter={e => e.target.style.color = 'var(--danger)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                >
                    <Trash2 size={14} /> Archive
                </button>
            </div>
            <style>{`
                .metric-item { display: flex; flex-direction: column; gap: 0.1rem; }
                .track-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
            `}</style>
        </motion.div>
    );
};

const formatNumber = (val, decimals = 2) => {
    if (val === undefined || val === null || isNaN(val)) return "0.00";
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export default Watchlist;
