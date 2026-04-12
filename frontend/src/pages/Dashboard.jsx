import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../services/api';
import { 
    TrendingUp, TrendingDown, Activity, DollarSign, Award, 
    AlertCircle, Clock, Globe, User, Bell, Newspaper, ChevronRight,
    ArrowUpRight, ArrowDownRight, Briefcase, PieChart, BarChart3,
    Search, Maximize2, MoreHorizontal
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell, Legend,
    BarChart, Bar, ReferenceLine, LabelList
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import StockSearch from '../components/StockSearch';

const Dashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // --- CURRENCY & PERCENT FORMATTING ---
    const formatCurrency = (val) => {
        if (val === undefined || val === null || isNaN(val)) return "₹0";
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
        return `₹${Number(val).toLocaleString('en-IN')}`;
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
            setError("Unable to connect to terminal.");
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

    // --- DATA PROCESSING FOR CHARTS ---
    const chartData = useMemo(() => {
        if (!data || !data.user || !data.user.watchlist) return { 
            performance: [], distribution: [], performanceBars: [], positionSizes: [] 
        };

        const wl = data.user.watchlist;
        const totalValue = data.user.metrics.total_value;

        // 1. Portfolio Distribution (Pie)
        const distribution = wl.map(item => ({
            name: item.symbol,
            value: item.current_price,
            percentage: ((item.current_price / totalValue) * 100).toFixed(1)
        })).sort((a, b) => b.value - a.value);

        // 2. Watchlist Performance Today (Horizontal Bar)
        const performanceBars = wl.map(item => ({
            name: item.symbol,
            value: item.profit_loss_pct
        })).sort((a, b) => b.value - a.value);

        // 3. Position Sizes (Vertical Bar)
        const positionSizes = wl.map(item => ({
            name: item.symbol,
            value: item.current_price
        })).sort((a, b) => b.value - a.value);

        // 4. Simulated Portfolio Performance (Line)
        // Since we don't have historical data, we simulate a 7-day trend based on current total and daily change
        const dailyChange = data.user.metrics.total_pl_abs / 7; // Just for visual curve
        const performance = Array.from({ length: 7 }).map((_, i) => ({
            date: new Date(Date.now() - (6-i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            value: totalValue - (6-i) * dailyChange
        }));

        return { performance, distribution, performanceBars, positionSizes };
    }, [data]);

    if (loading && !data) return <div className="loading-container"><div className="spinner" /></div>;
    
    const { global, user, lastUpdated } = data;
    const { metrics, notifications } = user;

    const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

    return (
        <div className="dashboard-container container">
            
            {/* Header / Search Area */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>Terminal <span className="text-gradient">Intelligence</span></h1>
                    <p>Search any symbol for real-time institutional analysis</p>
                </div>
                <div className="header-search">
                    <StockSearch onSearch={(s) => navigate(`/analyse-stock?symbol=${s}`)} />
                </div>
            </div>

            {/* Pulse Bar */}
            <div className="pulse-bar">
                <div className="pulse-left">
                    <div className="market-status">
                        <div className="status-dot"></div>
                        <span>Market Open</span>
                    </div>
                    <div className="index-pill">
                        NIFTY 50 • <span className={global.marketContext.change_pct >= 0 ? 'pos' : 'neg'}>
                            {formatNumber(global.marketContext.last_price)} ({global.marketContext.change_pct > 0 ? '+' : ''}{formatNumber(global.marketContext.change_pct)}%)
                        </span>
                    </div>
                    <div className="timestamp-pill">
                        Last updated • {new Date(lastUpdated).toLocaleTimeString()}
                    </div>
                </div>
                <div className="pulse-right">
                    <button onClick={() => loadData(true)} disabled={refreshing}>
                        <Clock size={14} className={refreshing ? 'animate-spin' : ''} />
                        Syncing Terminal
                    </button>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="metrics-grid">
                <MetricCard 
                    title="Private Terminal" 
                    value={formatCurrency(metrics.total_value)} 
                    sub={`${metrics.total_pl_pct >= 0 ? '+' : ''}${formatNumber(metrics.total_pl_pct)}%`}
                    trend={metrics.total_pl_pct}
                    icon={<Briefcase size={20} />}
                />
                <MetricCard 
                    title="Total P/L" 
                    value={formatCurrency(metrics.total_pl_abs)} 
                    sub={`${metrics.total_pl_pct >= 0 ? '+' : ''}${formatNumber(metrics.total_pl_pct)}%`}
                    trend={metrics.total_pl_pct}
                    icon={<Activity size={20} />}
                />
                <MetricCard 
                    title="Best Performer" 
                    value={metrics.best_performer?.symbol || "---"} 
                    sub={`${formatNumber(metrics.best_performer?.pl_pct)}% today`}
                    trend={1}
                    icon={<ArrowUpRight size={20} />}
                />
                <MetricCard 
                    title="Worst Performer" 
                    value={metrics.worst_performer?.symbol || "---"} 
                    sub={`${formatNumber(metrics.worst_performer?.pl_pct)}% today`}
                    trend={-1}
                    icon={<ArrowDownRight size={20} />}
                />
            </div>

            {/* Main Charts Row */}
            <div className="charts-row">
                <div className="card main-chart-card">
                    <div className="card-header">
                        <h3><Activity size={18} /> Portfolio Performance</h3>
                        <div className="chart-filters">
                            {['1D', '1W', '1M', '3M', '1Y'].map(f => (
                                <button key={f} className={f === '1M' ? 'active' : ''}>{f}</button>
                            ))}
                        </div>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData.performance}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                                <Tooltip 
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card distribution-card">
                    <div className="card-header">
                        <h3><PieChart size={18} /> Portfolio Distribution</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <RePieChart>
                                <Pie
                                    data={chartData.distribution}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="pie-legend">
                            {chartData.distribution.slice(0, 4).map((item, i) => (
                                <div key={item.name} className="legend-item">
                                    <div className="dot" style={{ background: COLORS[i % COLORS.length] }}></div>
                                    <span className="name">{item.name}</span>
                                    <span className="val">{item.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Bars Row */}
            <div className="charts-row secondary">
                <div className="card bar-chart-card">
                    <div className="card-header">
                        <h3><TrendingUp size={18} /> Watchlist Performance Today</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData.performanceBars} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {chartData.performanceBars.map((item, index) => (
                                        <Cell key={index} fill={item.value >= 0 ? '#22c55e' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card bar-chart-card">
                    <div className="card-header">
                        <h3><BarChart3 size={18} /> Position Sizes</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData.positionSizes}>
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartData.positionSizes.map((item, index) => (
                                        <Cell key={index} fill={index % 2 === 0 ? '#6366f1' : '#22c55e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Movers & Global News */}
            <div className="market-row">
                <div className="movers-column">
                    <div className="movers-card-group">
                        <MoversList title="Top Gainers" data={global.topGainers} type="gainers" formatCurrency={formatCurrency} formatNumber={formatNumber} />
                        <MoversList title="Top Losers" data={global.topLosers} type="losers" formatCurrency={formatCurrency} formatNumber={formatNumber} />
                    </div>
                </div>

                <div className="news-alerts-column">
                    <div className="card alerts-card">
                        <div className="card-header">
                            <h3><Bell size={18} /> Smart Alerts</h3>
                        </div>
                        <div className="notifications-list">
                            {notifications.length > 0 ? notifications.map(n => (
                                <div key={n.id} className="notification-item">
                                    <div className={`importance-bar ${n.priority}`}></div>
                                    <p>{n.message}</p>
                                    <div className="meta">
                                        <span className="symbol">{n.symbol}</span>
                                        <span className="time">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            )) : <div className="empty-state">No new alerts</div>}
                        </div>
                    </div>

                    <div className="card news-card">
                        <div className="card-header">
                            <h3><Newspaper size={18} /> Market News Intelligence</h3>
                        </div>
                        <div className="news-list">
                            {global.marketNews.map((n, i) => (
                                <div key={i} className="news-item">
                                    <div className="news-header">
                                        <span className="source">{n.source}</span>
                                        <span className="time">• {n.time}</span>
                                    </div>
                                    <p className="headline">{n.title}</p>
                                    {n.symbol && <span className="news-tag">{n.symbol}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-container {
                    padding: 2rem 0 5rem;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 3rem;
                }
                .dashboard-header h1 { font-size: 2.5rem; fontWeight: 900; letter-spacing: -1px; margin-bottom: 0.5rem; }
                .dashboard-header p { color: var(--text-secondary); font-size: 1.1rem; }
                .header-search { width: 450px; }

                .pulse-bar {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 1rem 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .pulse-left { display: flex; align-items: center; gap: 2rem; }
                .market-status { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; font-size: 0.9rem; }
                .status-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 10px #22c55e; }
                .index-pill, .timestamp-pill { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }
                .pos { color: #22c55e; }
                .neg { color: #ef4444; }
                .pulse-right button { background: none; border: none; color: var(--accent-primary); display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 800; cursor: pointer; }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .metric-card {
                    padding: 1.5rem;
                    transition: transform 0.2s;
                }
                .metric-card:hover { transform: translateY(-5px); }
                .metric-card .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
                .metric-card .title { font-size: 0.75rem; color: var(--text-secondary); font-weight: 800; text-transform: uppercase; }
                .metric-card .icon { background: rgba(255,255,255,0.03); padding: 0.5rem; border-radius: 10px; color: var(--accent-primary); }
                .metric-card .value { font-size: 1.5rem; font-weight: 950; margin-bottom: 0.25rem; }
                .metric-card .sub { font-size: 0.8rem; font-weight: 800; }
                .metric-card .sub.pos { color: #22c55e; }
                .metric-card .sub.neg { color: #ef4444; }

                .charts-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }
                .charts-row.secondary { grid-template-columns: 1fr 1fr; }

                .card { padding: 1.5rem; display: flex; flex-direction: column; }
                .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .card-header h3 { display: flex; align-items: center; gap: 0.75rem; font-size: 0.95rem; font-weight: 850; }
                
                .chart-filters { display: flex; gap: 0.5rem; }
                .chart-filters button { background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.65rem; padding: 0.25rem 0.6rem; border-radius: 6px; cursor: pointer; }
                .chart-filters button.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }

                .pie-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
                .legend-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.8rem; }
                .legend-item .dot { width: 8px; height: 8px; border-radius: 50%; }
                .legend-item .name { flex: 1; font-weight: 700; color: var(--text-secondary); }
                .legend-item .val { font-weight: 900; }

                .market-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                
                .movers-card-group { display: flex; flexDirection: column; gap: 1.5rem; }
                .movers-list-card h4 { font-size: 0.85rem; font-weight: 800; margin-bottom: 1.25rem; }
                .mover-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .mover-info h5 { font-size: 0.85rem; font-weight: 800; margin-bottom: 2px; }
                .mover-info p { font-size: 0.65rem; color: var(--text-muted); }
                .mover-metrics { text-align: right; }
                .mover-metrics .price { font-size: 0.85rem; font-weight: 800; display: block; }
                .mover-metrics .change { font-size: 0.75rem; font-weight: 900; }

                .news-alerts-column { display: flex; flexDirection: column; gap: 1.5rem; }
                
                .notification-item { padding: 1rem; background: rgba(255,255,255,0.01); border-radius: 10px; border: 1px solid var(--border-color); position: relative; overflow: hidden; margin-bottom: 0.75rem; }
                .importance-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
                .importance-bar.HIGH { background: #ef4444; }
                .importance-bar.MEDIUM { background: #6366f1; }
                .notification-item p { font-size: 0.8rem; font-weight: 700; margin-bottom: 0.5rem; line-height: 1.4; }
                .notification-item .meta { display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-secondary); }
                
                .news-item { padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
                .news-item:last-child { border-bottom: none; }
                .news-header { font-size: 0.65rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
                .news-item .headline { font-size: 0.9rem; font-weight: 700; margin-bottom: 0.75rem; line-height: 1.4; }
                .news-tag { font-size: 0.6rem; fontWeight: 900; background: rgba(99,102,241,0.1); color: var(--accent-primary); padding: 0.2rem 0.5rem; border-radius: 4px; }

                .empty-state { text-align: center; padding: 2rem; color: var(--text-secondary); font-size: 0.8rem; }

                @media (max-width: 1280px) {
                    .dashboard-header { flex-direction: column; align-items: flex-start; gap: 2rem; }
                    .header-search { width: 100%; }
                    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 1024px) {
                    .charts-row, .charts-row.secondary, .market-row { grid-template-columns: 1fr; }
                }
                @media (max-width: 640px) {
                    .metrics-grid { grid-template-columns: 1fr; }
                    .pulse-left { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
                }
            `}</style>
        </div>
    );
};

const MetricCard = ({ title, value, sub, trend, icon }) => (
    <div className="card metric-card">
        <div className="card-top">
            <span className="title">{title}</span>
            <span className="icon">{icon}</span>
        </div>
        <div className="value">{value}</div>
        <div className={`sub ${trend >= 0 ? 'pos' : 'neg'}`}>{sub}</div>
    </div>
);

const MoversList = ({ title, data, type, formatCurrency, formatNumber }) => (
    <div className="card movers-list-card">
        <h4 style={{ color: type === 'gainers' ? '#22c55e' : '#ef4444' }}>{title}</h4>
        <div className="movers-items">
            {(data || []).map((ticker, idx) => (
                <div key={idx} className="mover-item">
                    <div className="mover-info">
                        <h5>{ticker.symbol}</h5>
                        <p>{ticker.name || "Institutional Discovery"}</p>
                    </div>
                    <div className="mover-metrics">
                        <span className="price">{formatCurrency(ticker.price)}</span>
                        <span className={`change ${type === 'gainers' ? 'pos' : 'neg'}`}>
                            {type === 'gainers' ? '+' : ''}{formatNumber(ticker.change_pct)}%
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default Dashboard;
