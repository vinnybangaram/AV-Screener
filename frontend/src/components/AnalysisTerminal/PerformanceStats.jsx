const PerformanceStats = ({ performance }) => {
    if (!performance) return null;

    return (
        <div className="perf-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            <PerformanceBox 
                title="Weekly/Monthly" 
                items={[{ label: '1 Week', key: '1w' }, { label: '1 Month', key: '1m' }]} 
                performance={performance} 
                accent="var(--success)" 
            />
            <PerformanceBox 
                title="Mid-Term" 
                items={[{ label: '3 Months', key: '3m' }, { label: '6 Months', key: '6m' }]} 
                performance={performance} 
                accent="var(--success)" 
            />
            <PerformanceBox 
                title="Short Year" 
                items={[{ label: '9 Months', key: '9m' }, { label: '1 Year', key: '1y' }]} 
                performance={performance} 
                accent="var(--accent-primary)" 
            />
            <PerformanceBox 
                title="Long-Term" 
                items={[{ label: '3 Years', key: '3y' }, { label: '5 Years', key: '5y' }]} 
                performance={performance} 
                accent="var(--accent-primary)" 
            />
        </div>
    );
};

const PerformanceBox = ({ title, items, performance, accent }) => (
    <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <h3 style={{ fontSize: '0.65rem', fontWeight: '700', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.3rem' }}>
            <div style={{ width: '2px', height: '10px', background: accent, borderRadius: '1px' }} />
            {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {items.map(item => {
                const val = performance[item.key] || 0;
                const isPos = val >= 0;
                return (
                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{item.label}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: isPos ? 'var(--success)' : 'var(--danger)' }}>
                            {isPos ? '+' : ''}{val.toFixed(2)}%
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
);

const styles = `
  @media (max-width: 1024px) {
    .perf-summary-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
  @media (max-width: 640px) {
    .perf-summary-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('perf-stats-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'perf-stats-styles';
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

export default PerformanceStats;
