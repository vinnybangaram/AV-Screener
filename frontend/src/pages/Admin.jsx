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
    FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Admin = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }

                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/admin/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);
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

    if (!stats) return null;

    const cards = [
        { title: 'Total Users', value: stats.totalUsers, icon: <FiUsers />, color: 'var(--accent-primary)' },
        { title: 'DAU (24h)', value: stats.dailyActiveUsers, icon: <FiActivity />, color: 'var(--success)' },
        { title: 'MAU (30d)', value: stats.monthlyActiveUsers, icon: <FiTrendingUp />, color: '#a855f7' },
        { title: 'Paid Users', value: stats.paidUsers, icon: <FiShield />, color: 'var(--warning)' },
    ];

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
                            {card.value.toLocaleString()}
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
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ margin: 0, borderSpacing: 0 }}>
                        <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <tr>
                                <th style={{ padding: '1rem 1.5rem' }}>User</th>
                                <th>Role</th>
                                <th>Plan</th>
                                <th>Joined</th>
                                <th>Last Login</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentUsers.map((user) => (
                                <tr key={user.id}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{user.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.role === 'admin' ? 'badge-storm' : 'badge-accent'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.plan === 'pro' ? 'badge-warning' : 'badge-secondary'}`} 
                                              style={user.plan !== 'pro' ? { background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)'} : {}}>
                                            {user.plan}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="metric-value" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                            <FiClock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="metric-value" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                            {new Date(user.last_login).toLocaleDateString()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
