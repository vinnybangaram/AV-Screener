import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const SessionTable = ({ history, ticker }) => {
    if (!history) return null;

    const formatNum = (val) => Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Historical Session Data (Last 10)
                </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.01)', textAlign: 'left' }}>
                            <th style={thStyle}>Date</th>
                            <th style={thStyle}>Open</th>
                            <th style={thStyle}>Close</th>
                            <th style={thStyle}>Change%</th>
                            <th style={thStyle}>High</th>
                            <th style={thStyle}>Low</th>
                            <th style={thStyle}>Volume</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((row, idx) => {
                            const change = ((row.Close - row.Open) / row.Open) * 100;
                            const isPos = change >= 0;
                            
                            return (
                                <tr key={idx} className="table-row-hover">
                                    <td style={tdStyle}>{row.date_str}</td>
                                    <td style={tdStyle}>{formatNum(row.Open)}</td>
                                    <td style={tdStyle}>{formatNum(row.Close)}</td>
                                    <td style={{ ...tdStyle, color: isPos ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            {isPos ? '+' : ''}{change.toFixed(2)}%
                                            {isPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>{formatNum(row.High)}</td>
                                    <td style={tdStyle}>{formatNum(row.Low)}</td>
                                    <td style={tdStyle}>{row.Volume.toLocaleString('en-IN')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <style>{`
                .table-row-hover:hover td { background: var(--bg-card-hover) !important; }
            `}</style>
        </div>
    );
};

const thStyle = {
    padding: '0.6rem 1rem',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border-color)'
};

const tdStyle = {
    padding: '0.6rem 1rem',
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)'
};

export default SessionTable;
