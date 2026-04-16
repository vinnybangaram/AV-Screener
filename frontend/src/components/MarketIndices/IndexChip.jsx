import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const IndexChip = ({ index }) => {
    if (!index) return null;
    
    return (
        <div className="index-chip" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            padding: '4px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            minWidth: '120px',
            transition: 'all 0.2s ease',
            cursor: 'default'
        }}>
            <div style={{ 
                fontSize: '0.65rem', 
                fontWeight: '900', 
                color: 'var(--text-secondary)',
                letterSpacing: '1px',
                textTransform: 'uppercase'
            }}>
                {index.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: '700', 
                    color: index.is_up ? 'var(--success)' : 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                }}>
                    {index.is_up ? '+' : ''}{index.change_pct}%
                    {index.is_up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                </span>
            </div>
            
            <style>{`
                .index-chip:hover {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: var(--accent-primary)40;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default IndexChip;
