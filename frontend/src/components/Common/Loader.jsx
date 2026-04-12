import React from 'react';
import './Loader.css';

const Loader = ({ message = "Calibrating Neural Layers...", fullPage = true }) => {
    return (
        <div className={`terminal-loader-container ${fullPage ? 'full-page' : ''}`}>
            <div className="loader-content">
                <div className="quantum-orb">
                    <div className="orb-core"></div>
                    <div className="orb-ring"></div>
                    <div className="orb-ring-2"></div>
                </div>
                
                <div className="loading-text-area">
                    <div className="loading-title">INITIALIZING TERMINAL</div>
                    <div className="loading-sub">{message}</div>
                </div>

                <div className="scan-line"></div>
            </div>
            
            <div className="bg-glitch"></div>
        </div>
    );
};

export default Loader;
