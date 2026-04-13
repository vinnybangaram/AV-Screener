import React from 'react';
import { ExternalLink } from 'lucide-react';

const MarketSummary = ({ today, ticker }) => {
    if (!today) return null;

    const formatNum = (val) => Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Row 1: Today's Extremes */}
            <StatGroup title="Session Extremes" items={[
                { label: 'High', value: formatNum(today.high) },
                { label: 'Low', value: formatNum(today.low) }
            ]} />
            <StatGroup title="Session Flow" items={[
                { label: 'Open', value: formatNum(today.open) },
                { label: 'Volume', value: today.volume.toLocaleString('en-IN') }
            ]} />
            <StatGroup title="Day Reference" items={[
                { label: 'Prev Close', value: formatNum(today.prev_close) },
                { label: 'Avg Price', value: formatNum(today.avg_price) }
            ]} />
            <StatGroup title="Circuit Limits" items={[
                { label: 'Lower', value: formatNum(today.lower_circuit), color: 'var(--danger)' },
                { label: 'Upper', value: formatNum(today.upper_circuit), color: 'var(--success)' }
            ]} />
            
            {/* Row 2: Price History (Nested logic flattened) */}
            <StatGroup title="3M Performance" items={[
                { label: 'High', value: formatNum(today.stats_3m?.high || 0) },
                { label: 'Low', value: formatNum(today.stats_3m?.low || 0) }
            ]} />
            <StatGroup title="1Y Performance" items={[
                { label: 'High', value: formatNum(today.stats_1y?.high || 0) },
                { label: 'Low', value: formatNum(today.stats_1y?.low || 0) }
            ]} />
            <StatGroup title="3Y Performance" items={[
                { label: 'High', value: formatNum(today.stats_3y?.high || 0) },
                { label: 'Low', value: formatNum(today.stats_3y?.low || 0) }
            ]} />
            <StatGroup title="5Y Performance" items={[
                { label: 'High', value: formatNum(today.stats_5y?.high || 0) },
                { label: 'Low', value: formatNum(today.stats_5y?.low || 0) }
            ]} />
        </div>
    );
};

const StatGroup = ({ title, items }) => (
    <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>
            {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {items.map(item => (
                 <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{item.label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: item.color || 'var(--text-primary)' }}>{item.value}</span>
                </div>
            ))}
        </div>
    </div>
);

export default MarketSummary;
