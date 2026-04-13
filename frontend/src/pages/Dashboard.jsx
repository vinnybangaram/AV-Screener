import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboard } from '../services/api';
import { 
    TrendingUp, TrendingDown, Activity, DollarSign, Award, 
    AlertCircle, Clock, Globe, User, Bell, Newspaper, ChevronRight,
    ArrowUpRight, ArrowDownRight, Briefcase, PieChart, BarChart3,
    Search, Maximize2, MoreHorizontal, Download, Filter, Calendar
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell, Legend,
    BarChart, Bar, ReferenceLine, LabelList
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Loader from '../components/Common/Loader';

const Dashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // --- FILTERS STATE ---
    const [sectorFilter, setSectorFilter] = useState('All');
    const [timeframe, setTimeframe] = useState('This Month');

    // --- USER PROFILE ---
    const userProfile = useMemo(() => {
        const stored = localStorage.getItem('user');
        if (stored) return JSON.parse(stored);
        return { name: "Investor" };
    }, []);

    const firstName = userProfile.name.split(' ')[0];

    // --- CURRENCY & PERCENT FORMATTING ---
    const formatCurrency = (val) => {
        if (val === undefined || val === null || isNaN(val)) return "₹0";
        if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
        if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
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

    // --- DYNAMIC FILTERING LOGIC ---
    const filteredData = useMemo(() => {
        if (!data || !data.user || !data.user.watchlist) return { 
            metrics: {}, performance: [], distribution: [], performanceBars: [], positionSizes: [], count: 0 
        };

        let watchlist = [...data.user.watchlist];

        // 1. Sector/Source Filter
        if (sectorFilter !== 'All') {
            watchlist = watchlist.filter(item => {
                if (!item.source) return false;
                const src = item.source.toLowerCase();
                if (sectorFilter === 'Multibaggers') return src.includes('multibagger');
                if (sectorFilter === 'Penny Stocks') return src.includes('penny');
                if (sectorFilter === 'Intraday') return src.includes('intraday');
                return false;
            });
        }

        // 2. Timeframe Logic (Conditional)
        const isIntraday = sectorFilter === 'Intraday';
        const currentTimeframe = isIntraday ? 'Today' : timeframe;

        // Recalculate Metrics for filtered set
        const count = watchlist.length;
        const totalValue = watchlist.reduce((acc, item) => acc + item.current_price, 0);
        const totalPlAbs = watchlist.reduce((acc, item) => acc + item.profit_loss_abs, 0);
        const avgEntry = watchlist.reduce((acc, item) => acc + item.added_price, 0);
        const totalPlPct = avgEntry > 0 ? (totalPlAbs / avgEntry) * 100 : 0;

        const best = count > 0 ? watchlist.reduce((prev, curr) => (prev.profit_loss_pct > curr.profit_loss_pct) ? prev : curr) : null;
        const worst = count > 0 ? watchlist.reduce((prev, curr) => (prev.profit_loss_pct < curr.profit_loss_pct) ? prev : curr) : null;

        // 3. Chart Processing
        const distribution = watchlist.map(item => ({
            name: item.symbol,
            value: item.current_price,
            percentage: totalValue > 0 ? ((item.current_price / totalValue) * 100).toFixed(1) : 0
        })).sort((a, b) => b.value - a.value);

        const performanceBars = watchlist.map(item => ({
            name: item.symbol,
            value: item.profit_loss_pct
        })).sort((a, b) => b.value - a.value);

        const positionSizes = watchlist.map(item => ({
            name: item.symbol,
            value: item.current_price
        })).sort((a, b) => b.value - a.value);

        // Simulation based on timeframe
        const dayCount = currentTimeframe === 'Today' ? 1 : currentTimeframe === 'This Week' ? 7 : currentTimeframe === 'This Month' ? 30 : 365;
        const curvePoints = 7;
        const step = totalPlAbs / curvePoints;
        const performance = Array.from({ length: curvePoints }).map((_, i) => ({
            date: new Date(Date.now() - (6-i) * (dayCount/curvePoints) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            value: totalValue - (6-i) * step
        }));

        return { 
            count, metrics: { totalValue, totalPlAbs, totalPlPct, best, worst }, 
            performance, distribution, performanceBars, positionSizes, watchlist 
        };
    }, [data, sectorFilter, timeframe]);

    // --- EXPORT FUNCTION ---
    const handleExport = () => {
        if (!filteredData.watchlist.length) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Symbol", "Source", "Added Price", "Current Price", "P/L %", "P/L Abs"];
        const rows = filteredData.watchlist.map(item => [
            item.symbol,
            item.source,
            item.added_price,
            item.current_price,
            item.profit_loss_pct.toFixed(2),
            item.profit_loss_abs.toFixed(2)
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `Portfolio_Export_${sectorFilter}_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("CSV Export Triggered");
    };

    if (loading && !data) return <Loader message="Synchronizing Terminal Intelligence..." />;
    
    if (error) {
        return (
            <div className="container" style={{ padding: '8rem 2rem', textAlign: 'center', background: 'var(--bg-primary)', minHeight: '100vh' }}>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
                    <h2 style={{ fontSize: '2rem', fontWeight: '850', marginBottom: '1rem' }}>Terminal Connection Offline</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                        The Intelligence Engine (Port 5000) appears to be unreachable. Please ensure the backend server is active.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button className="primary-btn" onClick={() => loadData()} style={{ padding: '0.8rem 2rem' }}>
                            Retry Connection
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!data) return null;

    const { global, lastUpdated } = data;
    const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

    return (
        <div className="container animate-in dashboard-wrapper" style={{ paddingBottom: '5rem', maxWidth: '1600px' }}>
            
            {/* 🔷 TOP SECTION: RESTRUCTURED HEADER */}
            <div className="dashboard-top-bar" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="welcome-area">
                    <span className="page-eyebrow" style={{ color: 'var(--text-muted)' }}>Institutional Terminal</span>
                    <h2 className="welcome-text" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                        Welcome, <span className="text-gradient">{firstName}</span>
                    </h2>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                        Terminal <span className="text-gradient">Intelligence</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: '500' }}>
                        Real-time analysis and filtered portfolio insights
                    </p>
                </div>
                <div className="top-actions">
                    <button className="export-btn" onClick={handleExport}>
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* 🔷 FILTER BAR */}
            <div className="global-filter-bar">
                <div className="filter-group">
                    <Filter size={16} className="filter-icon" />
                    {['All', 'Multibaggers', 'Penny Stocks', 'Intraday'].map(s => (
                        <button 
                            key={s} 
                            className={`filter-chip ${sectorFilter === s ? 'active' : ''}`}
                            onClick={() => setSectorFilter(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="filter-divider" />
                <div className="filter-group">
                    <Calendar size={16} className="filter-icon" />
                    {['Today', 'This Week', 'This Month', 'This Year'].map(t => (
                        <button 
                            key={t} 
                            className={`filter-chip ${timeframe === t ? 'active' : ''}`}
                            onClick={() => setTimeframe(t)}
                            disabled={sectorFilter === 'Intraday' && t !== 'Today'}
                        >
                            {t}
                        </button>
                    ))}
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
                </div>
                <div className="pulse-right">
                    <span className="timestamp-pill"><Clock size={12} /> Sync: {new Date(lastUpdated).toLocaleTimeString()}</span>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="metrics-grid">
                <MetricCard 
                    title="Total Watchlist" 
                    value={formatCurrency(filteredData.metrics.totalValue)} 
                    sub={`${filteredData.metrics.totalPlPct >= 0 ? '+' : ''}${formatNumber(filteredData.metrics.totalPlPct)}%`}
                    trend={filteredData.metrics.totalPlPct}
                    icon={<Briefcase size={20} />}
                />
                <MetricCard 
                    title="Total P/L" 
                    value={formatCurrency(filteredData.metrics.totalPlAbs)} 
                    sub={`${filteredData.metrics.totalPlPct >= 0 ? '+' : ''}${formatNumber(filteredData.metrics.totalPlPct)}%`}
                    trend={filteredData.metrics.totalPlPct}
                    icon={<Activity size={20} />}
                />
                <MetricCard 
                    title="Best Performer" 
                    value={
                        <span 
                            onClick={() => filteredData.metrics.best && (window.location.href = `/analyse-stock?symbol=${filteredData.metrics.best.symbol}`)}
                            style={{ cursor: filteredData.metrics.best ? 'pointer' : 'default' }}
                        >
                            {filteredData.metrics.best?.symbol || "---"}
                        </span>
                    } 
                    sub={filteredData.metrics.best ? `${formatNumber(filteredData.metrics.best.profit_loss_pct)}%` : 'No data'}
                    trend={1}
                    icon={<ArrowUpRight size={20} />}
                />
                <MetricCard 
                    title="Worst Performer" 
                    value={
                        <span 
                            onClick={() => filteredData.metrics.worst && (window.location.href = `/analyse-stock?symbol=${filteredData.metrics.worst.symbol}`)}
                            style={{ cursor: filteredData.metrics.worst ? 'pointer' : 'default' }}
                        >
                            {filteredData.metrics.worst?.symbol || "---"}
                        </span>
                    } 
                    sub={filteredData.metrics.worst ? `${formatNumber(filteredData.metrics.worst.profit_loss_pct)}%` : 'No data'}
                    trend={-1}
                    icon={<ArrowDownRight size={20} />}
                />
            </div>

            {/* Performance Row */}
            <div className="charts-row">
                <div className="card main-chart-card">
                    <div className="card-header">
                        <h3><Activity size={18} /> Portfolio Performance</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={filteredData.performance}>
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
                                    data={filteredData.distribution}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {filteredData.distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bar Charts Row */}
            <div className="charts-row secondary">
                <div className="card bar-chart-card">
                    <div className="card-header">
                        <h3><TrendingUp size={18} /> Watchlist Performance</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={filteredData.performanceBars} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {filteredData.performanceBars.map((item, index) => (
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
                            <BarChart data={filteredData.positionSizes}>
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {filteredData.positionSizes.map((item, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 🔷 SYSTEM POSITIONS SECTION */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Award size={20} className="text-gradient" />
                        <h3>System Positions <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>• Quantitative Strategy Engine</span></h3>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                        ⚠️ SL & Target are system-generated estimates, not financial advice
                    </div>
                </div>

                <div className="positions-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    {['ACTIVE', 'TARGET_HIT', 'SL_HIT'].map(s => {
                        const count = filteredData.watchlist.filter(item => item.status === s).length;
                        return (
                            <button 
                                key={s} 
                                className={`filter-chip ${s === (sectorFilter === 'Intraday' ? 'ACTIVE' : sectorFilter) ? '' : ''} ${s === (window._currentPosTab || 'ACTIVE') ? 'active' : ''}`}
                                onClick={() => {
                                    window._currentPosTab = s;
                                    setData({...data}); // Force re-render
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {s.replace('_', ' ')} <span style={{ opacity: 0.6 }}>({count})</span>
                            </button>
                        );
                    })}
                </div>

                <div className="positions-table-wrapper" style={{ overflowX: 'auto' }}>
                    <table className="positions-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <th style={{ padding: '0 1rem' }}>Asset</th>
                                <th>Strategy</th>
                                <th>Entry</th>
                                <th>Current</th>
                                <th>System SL</th>
                                <th>System Target</th>
                                <th style={{ textAlign: 'right', padding: '0 1rem' }}>Return (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.watchlist
                                .filter(item => item.status === (window._currentPosTab || 'ACTIVE'))
                                .map(item => (
                                    <tr key={item.id} className="table-row-hover" style={{ background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <td style={{ padding: '1rem', borderRadius: '12px 0 0 12px', border: '1px solid rgba(255,255,255,0.03)', borderRight: 'none' }}>
                                            <div onClick={() => window.location.href = `/analyse-stock?symbol=${item.symbol}`} style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                                                {item.symbol}
                                            </div>
                                        </td>
                                        <td style={{ borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                                                {item.source.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            ₹{formatNumber(item.added_price)}
                                        </td>
                                        <td style={{ fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            ₹{formatNumber(item.current_price)}
                                        </td>
                                        <td style={{ borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ color: '#ef4444', fontWeight: '900', fontSize: '0.9rem' }}>₹{formatNumber(item.stop_loss)}</div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Auto-buffer</div>
                                        </td>
                                        <td style={{ borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ color: '#22c55e', fontWeight: '900', fontSize: '0.9rem' }}>₹{formatNumber(item.target_price)}</div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Optimum Exit</div>
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '1rem', borderRadius: '0 12px 12px 0', border: '1px solid rgba(255,255,255,0.03)', borderLeft: 'none' }}>
                                            <div style={{ fontWeight: '800', color: item.profit_loss_pct >= 0 ? '#22c55e' : '#ef4444' }}>
                                                {item.profit_loss_pct >= 0 ? '+' : ''}{formatNumber(item.profit_loss_pct)}%
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                    {filteredData.watchlist.filter(item => item.status === (window._currentPosTab || 'ACTIVE')).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                           No {(window._currentPosTab || 'ACTIVE').replace('_', ' ').toLowerCase()} positions in this category.
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .positions-table tr.table-row-hover:hover {
                    background: rgba(255,255,255,0.05) !important;
                    transform: translateX(4px);
                }
            `}</style>

            {/* Market Data */}
            <div className="market-row">
                <div className="movers-column">
                    <MoversList title="Top Gainers" data={global.topGainers} type="gainers" formatCurrency={formatCurrency} formatNumber={formatNumber} />
                </div>
                <div className="movers-column">
                    <MoversList title="Top Losers" data={global.topLosers} type="losers" formatCurrency={formatCurrency} formatNumber={formatNumber} />
                </div>
            </div>

            <style>{`
                .dashboard-wrapper { padding-top: 1rem; }
                .dashboard-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .welcome-text { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.5px; }
                
                .export-btn { 
                    display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.03);
                    border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.6rem 1.2rem;
                    border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
                }
                .export-btn:hover { background: rgba(255,255,255,0.07); border-color: var(--accent-primary); }

                .global-filter-bar {
                    display: flex; align-items: center; gap: 1.5rem; background: rgba(255,255,255,0.02);
                    border: 1px solid var(--border-color); padding: 0.75rem 1.5rem; border-radius: 16px; margin-bottom: 2rem;
                }
                .filter-group { display: flex; align-items: center; gap: 0.75rem; }
                .filter-icon { color: var(--text-muted); }
                .filter-divider { width: 1px; height: 1.5rem; background: var(--border-color); }
                
                .filter-chip {
                    background: none; border: 1px solid transparent; color: var(--text-secondary);
                    padding: 0.3rem 0.8rem; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 700;
                    transition: all 0.2s;
                }
                .filter-chip:hover:not(:disabled) { color: var(--text-primary); background: rgba(255,255,255,0.03); }
                .filter-chip.active { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
                .filter-chip:disabled { opacity: 0.3; cursor: not-allowed; }

                .pulse-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 0 0.5rem; }
                .pulse-left { display: flex; align-items: center; gap: 1.5rem; }
                .market-status { display: flex; align-items: center; gap: 0.5rem; font-weight: 800; font-size: 0.8rem; }
                .status-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
                .index-pill { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); }
                .pos { color: #22c55e; } .neg { color: #ef4444; }
                .timestamp-pill { display: flex; align-items: center; gap: 0.4rem; font-size: 0.7rem; color: var(--text-muted); font-weight: 700; }

                .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 1.5rem; }
                .metric-card { padding: 1.25rem; }
                .metric-card .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
                .metric-card .title { font-size: 0.65rem; color: var(--text-secondary); font-weight: 800; text-transform: uppercase; }
                .metric-card .value { font-size: 1.35rem; font-weight: 950; margin-bottom: 0.15rem; }
                .metric-card .sub { font-size: 0.75rem; font-weight: 800; }
                .metric-card .icon { background: rgba(255,255,255,0.03); padding: 0.4rem; border-radius: 8px; color: var(--accent-primary); }

                .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
                .charts-row.secondary { grid-template-columns: 1fr 1fr; }
                .card-header h3 { font-size: 0.9rem; font-weight: 850; display: flex; align-items: center; gap: 0.6rem; }
                
                .market-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
                .movers-list-card h4 { font-size: 0.85rem; font-weight: 800; margin-bottom: 1rem; }
                .mover-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.02); }
                .mover-info h5 { font-size: 0.8rem; font-weight: 800; }
                .mover-metrics { text-align: right; }
                .mover-metrics .price { font-size: 0.8rem; font-weight: 800; display: block; }
                .mover-metrics .change { font-size: 0.7rem; font-weight: 900; }

                @media (max-width: 1024px) {
                    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
                    .charts-row, .charts-row.secondary, .market-row { grid-template-columns: 1fr; }
                    .global-filter-bar { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .filter-divider { display: none; }
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
                        <h5 
                            onClick={() => window.location.href = `/analyse-stock?symbol=${ticker.symbol}`}
                            style={{ cursor: 'pointer', margin: 0, transition: 'color 0.2s' }}
                            onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'}
                            onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}
                        >
                            {ticker.symbol}
                        </h5>
                    </div>
                    <div className="mover-metrics">
                        <span className="price">{formatCurrency(ticker.price)}</span>
                        <span className={`change ${type === 'gainers' ? 'pos' : 'neg'}`}>{type === 'gainers' ? '+' : ''}{formatNumber(ticker.change_pct)}%</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default Dashboard;
