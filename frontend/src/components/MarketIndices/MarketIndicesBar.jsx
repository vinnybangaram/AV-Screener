import React, { useState, useEffect } from 'react';
import axios from 'axios';
import IndexChip from './IndexChip';
import { API_BASE_URL } from '../../services/api';

const MarketIndicesBar = () => {
    const [indices, setIndices] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchIndices = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/market/indices`);
            setIndices(response.data);
        } catch (error) {
            console.error("Error fetching market indices:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIndices();
        const interval = setInterval(fetchIndices, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, []);

    if (loading && !indices) return <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Synchronizing Engines...</div>;

    return (
        <div className="market-indices-container">
            {indices && (
                <>
                    <IndexChip index={indices.nifty} />
                    <IndexChip index={indices.banknifty} />
                    <IndexChip index={indices.sensex} />
                </>
            )}

            <style>{`
                .market-indices-container {
                    display: flex;
                    gap: 0.75rem;
                    align-items: center;
                }
                @media (max-width: 1100px) {
                    .market-indices-container {
                        overflow-x: auto;
                        max-width: 400px;
                        padding-bottom: 4px;
                        scrollbar-width: none; /* Firefox */
                    }
                    .market-indices-container::-webkit-scrollbar {
                        display: none; /* Safari and Chrome */
                    }
                }
                @media (max-width: 768px) {
                    .market-indices-container {
                        max-width: 200px;
                    }
                }
            `}</style>
        </div>
    );
};

export default MarketIndicesBar;
