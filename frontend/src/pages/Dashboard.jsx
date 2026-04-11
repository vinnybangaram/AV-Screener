import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../services/api';
import { 
    TrendingUp, TrendingDown, Activity, DollarSign, Award, 
    AlertCircle, Clock, Globe, User, Bell, Newspaper, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // --- SAFE FORMATTING UTILS ---
  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return "₹0";
    return `₹${Number(val).toLocaleString()}`;
  };

  const formatNumber = (val, decimals = 2) => {
    if (val === undefined || val === null || isNaN(val)) return "0.00";
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const loadData = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
        const dashboardData = await fetchDashboard();
        if (!dashboardData || !dashboardData.global) {
            throw new Error("Invalid terminal data structure received.");
        }
        setData(dashboardData);
    } catch (err) {
        console.error("Dashboard Load Error:", err);
        setError("Unable to connect to terminal. Please verify your connection.");
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 300000);
    return () => clearInterval(interval);
  }, []);

  // --- LOADING / ERROR GUARD ---
  if (loading && !data) {
    return (
        <div className="flex-center" style={{ height: '80vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner" />
            <span style={{ color: 'var(--text-secondary)', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '2px' }}>
                INITIALIZING TERMINAL...
            </span>
        </div>
    );
  }

  if (error && !data) {
    return (
        <div className="flex-center" style={{ height: '80vh', flexDirection: 'column', gap: '1rem' }}>
            <span style={{ color: 'var(--danger)', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '2px', textAlign: 'center', maxWidth: '400px' }}>
                {error.toUpperCase()}
            </span>
            <button 
                className="primary-btn" 
                onClick={() => loadData()}
                style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', fontSize: '0.75rem' }}
            >
                RETRY CONNECTION
            </button>
        </div>
    );
  }

  const global = data?.global || {};
  const user = data?.user || { metrics: { count: 0 }, notifications: [] };
  const lastUpdated = data?.lastUpdated;
  const metrics = user?.metrics || {};

  return (
    <div className="container animate-in" style={{ paddingBottom: '5rem', maxWidth: '1600px' }}>
      
      {/* ── TERMINAL HEADER ── */}
      <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          marginBottom: '2rem', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
          borderLeft: '4px solid var(--accent-primary)' 
      }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Market Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '900', fontSize: '0.9rem' }}>
                      <Globe size={14} color="var(--accent-primary)" />
                      {global?.marketContext?.trend || "Neutral"} <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>/</span> {global?.marketContext?.volatility || "Normal"} Vol
                  </div>
              </div>
              <div style={{ width: '1px', height: '2rem', background: 'var(--border-color)' }} />
              <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Nifty 50</div>
                  <div style={{ fontWeight: '900', fontSize: '0.9rem', color: (global?.marketContext?.change_pct || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {formatCurrency(global?.marketContext?.last_price)} ({ (global?.marketContext?.change_pct || 0) > 0 ? '+' : ''}{formatNumber(global?.marketContext?.change_pct)}%)
                  </div>
              </div>
          </div>
          <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Data Freshness</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', fontWeight: '700', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                  <Clock size={14} />
                  {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Syncing..."}
              </div>
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '2rem' }}>
        
        {/* ── LEFT COLUMN: MARKET INTELLIGENCE (GLOBAL) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Top Movers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <MoversTable 
                    title="Top Gainers" 
                    data={global?.topGainers || []} 
                    type="gainers" 
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                />
                <MoversTable 
                    title="Top Losers" 
                    data={global?.topLosers || []} 
                    type="losers" 
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                />
            </div>

            {/* News Feed */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1rem' }}>
                    <Newspaper size={20} color="var(--accent-primary)" /> Market News Intelligence
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(global?.marketNews || []).map((news, idx) => (
                        <div key={idx} style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.01)',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.25rem' }}>{news?.title || "Market Update"}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem' }}>
                                    <span>{news?.source || "Terminal"}</span>
                                    <span>{news?.time || "Just now"}</span>
                                </div>
                            </div>
                            <span style={{ 
                                fontSize: '0.65rem', fontWeight: '900', padding: '0.2rem 0.6rem', borderRadius: '4px',
                                background: news?.impact === 'Bullish' ? 'rgba(34,197,94,0.1)' : news?.impact === 'Bearish' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                                color: news?.impact === 'Bullish' ? 'var(--success)' : news?.impact === 'Bearish' ? 'var(--danger)' : 'var(--text-secondary)'
                            }}>{(news?.impact || "Neutral").toUpperCase()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* ── RIGHT COLUMN: PRIVATE TERMINAL (USER) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* User Portfolio Metrics */}
            <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(201,160,255,0.05) 0%, rgba(201,160,255,0) 100%)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1rem' }}>
                    <User size={20} color="var(--accent-primary)" /> Private Terminal
                </h3>
                
                {metrics?.count === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>No stocks in watchlist</div>
                        <button className="primary-btn" onClick={() => navigate('/watchlist')} style={{ width: '100%', fontSize: '0.8rem' }}>Add Stocks to Unlock Insights</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <MiniMetric label="Total Value" value={formatCurrency(metrics?.total_value)} icon={<DollarSign size={16} />} />
                        <MiniMetric 
                            label="Net P/L" 
                            value={formatCurrency(metrics?.total_pl_abs)} 
                            sub={`${(metrics?.total_pl_pct || 0) > 0 ? '+' : ''}${formatNumber(metrics?.total_pl_pct)}%`}
                            color={(metrics?.total_pl_abs || 0) >= 0 ? 'var(--success)' : 'var(--danger)'}
                        />
                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Best Performer</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--success)' }}>{metrics?.best_performer?.symbol || "---"}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Worst Performer</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--danger)' }}>{metrics?.worst_performer?.symbol || "---"}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Notifications Stack */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1rem' }}>
                    <Bell size={20} color="var(--accent-primary)" /> Smart Alerts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(!user?.notifications || user.notifications.length === 0) ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '1.5rem' }}>Everything is stable. No new alerts.</div>
                    ) : (
                        user.notifications.map((n, idx) => (
                            <div key={n.id || idx} style={{ 
                                padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.01)',
                                borderLeft: `3px solid ${n?.priority === 'HIGH' ? 'var(--danger)' : n?.priority === 'MEDIUM' ? 'var(--accent-primary)' : 'var(--text-secondary)'}`,
                                position: 'relative'
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', lineHeight: '1.4' }}>{n?.message}</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{n?.symbol}</span>
                                    <span>{n?.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

const MoversTable = ({ title, data, type, formatCurrency, formatNumber }) => (
    <div className="card" style={{ padding: '1.25rem' }}>
        <h4 style={{ 
            fontSize: '0.85rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: type === 'gainers' ? 'var(--success)' : 'var(--danger)'
        }}>
            {type === 'gainers' ? <TrendingUp size={16} /> : <TrendingDown size={16} />} {title}
        </h4>
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                    <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>SYMBOL</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>PRICE</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>% CHG</th>
                    </tr>
                </thead>
                <tbody>
                    {(data || []).map((s, idx) => (
                        <tr key={s?.symbol || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '0.75rem 0', fontWeight: '700' }}>{s?.symbol || "---"}</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(s?.price)}</td>
                            <td style={{ 
                                padding: '0.75rem 0', textAlign: 'right', fontWeight: '900',
                                color: type === 'gainers' ? 'var(--success)' : 'var(--danger)'
                            }}>{type === 'gainers' ? '+' : ''}{formatNumber(s?.change_pct)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const MiniMetric = ({ label, value, icon, sub, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '900', color: color }}>{value}</span>
                {sub && <span style={{ fontSize: '0.75rem', fontWeight: '800', color: color }}>{sub}</span>}
            </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px' }}>
            {icon}
        </div>
    </div>
);

export default Dashboard;
