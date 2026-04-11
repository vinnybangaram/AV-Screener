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
        : watchlist.filter(item => item.source.toLowerCase() === activeTab.toLowerCase());

    const tabs = ['All', 'Multibagger', 'Intraday', 'Penny', 'Custom'];

    return (
        <div style={{ padding: '2rem 4rem', color: 'var(--text-primary)' }}>
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <Bookmark size={16} /> Portfolio & Tracking
                </div>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>
                    My <span style={{ color: 'var(--accent-primary)' }}>Watchlist</span>
                </h1>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: 'none', border: 'none', padding: '0.75rem 1.5rem',
                            color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontWeight: '700', cursor: 'pointer', position: 'relative',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div layoutId="watchlist-tab" style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '2px', background: 'var(--accent-primary)' }} />
                        )}
                    </button>
                ))}
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
        </div>
    );
};

const WatchlistCard = ({ item, onUpdate, onRemove, delay }) => {
    const isUp = item.profit_loss_abs >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="card-interactive"
            style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>{item.symbol}</h3>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase' }}>
                        Source: {item.source}
                    </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: isUp ? '#22c55e' : '#ef4444' }}>
                        {isUp ? '+' : ''}{(item.profit_loss_pct || 0).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        ₹{(item.profit_loss_abs || 0).toFixed(2)}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card-stat">
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '700' }}>ENTRY PRICE</span>
                    <span style={{ fontSize: '1rem', fontWeight: '800' }}>₹{(item.added_price || 0).toFixed(2)}</span>
                </div>
                <div className="card-stat">
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '700' }}>CURRENT PRICE</span>
                    <span style={{ fontSize: '1rem', fontWeight: '800' }}>₹{(item.current_price || 0).toFixed(2)}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', marginBottom: '4px' }}>STOP LOSS (SL)</div>
                    <EditableValue 
                        value={item.stop_loss} 
                        onChange={(val) => onUpdate({ stop_loss: val })} 
                        prefix="₹"
                        color="#ef4444"
                    />
                </div>
                <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', marginBottom: '4px' }}>TARGET PRICE</div>
                    <EditableValue 
                        value={item.target_price} 
                        onChange={(val) => onUpdate({ target_price: val })} 
                        prefix="₹"
                        color="#22c55e"
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Added: {new Date(item.added_date).toLocaleDateString()}</span>
                <button 
                    onClick={onRemove}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                    onMouseEnter={e => e.target.style.color = '#ef4444'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                    <Trash2 size={14} /> Remove
                </button>
            </div>
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
