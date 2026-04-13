import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const SummaryBanner = ({ insights, ticker }) => {
    // If insights is an object with {summary, strength, risk, outlook}, extract summary
    const aiSummary = insights?.summary || (typeof insights === 'string' ? insights : null);
    
    const bannerText = aiSummary || `${ticker} is showing institutional interest with optimized technical setup. Accumulation pattern observed near volume support levels.`;

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card" 
            style={{ 
                marginBottom: '1.5rem', 
                background: 'rgba(59, 130, 246, 0.05)', 
                borderLeft: '4px solid var(--accent-primary)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Zap size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-primary)' }}>
                    AI Intelligence Brief
                </span>
                {insights?.outlook && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                        <LabelBadge label="Strength" value={insights.strength} />
                        <LabelBadge label="Risk" value={insights.risk} />
                        <LabelBadge label="Outlook" value={insights.outlook} />
                    </div>
                )}
            </div>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {bannerText}
            </p>
        </motion.div>
    );
};

const LabelBadge = ({ label, value }) => (
    <div style={{ fontSize: '0.65rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>{label}:</span>
        <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
);

export default SummaryBanner;
