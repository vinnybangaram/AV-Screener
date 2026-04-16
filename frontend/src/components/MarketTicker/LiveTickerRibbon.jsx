import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TickerItem from './TickerItem';
import { API_BASE_URL } from '../../services/api';

const LiveTickerRibbon = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/market/ticker`);
                setData(response.data);
            } catch (error) {
                console.error("Error fetching ticker data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // 1 min refresh for ticker
        return () => clearInterval(interval);
    }, []);

    if (loading && data.length === 0) return null;

    // Double the data for seamless looping
    const displayData = [...data, ...data];

    return (
        <div style={{
            height: '32px',
            background: 'rgba(10, 12, 16, 0.95)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'sticky',
            top: '64px',
            zIndex: 999,
            backdropFilter: 'blur(10px)'
        }}>
            {/* Market Status Label */}
            <div style={{
                height: '100%',
                background: 'var(--bg-main)',
                zIndex: 2,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.65rem',
                fontWeight: '950',
                color: 'var(--accent-primary)',
                letterSpacing: '2px',
                borderRight: '1px solid var(--border-color)',
                boxShadow: '10px 0 20px rgba(0,0,0,0.5)',
                textTransform: 'uppercase'
            }}>
                MARKET LIVE
            </div>

            {/* Marquee Container */}
            <div className="ticker-marquee-container" style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                height: '100%'
            }}>
                <div className="ticker-scroll">
                    {displayData.map((item, idx) => (
                        <TickerItem key={idx} item={item} />
                    ))}
                </div>
            </div>

            <style>{`
                .ticker-marquee-container {
                    overflow: hidden;
                    width: 100%;
                }
                .ticker-scroll {
                    display: inline-flex;
                    animation: ticker-scrolling 60s linear infinite;
                }
                .ticker-scroll:hover {
                    animation-play-state: paused;
                }
                @keyframes ticker-scrolling {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};

export default LiveTickerRibbon;
