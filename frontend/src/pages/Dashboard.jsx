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
import PortfolioPerformanceChart from '../components/PortfolioPerformanceChart';
import AssetAllocationChart from '../components/AssetAllocationChart';
import PerformanceRankingChart from '../components/PerformanceRankingChart';

const Dashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // --- FILTERS STATE ---
    const [mainTab, setMainTab] = useState('Investment');
    const [subTab, setSubTab] = useState('All');
    const [timeframe, setTimeframe] = useState('This Month');
    const [chartMode, setChartMode] = useState('pnl'); // 'pnl' or 'return'
    const [posTab, setPosTab] = useState('ACTIVE');

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
            // Mapping for backend category filter
            let backendCategory = "All";
            if (mainTab === 'Investment') {
                if (subTab === 'Multibaggers') backendCategory = 'Multibaggers';
                else if (subTab === 'Penny Stocks') backendCategory = 'Penny Stocks';
                else backendCategory = 'Investment'; // Custom category for backend if needed
            } else {
                backendCategory = 'Intraday Radar';
            }

            const dashboardData = await fetchDashboard(backendCategory, timeframe);
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
        const interval = setInterval(() => loadData(true), 300000); // 5 mins auto-refresh
        return () => clearInterval(interval);
    }, [mainTab, subTab, timeframe]);

    // --- DYNAMIC FILTERING & TRENDING ---
    const filteredData = useMemo(() => {
        if (!data || !data.user || !data.user.watchlist) return { 
            metrics: {}, performance: [], distribution: [], performanceBars: [], positionSizes: [], count: 0 
        };

        const watchlist = [...data.user.watchlist];
        const performanceTrend = data.user.performanceTrend || { labels: [], datasets: [] };
        const metrics = data.user.metrics;

        // Chart Data Processing
        const chartLabels = performanceTrend.labels;
        const pnlDataset = performanceTrend.datasets.find(d => d.label.includes('P/L'))?.data || [];
        const pctDataset = performanceTrend.datasets.find(d => d.label.includes('Return'))?.data || [];

        const performance = chartLabels.map((label, i) => ({
            date: label,
            value: chartMode === 'pnl' ? pnlDataset[i] : pctDataset[i]
        }));

        const distribution = watchlist.map(item => ({
            name: item.symbol,
            value: item.latest_price * item.quantity,
            percentage: metrics.total_value > 0 ? (((item.latest_price * item.quantity) / metrics.total_value) * 100).toFixed(1) : 0
        })).sort((a, b) => b.value - a.value);

        const performanceBars = watchlist.map(item => ({
            name: item.symbol,
            value: item.latest_pnl_percent
        })).sort((a, b) => b.value - a.value);

        const positionSizes = watchlist.map(item => ({
            name: item.symbol,
            value: item.latest_price * item.quantity
        })).sort((a, b) => b.value - a.value);

        return { 
            count: metrics.count, metrics, 
            performance, distribution, performanceBars, positionSizes, watchlist 
        };
    }, [data, chartMode]);

    // --- POSITIONS FILTERING ---
    const posCounts = useMemo(() => {
        if (!filteredData.watchlist) return { active: 0, target: 0, sl: 0 };
        const w = filteredData.watchlist;
        return {
            active: w.length, // Logic: items in watchlist are currently active
            target: w.filter(i => i.latest_price >= i.target_price && i.target_price > 0).length,
            sl: w.filter(i => i.latest_price <= i.stop_loss && i.stop_loss > 0).length,
        };
    }, [filteredData.watchlist]);

    const displayPositions = useMemo(() => {
        if (!filteredData.watchlist) return [];
        let w = filteredData.watchlist;

        // Apply Sub-tab filtering for Intraday side
        if (mainTab === 'Intraday') {
            if (subTab === 'Shorts') w = w.filter(i => i.side === 'SHORT');
            else if (subTab === 'Longs') w = w.filter(i => i.side !== 'SHORT');
        }

        if (posTab === 'ACTIVE') return w;
        if (posTab === 'TARGET_HIT') return w.filter(i => (i.side !== 'SHORT' ? i.latest_price >= i.target_price : i.latest_price <= i.target_price) && i.target_price > 0);
        if (posTab === 'SL_HIT') return w.filter(i => (i.side !== 'SHORT' ? i.latest_price <= i.stop_loss : i.latest_price >= i.stop_loss) && i.stop_loss > 0);
        return w;
    }, [filteredData.watchlist, posTab, mainTab, subTab]);

    // --- EXPORT FUNCTION ---
    const handleExport = () => {
        if (!filteredData.watchlist.length) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Symbol", "Category", "Entry Price", "Latest Price", "P/L %", "P/L Abs"];
        const rows = filteredData.watchlist.map(item => [
            item.symbol,
            item.category,
            item.entry_price,
            item.latest_price,
            item.latest_pnl_percent.toFixed(2),
            item.latest_pnl.toFixed(2)
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `Terminal_Intel_Export_${mainTab}_${subTab}_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Terminal Intel Exported");
    };

    if (loading && !data) return <Loader message="Synchronizing Terminal Intelligence..." fullPage={false} />;
    
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
                        The Intelligence Engine appears to be unreachable. Please ensure the backend server and PostgreSQL connection are active.
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
                    <span className="page-eyebrow" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>INSTITUTIONAL TERMINAL</span>
                    <h2 className="welcome-text" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem', color: '#fff' }}>
                        Welcome, <span style={{ color: '#a78bfa' }}>{firstName}</span>
                    </h2>
                    <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '-1.5px', color: '#fff' }}>
                        Terminal <span style={{ color: '#a78bfa' }}>Intelligence</span>
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

            {/* 🔷 DUAL-LAYER FILTER BAR */}
            <div className="filter-system-container" style={{ marginBottom: '2.5rem' }}>
                <div className="main-filter-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '2rem' }}>
                    <div className="main-tabs" style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                        {['Investment', 'Intraday'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setMainTab(tab); setSubTab('All'); }}
                                style={{
                                    padding: '0.8rem 2.5rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '850', border: 'none', cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    background: mainTab === tab ? 'var(--accent-primary)' : 'transparent',
                                    color: mainTab === tab ? '#fff' : 'var(--text-secondary)',
                                    boxShadow: mainTab === tab ? '0 8px 16px -4px rgba(99, 102, 241, 0.4)' : 'none'
                                }}
                            >
                                {tab.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div className="timeframe-global" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ padding: '0 0.5rem', color: 'var(--text-muted)' }}><Calendar size={16} /></div>
                        {['Today', 'This Week', 'This Month', 'This Year'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setTimeframe(t)}
                                style={{
                                    padding: '0.6rem 1.25rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', border: 'none', cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: timeframe === t ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    color: timeframe === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    border: timeframe === t ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sub-tabs-row" style={{ display: 'flex', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                    {(mainTab === 'Investment' ? ['All', 'Multibaggers', 'Penny Stocks'] : ['All', 'Longs', 'Shorts']).map(sub => (
                        <button
                            key={sub}
                            onClick={() => setSubTab(sub)}
                            style={{
                                padding: '0.5rem 1.25rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer',
                                transition: 'all 0.3s',
                                background: subTab === sub ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: subTab === sub ? '#fff' : 'var(--text-muted)',
                                border: `1px solid ${subTab === sub ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`
                            }}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pulse Bar */}
            <div className="pulse-bar">
                <div className="pulse-left">
                    <div className="market-status">
                        <div className="status-dot animate-pulse"></div>
                        <span>Live Memory tracking Active</span>
                    </div>
                    <div className="index-pill shadow-sm">
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
            <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {mainTab === 'Intraday' ? (
                    <>
                        <MetricCard 
                            title="Total Intraday Stocks" 
                            value={filteredData.metrics.intraday?.count || 0} 
                            sub="Positions active today"
                            trend={1}
                            icon={<Briefcase size={20} />}
                        />
                        <MetricCard 
                            title="Intraday Long P/L" 
                            value={formatCurrency(timeframe === 'Today' ? filteredData.metrics.intraday?.today_long_pl_abs : filteredData.metrics.intraday?.long_pl_abs)} 
                            sub={
                                <span style={{ opacity: 0.8 }}>
                                    Yield from bullish setups {timeframe === 'Today' ? '(Today)' : ''}
                                </span>
                            }
                            trend={timeframe === 'Today' ? filteredData.metrics.intraday?.today_long_pl_abs : filteredData.metrics.intraday?.long_pl_abs}
                            icon={<TrendingUp size={20} style={{ color: '#10b981' }} />}
                        />
                        <MetricCard 
                            title="Intraday Short P/L" 
                            value={formatCurrency(timeframe === 'Today' ? filteredData.metrics.intraday?.today_short_pl_abs : filteredData.metrics.intraday?.short_pl_abs)} 
                            sub={
                                <span style={{ opacity: 0.8 }}>
                                    Yield from bearish setups {timeframe === 'Today' ? '(Today)' : ''}
                                </span>
                            }
                            trend={timeframe === 'Today' ? filteredData.metrics.intraday?.today_short_pl_abs : filteredData.metrics.intraday?.short_pl_abs}
                            icon={<TrendingDown size={20} style={{ color: '#f43f5e' }} />}
                        />
                        <MetricCard 
                            title="Intraday Overall P/L" 
                            value={formatCurrency(timeframe === 'Today' ? filteredData.metrics.intraday?.today_pl_abs : filteredData.metrics.intraday?.total_pl_abs)} 
                            sub={
                                <>
                                    {timeframe === 'Today' ? 'Active session performance' : `Cumulative period: ${timeframe}`}
                                    <span style={{ fontSize: '0.7rem', opacity: 0.8, marginLeft: '4px' }}>
                                        ({filteredData.metrics.intraday?.today_pl_pct >= 0 ? '+' : ''}{formatNumber(filteredData.metrics.intraday?.today_pl_pct || 0)}%)
                                    </span>
                                </>
                            }
                            trend={timeframe === 'Today' ? filteredData.metrics.intraday?.today_pl_abs : filteredData.metrics.intraday?.total_pl_abs}
                            icon={<Activity size={20} style={{ color: '#ec4899' }} />}
                        />
                    </>
                ) : (
                    <>
                        <MetricCard 
                            title="Portfolio Value" 
                            value={formatCurrency(filteredData.metrics.total_value)} 
                            sub={`${filteredData.metrics.total_pl_pct >= 0 ? '+' : ''}${formatNumber(filteredData.metrics.total_pl_pct)}%`}
                            trend={filteredData.metrics.total_pl_pct}
                            icon={<Briefcase size={20} />}
                        />
                        <MetricCard 
                            title="Investment P/L" 
                            value={formatCurrency(timeframe === 'Today' ? filteredData.metrics.today_pl_abs : filteredData.metrics.total_pl_abs)} 
                            sub={
                                <>
                                    Today: {filteredData.metrics.today_pl_abs >= 0 ? '+' : ''}{formatCurrency(filteredData.metrics.today_pl_abs)}
                                    <span style={{ fontSize: '0.7rem', opacity: 0.8, marginLeft: '4px' }}>
                                        ({filteredData.metrics.today_pl_pct >= 0 ? '+' : ''}{formatNumber(filteredData.metrics.today_pl_pct)}%)
                                    </span>
                                </>
                            }
                            trend={filteredData.metrics.today_pl_abs}
                            icon={<Activity size={20} />}
                        />
                        <MetricCard 
                            title="Last 30 Days P/L" 
                            value={formatCurrency(filteredData.metrics.last_30d_pnl?.total || 0)} 
                            sub={
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ color: '#10b981' }}>L: {formatCurrency(filteredData.metrics.last_30d_pnl?.long || 0)}</span>
                                    <span style={{ color: '#f43f5e' }}>S: {formatCurrency(filteredData.metrics.last_30d_pnl?.short || 0)}</span>
                                </div>
                            }
                            trend={filteredData.metrics.last_30d_pnl?.total || 0}
                            icon={<Calendar size={20} />}
                        />
                        <MetricCard 
                            title="Alpha Performer" 
                            value={
                                <span 
                                    onClick={() => filteredData.metrics.best_performer && (navigate(`/analyse-stock?symbol=${filteredData.metrics.best_performer.symbol}`))}
                                    style={{ cursor: filteredData.metrics.best_performer ? 'pointer' : 'default' }}
                                >
                                    {filteredData.metrics.best_performer?.symbol || "---"}
                                </span>
                            } 
                            sub={filteredData.metrics.best_performer ? `${formatNumber(filteredData.metrics.best_performer.pl_pct)}%` : 'No snapshots'}
                            trend={1}
                            icon={<ArrowUpRight size={20} />}
                        />
                    </>
                )}
            </div>

            {/* Performance Row */}
            <div className="charts-row">
                <div className="card main-chart-card glass-card shadow-glow">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3><Activity size={18} /> Portfolio Performance Intelligence</h3>
                        <div className="chart-mode-toggle shadow-sm" style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.25rem' }}>
                            <button 
                                className={`mode-btn ${chartMode === 'pnl' ? 'active' : ''}`}
                                onClick={() => setChartMode('pnl')}
                                style={{ 
                                    padding: '0.4rem 1rem', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800',
                                    background: chartMode === 'pnl' ? 'var(--accent-primary)' : 'transparent',
                                    color: chartMode === 'pnl' ? 'white' : 'var(--text-muted)',
                                    cursor: 'pointer', transition: 'all 0.3s'
                                }}
                            >
                                ₹ P/L
                            </button>
                            <button 
                                className={`mode-btn ${chartMode === 'return' ? 'active' : ''}`}
                                onClick={() => setChartMode('return')}
                                style={{ 
                                    padding: '0.4rem 1rem', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800',
                                    background: chartMode === 'return' ? 'var(--accent-primary)' : 'transparent',
                                    color: chartMode === 'return' ? 'white' : 'var(--text-muted)',
                                    cursor: 'pointer', transition: 'all 0.3s'
                                }}
                            >
                                % Return
                            </button>
                        </div>
                    </div>
                    <div className="chart-container" style={{ position: 'relative' }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={chartMode + timeframe + mainTab + subTab}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                style={{ minHeight: '380px' }}
                            >
                                <PortfolioPerformanceChart 
                                    timeframe={timeframe} 
                                    category={mainTab === 'Investment' ? (subTab === 'All' ? 'Investment' : subTab) : 'Intraday'} 
                                    mode={chartMode} 
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <div className="card distribution-card glass-card">
                    <div className="card-header">
                        <h3><PieChart size={18} /> Asset Allocation</h3>
                    </div>
                    <div className="chart-container" style={{ padding: '0 1rem' }}>
                        <AssetAllocationChart watchlist={filteredData.watchlist} />
                    </div>
                </div>
            </div>

            {/* Bar Charts Row */}
            <div className="charts-row secondary">
                <div className="card bar-chart-card glass-card">
                    <div className="card-header">
                        <h3><TrendingUp size={18} /> Performance Ranking</h3>
                    </div>
                    <div className="chart-container">
                        <PerformanceRankingChart data={filteredData.performanceBars} />
                    </div>
                </div>

                <div className="card bar-chart-card glass-card">
                    <div className="card-header">
                        <h3><BarChart3 size={18} /> Capital Concentration</h3>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={filteredData.positionSizes}>
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} axisLine={false} tickLine={false} fontWeight="700" />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={30}>
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
            <div className="card glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Award size={20} className="text-gradient" />
                        <h3 style={{ textTransform: 'none', fontWeight: '850' }}>System Positions <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>• Quantitative Strategy Engine</span></h3>
                    </div>
                    <div style={{ color: 'var(--warning)', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertCircle size={14} /> SL & Target are system-generated estimates, not financial advice
                    </div>
                </div>

                <div className="pos-tabs" style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem' }}>
                    {[
                        { id: 'ACTIVE', label: 'ACTIVE', count: posCounts.active },
                        { id: 'TARGET_HIT', label: 'TARGET HIT', count: posCounts.target },
                        { id: 'SL_HIT', label: 'SL HIT', count: posCounts.sl }
                    ].map(t => (
                        <button 
                            key={t.id}
                            className={`pos-tab-btn ${posTab === t.id ? 'active' : ''}`}
                            onClick={() => setPosTab(t.id)}
                            style={{
                                background: posTab === t.id ? 'var(--accent-primary)' : 'transparent',
                                color: posTab === t.id ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                padding: '0.5rem 1.25rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '900',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t.label} <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>({t.count})</span>
                        </button>
                    ))}
                </div>

                <div className="positions-table-wrapper" style={{ overflowX: 'auto' }}>
                    <table className="positions-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '900' }}>
                                <th style={{ padding: '0.5rem 1rem' }}>Asset</th>
                                <th style={{ padding: '0.5rem' }}>Strategy</th>
                                <th style={{ padding: '0.5rem' }}>Date</th>
                                <th style={{ padding: '0.5rem' }}>Entry</th>
                                <th style={{ padding: '0.5rem' }}>Current</th>
                                <th style={{ padding: '0.5rem' }}>Side</th>
                                <th style={{ padding: '0.5rem' }}>SL</th>
                                <th style={{ padding: '0.5rem' }}>Target</th>
                                <th style={{ padding: '0.5rem' }}>Exit</th>
                                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Overall PnL</th>
                                <th style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>Alpha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayPositions.map(item => (
                                <tr key={item.id} className="table-row-hover shadow-sm" style={{ background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.3s' }}>
                                    <td style={{ padding: '0.75rem 1rem', borderRadius: '8px 0 0 8px' }}>
                                        <div onClick={() => navigate(`/analyse-stock?symbol=${item.symbol}`)} style={{ fontWeight: '900', color: 'var(--text-primary)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                                            {item.symbol}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <span className="category-pill" style={{ opacity: 0.8, fontSize: '0.55rem', padding: '2px 6px' }}>{item.category?.toUpperCase() || 'CORE'}</span>
                                    </td>
                                    <td style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                        {item.added_at ? new Date(item.added_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '---'}
                                    </td>
                                    <td style={{ padding: '0.5rem', fontWeight: '800', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.2px' }}>
                                        ₹{formatNumber(item.entry_price)}
                                    </td>
                                    <td style={{ padding: '0.5rem', fontWeight: '800', fontSize: '0.85rem', color: '#fff', letterSpacing: '0.2px' }}>
                                        ₹{formatNumber(item.latest_price)}
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <span style={{ 
                                            fontSize: '0.65rem', fontWeight: '900', padding: '4px 8px', borderRadius: '4px',
                                            background: item.side === 'SHORT' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            color: item.side === 'SHORT' ? '#f43f5e' : '#10b981',
                                            border: `1px solid ${item.side === 'SHORT' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                                        }}>
                                            {item.side || 'LONG'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.5rem', color: '#f87171', fontWeight: '800', fontSize: '0.8rem' }}>
                                        ₹{formatNumber(item.stop_loss)}
                                    </td>
                                    <td style={{ padding: '0.5rem', color: '#34d399', fontWeight: '800', fontSize: '0.8rem' }}>
                                        ₹{formatNumber(item.target_price)}
                                    </td>
                                    <td style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                        {item.exit_date ? new Date(item.exit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '---'}
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '800', fontSize: '0.85rem', color: item.latest_pnl >= 0 ? '#10b981' : '#f43f5e' }}>
                                        {formatCurrency(item.latest_pnl * item.quantity)}
                                    </td>
                                    <td style={{ textAlign: 'right', padding: '0.75rem 1rem', borderRadius: '0 8px 8px 0' }}>
                                        <div style={{ fontWeight: '950', color: item.latest_pnl_percent >= 0 ? '#10b981' : '#f43f5e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                            {item.latest_pnl_percent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {formatNumber(Math.abs(item.latest_pnl_percent))}%
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredData.watchlist.length === 0 && (
                        <div className="empty-state-table">
                           <Activity size={32} />
                           <p>No performance data captured for this period.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .glass-card {
                    background: rgba(15, 23, 42, 0.4) !important;
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .shadow-glow {
                    box-shadow: 0 0 40px -10px rgba(99, 102, 241, 0.1);
                }
                .text-gradient {
                    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .filter-chip {
                    padding: 0.5rem 1.25rem !important;
                    border-radius: 12px;
                }
                .category-pill {
                    font-size: 0.65rem; font-weight: 850; color: var(--text-muted); 
                    background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 6px; 
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .badge-premium {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white; font-size: 0.6rem; font-weight: 950;
                    padding: 4px 10px; border-radius: 100px; letter-spacing: 1px;
                }
                .table-row-hover:hover {
                    background: rgba(255,255,255,0.05) !important;
                    transform: scale(1.005) translateX(5px);
                }
                .export-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.9);
                    padding: 0.6rem 1.2rem;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .export-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }
                .pos-tab-btn {
                    opacity: 0.7;
                    transition: all 0.3s;
                }
                .pos-tab-btn:hover {
                    opacity: 1;
                    transform: translateY(-1px);
                }
                .pos-tab-btn.active {
                    opacity: 1;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }
                .empty-state-table {
                    text-align: center; padding: 4rem; color: var(--text-muted);
                    display: flex; flex-direction: column; align-items: center; gap: 1rem;
                }
                .flex-col-center { display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
        </div>
    );
};

const MetricCard = ({ title, value, sub, trend, icon }) => (
    <div className="card metric-card glass-card shadow-sm border-thin">
        <div className="card-top">
            <span className="title" style={{ letterSpacing: '0.5px' }}>{title}</span>
            <span className="icon" style={{ background: trend >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: trend >= 0 ? '#22c55e' : '#ef4444' }}>{icon}</span>
        </div>
        <div className="value" style={{ fontSize: '1.5rem' }}>{value}</div>
        <div className={`sub ${trend >= 0 ? 'pos' : 'neg'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{sub}</span>
        </div>
    </div>
);

const MoversList = ({ title, data, type, formatCurrency, formatNumber }) => (
    <div className="card movers-list-card glass-card">
        <h4 style={{ color: type === 'gainers' ? '#22c55e' : '#ef4444', marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '0.5px' }}>{title}</h4>
        <div className="movers-items">
            {(data || []).map((ticker, idx) => (
                <div key={idx} className="mover-item" style={{ padding: '0.8rem 0' }}>
                    <div className="mover-info">
                        <h5 
                            onClick={() => window.location.href = `/analyse-stock?symbol=${ticker.symbol}`}
                            style={{ cursor: 'pointer', margin: 0, fontWeight: '850', fontSize: '0.9rem', transition: 'color 0.2s' }}
                        >
                            {ticker.symbol}
                        </h5>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>NSE Ticker</span>
                    </div>
                    <div className="mover-metrics">
                        <span className="price" style={{ fontSize: '0.9rem' }}>{formatCurrency(ticker.price)}</span>
                        <span className={`change ${type === 'gainers' ? 'pos' : 'neg'}`} style={{ fontWeight: '900' }}>{type === 'gainers' ? '+' : ''}{formatNumber(ticker.change_pct)}%</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default Dashboard;
