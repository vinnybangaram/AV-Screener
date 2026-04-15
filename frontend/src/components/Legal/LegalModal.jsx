import React from 'react';
import { X } from 'lucide-react';

const LegalModal = ({ isOpen, onClose, title, content }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div className="card animate-in" style={{
                maxWidth: '800px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-hover)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{title}</h2>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            color: 'var(--text-primary)',
                            padding: '8px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: '2rem',
                    overflowY: 'auto',
                    lineHeight: '1.8',
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem'
                }}>
                    {content}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.25rem',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'right',
                    background: 'rgba(0,0,0,0.1)'
                }}>
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
