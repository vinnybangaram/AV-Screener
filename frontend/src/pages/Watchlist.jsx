import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, TrendingUp, TrendingDown, Edit3, Trash2, ChevronRight, Plus, Filter, Search } from 'lucide-react';
import { fetchWatchlist, updateWatchlist, removeFromWatchlist } from '../services/api';
import toast from 'react-hot-toast';

const Watchlist = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        // Sync with local storage user_id from auth
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
            setUserId(user.id);
            loadWatchlist(user.id);
        }
    }, []);

    const loadWatchlist = async (uid) => {
        if (!uid) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const result = await fetchWatchlist(uid);
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
            await updateWatchlist(userId, id, data);
            toast.success('Strategy updated');
            loadWatchlist(userId);
        } catch (e) {
            toast.error('Failed to update strategy');
        }
    };

    const handleRemove = async (id) => {
        const promise = removeFromWatchlist(userId, id);
        toast.promise(promise, {
            loading: 'Removing from watchlist...',
            success: 'Removed from watchlist',
            error: 'Failed to remove',
        });
        await promise;
        loadWatchlist(userId);
    };

    const filteredWatchlist = activeTab === 'All' 
        ? watchlist 
        : watchlist.filter(item => {
            if (!item.source) return false;
            const src = item.source.toLowerCase();
            const tab = activeTab.toLowerCase();
            return src.includes(tab) || tab.includes(src);
        });

    const tabs = ['All', 'Multibagger', 'Intraday', 'Penny', 'Custom'];

    return (
        <div className="container" style={{ paddingBottom: '4rem', color: 'var(--text-primary)' }}>
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <Bookmark size={16} /> Portfolio & Tracking
                </div>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>
                    My <span style={{ color: 'var(--accent-primary)' }}>Watchlist</span>
                </h1>
            </div>

            {/* Tabs */}
            {/* Mobile Dropdown */}
            <div className="mobile-dropdown-container">
                <select 
                    value={activeTab} 
                    onChange={(e) => setActiveTab(e.target.value)} 
                    className="mobile-dropdown"
                >
                    {tabs.map(tab => {
                        const count = tab === 'All' ? watchlist.length : watchlist.filter(item => {
                            if (!item.source) return false;
                            const src = item.source.toLowerCase();
                            const t = tab.toLowerCase();
                            return src.includes(t) || t.includes(src);
                        }).length;
                        return (
                            <option key={tab} value={tab}>{tab} ({count})</option>
                        );
                    })}
                </select>
            </div>

            {/* Desktop Tabs */}
            <div className="desktop-tabs-container" style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {tabs.map(tab => {
                    const count = tab === 'All' 
                        ? watchlist.length 
                        : watchlist.filter(item => {
                            if (!item.source) return false;
                            const src = item.source.toLowerCase();
                            const t = tab.toLowerCase();
                            return src.includes(t) || t.includes(src);
                        }).length;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: 'none', border: 'none', padding: '0.75rem 1.5rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
                                color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                fontWeight: '700', cursor: 'pointer', position: 'relative',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab}
                            <span style={{ 
                                background: activeTab === tab ? 'var(--accent-primary)' : 'var(--bg-card-elevated)', 
                                color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                                padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800',
                                border: `1px solid ${activeTab === tab ? 'var(--accent-primary)' : 'var(--border-color)'}`
                            }}>
                                {count}
                            </span>
                            {activeTab === tab && (
                                <motion.div layoutId="watchlist-tab" style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', background: 'var(--accent-primary)' }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem' }}><div className="loader-ring" /></div>
            ) : filteredWatchlist.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '5rem', border: '1px dashed var(--border-color)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📥</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-secondary)' }}>No stocks in this category</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Add stocks from discovery modules to track them here.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {filteredWatchlist.map((item, i) => (
                        <WatchlistCard 
                            key={item.id} 
                            item={item} 
                            onUpdate={(data) => handleUpdate(item.id, data)}
                            onRemove={() => handleRemove(item.id)}
                            delay={i * 0.05} 
                        />
                    ))}
                </div>
            )}

            <style>{`
                .mobile-dropdown-container { display: none; }
                .mobile-dropdown {
                    width: 100%; padding: 0.75rem; border-radius: 8px;
                    background: var(--bg-card); color: var(--text-primary);
                    border: 1px solid var(--border-color); margin-bottom: 2rem;
                    font-weight: 700; cursor: pointer; font-size: 0.9rem;
                    outline: none;
                }
                .mobile-dropdown:focus { border-color: var(--accent-primary); }
                @media (max-width: 768px) {
                    .mobile-dropdown-container { display: block; }
                    .desktop-tabs-container { display: none !important; }
                }
            `}</style>

            <div style={{ marginTop: '4rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: '700' }}>
                    🛡️ <span style={{ color: 'var(--accent-primary)' }}>AUTO SL & TARGET ENGINE:</span> All risk parameters are automatically calculated based on asset volatility and strategy category.
                </p>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    SL & Target are system-generated estimates, not financial advice. Equity markets carry risk.
                </div>
            </div>
        </div>
    );
};

const WatchlistCard = ({ item, onUpdate, onRemove, delay }) => {
    const isUp = item.profit_loss_abs >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="card-interactive"
            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}
        >
            {/* Header - Compact */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                    <h3 
                        onClick={() => window.location.href = `/analyse-stock?symbol=${item.symbol}`}
                        style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', cursor: 'pointer', color: 'var(--text-primary)' }}
                        onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'}
                        onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}
                    >
                        {item.symbol}
                    </h3>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', marginTop: '0.15rem', textTransform: 'uppercase' }}>
                        {item.source} · {new Date(item.added_date).toLocaleDateString()}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: isUp ? 'var(--success)' : 'var(--danger)' }}>
                        {isUp ? '↑' : '↓'} {Number(item.profit_loss_pct || 0).toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Price Row - Clean Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="metric-item">
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Entry Price</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>₹{Number(item.added_price || 0).toFixed(2)}</span>
                </div>
                <div className="metric-item">
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Market Price</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>₹{Number(item.current_price || 0).toFixed(2)}</span>
                </div>
            </div>

            {/* System Levels - Borderless & Tight */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div className="metric-item">
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '2px', letterSpacing: '0.4px' }}>AUTO STOP-LOSS</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--danger)' }}>
                        {item.stop_loss ? `₹${Number(item.stop_loss).toFixed(2)}` : '---'}
                    </div>
                </div>
                <div className="metric-item">
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: '800', marginBottom: '2px', letterSpacing: '0.4px' }}>AUTO TARGET</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--success)' }}>
                        {item.target_price ? `₹${Number(item.target_price).toFixed(2)}` : '---'}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem' }}>
                <button 
                  onClick={() => window.location.href = `/analyse-stock?symbol=${item.symbol}`}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    TRACK <ChevronRight size={14} />
                </button>
                <button 
                    onClick={onRemove}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}
                    onMouseEnter={e => e.target.style.color = 'var(--danger)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                >
                    <Trash2 size={12} /> Delete
                </button>
            </div>
            <style>{`
                .metric-item { display: flex; flex-direction: column; gap: 0.1rem; }
            `}</style>
        </motion.div>
    );
};

const EditableValue = ({ value, onChange, prefix = '', color = 'inherit' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');

    if (isEditing) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                    type="number" 
                    value={tempValue} 
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={() => {
                        setIsEditing(false);
                        onChange(parseFloat(tempValue));
                    }}
                    autoFocus
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--accent)', color: 'white', fontSize: '0.85rem', width: '80px', borderRadius: '4px', padding: '2px 4px' }}
                />
            </div>
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '800', color: value ? color : 'var(--text-secondary)' }}
        >
            {value ? `${prefix}${parseFloat(value).toFixed(2)}` : 'Set Price'} <Edit3 size={12} opacity={0.5} />
        </div>
    );
};

export default Watchlist;
