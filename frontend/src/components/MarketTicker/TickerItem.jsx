import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TickerItem = ({ item }) => {
    const navigate = useNavigate();
    const isUp = item.change_pct >= 0;
    
    return (
        <div 
            onClick={() => navigate(`/analyse-stock?symbol=${item.symbol}`)}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 24px',
                cursor: 'pointer',
                borderRight: '1px solid var(--border-color)',
                height: '100%',
                transition: 'background 0.2s'
            }}
            className="ticker-item"
        >
            <span style={{ fontWeight: '900', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                {item.symbol}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '800', 
                color: isUp ? 'var(--success)' : 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isUp ? '+' : ''}{item.change_pct}%
            </span>
            
            <style jsx>{`
                .ticker-item:hover {
                    background: rgba(255,255,255,0.03);
                }
            `}</style>
        </div>
    );
};

export default TickerItem;
