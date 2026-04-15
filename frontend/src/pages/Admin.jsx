import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    FiUsers, 
    FiActivity, 
    FiClock, 
    FiShield, 
    FiTrendingUp, 
    FiUserCheck,
    FiMessageSquare,
    FiStar
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// ── Safe Format Helpers ────────────────────────────────────────────────────────
const formatNumber   = (v) => Number(v ?? 0).toLocaleString();
const formatCurrency = (v) => `₹${Number(v ?? 0).toLocaleString()}`;
const formatPercent  = (v) => `${Number(v ?? 0).toFixed(2)}%`;
const formatDateTime = (v) => v ? new Date(v).toLocaleString()    : 'Never';
const formatDate     = (v) => v ? new Date(v).toLocaleDateString() : '—';
const safeText       = (v) => v ?? '—';

// ── Component ─────────────────────────────────────────────────────────────────
const Admin = () => {
    const [stats, setStats]     = useState(null);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }

                const response = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/admin/analytics`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                const feedbackRes = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/admin/feedback`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setStats(response.data);
                setFeedback(feedbackRes.data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
                if (error.response?.status === 403) {
                    toast.error('Access Denied: Admin privileges required');
                    navigate('/dashboard');
                } else {
                    toast.error('Failed to load analytics');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [navigate]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="loader-ring"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="container animate-in">
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                    <FiShield size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                    <p>No analytics data available.</p>
                </div>
            </div>
        );
    }

    const cards = [
        { title: 'Total Users',  value: stats?.totalUsers         ?? stats?.total_users         ?? 0, icon: <FiUsers />,     color: 'var(--accent-primary)' },
        { title: 'DAU (24h)',    value: stats?.dailyActiveUsers    ?? stats?.dau                 ?? 0, icon: <FiActivity />,   color: 'var(--success)' },
        { title: 'MAU (30d)',    value: stats?.monthlyActiveUsers  ?? stats?.mau                 ?? 0, icon: <FiTrendingUp />, color: '#a855f7' },
        { title: 'Paid Users',   value: stats?.paidUsers           ?? stats?.paid_users          ?? 0, icon: <FiShield />,    color: 'var(--warning)' },
    ];

    const recentUsers = Array.isArray(stats?.recentUsers)
        ? stats.recentUsers
        : Array.isArray(stats?.recent_logins)
            ? stats.recent_logins
            : [];

    return (
        <div className="container animate-in">
            <header style={{ marginBottom: '2.5rem' }}>
                <div className="page-eyebrow">
                    <FiShield size={14} color="var(--accent-primary)" /> Administration
                </div>
                <h1 className="page-title">Admin Control Panel</h1>
                <p className="page-subtitle">Real-time system-wide analytics and user population monitoring.</p>
            </header>

            {/* Stats Grid */}
            <div className="responsive-grid" style={{ marginBottom: '3rem' }}>
                {cards.map((card, i) => (
                    <div key={i} className="card-stat" style={{ padding: '1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ 
                                padding: '10px', 
                                borderRadius: '12px', 
                                background: `rgba(${card.color === 'var(--accent-primary)' ? '59,130,246' : '124,58,237'}, 0.1)`,
                                color: card.color,
                                display: 'flex'
                            }}>
                                {card.icon}
                            </div>
                            <span className="badge badge-accent" style={{ fontSize: '0.6rem' }}>LIVE</span>
                        </div>
                        <div className="metric-label">{card.title}</div>
                        <div className="page-title" style={{ fontSize: '2rem', marginBottom: 0, marginTop: '0.25rem' }}>
                            {formatNumber(card.value)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Users Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FiUserCheck color="var(--accent-primary)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Recent User Activity</h2>
                </div>

                {recentUsers.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <FiActivity size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                        <p>No user activity yet.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ margin: 0, borderSpacing: 0 }}>
                            <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem' }}>User</th>
                                    <th>Role</th>
                                    <th>Plan</th>
                                    <th>Logins</th>
                                    <th>Joined</th>
                                    <th>Last Login</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentUsers.map((user, idx) => (
                                    <tr key={user?.id ?? idx}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                                    {safeText(user?.name)}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {safeText(user?.email)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${user?.role === 'admin' ? 'badge-storm' : 'badge-accent'}`}>
                                                {safeText(user?.role)}
                                            </span>
                                        </td>
                                        <td>
                                            <span 
                                                className={`badge ${user?.plan === 'pro' ? 'badge-warning' : 'badge-secondary'}`} 
                                                style={user?.plan !== 'pro' ? { background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' } : {}}
                                            >
                                                {safeText(user?.plan)}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {formatNumber(user?.login_count)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="metric-value" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                                <FiClock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                {formatDate(user?.created_at ?? user?.joined_at)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="metric-value" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                                {formatDateTime(user?.last_login ?? user?.last_login_at)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* User Feedback Section */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '3rem', marginBottom: '4rem' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FiMessageSquare color="var(--accent-primary)" />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Product Feedback</h2>
                </div>

                {feedback.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <FiMessageSquare size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                        <p>No user feedback received yet.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ margin: 0, borderSpacing: 0 }}>
                            <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem' }}>User</th>
                                    <th>Category</th>
                                    <th>Rating</th>
                                    <th>Message</th>
                                    <th>Page</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feedback.map((f, idx) => (
                                    <tr key={f.id ?? idx}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{f.user?.name}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{f.user?.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-accent">{f.category}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)' }}>
                                                {f.rating} <FiStar size={12} fill="currentColor" />
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '300px' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'normal', lineBreak: 'anywhere' }}>
                                                {f.message}
                                            </div>
                                        </td>
                                        <td>
                                            <code style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', opacity: 0.8 }}>{f.page_context}</code>
                                        </td>
                                        <td>
                                            <div className="metric-value" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                                {formatDateTime(f.created_at)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                table td { background: transparent !important; border-bottom: 1px solid var(--border-color); border-radius: 0 !important; }
                table tr:last-child td { border-bottom: none; }
                table tr:hover td { background: rgba(255,255,255,0.02) !important; }
            `}</style>
        </div>
    );
};

export default Admin;
