import React, { useState } from 'react';
import ChatToggleButton from './ChatToggleButton';
import ChatWindow from './ChatWindow';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const toggleChat = () => {
        if (isOpen && isMinimized) {
            setIsMinimized(false);
        } else {
            setIsOpen(!isOpen);
            setIsMinimized(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsMinimized(false);
    };

    const handleToggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    return (
        <div className="global-ai-widget">
            <ChatWindow 
                isOpen={isOpen} 
                isMinimized={isMinimized} 
                onToggleMinimize={handleToggleMinimize}
                onClose={handleClose}
            />
            <ChatToggleButton 
                isOpen={isOpen && !isMinimized} 
                onClick={toggleChat} 
            />

            <style>{`
                .global-ai-widget {
                    position: fixed;
                    bottom: 25px;
                    right: 25px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 15px;
                    pointer-events: none;
                }

                .global-ai-widget > * {
                    pointer-events: auto;
                }

                .chat-toggle-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: var(--accent-primary);
                    color: white;
                    border: none;
                    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                }

                .chat-toggle-btn.open {
                    background: #1e293b;
                    transform: rotate(90deg);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                }

                .notification-dot {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 14px;
                    height: 14px;
                }

                .notification-dot .dot {
                    display: block;
                    width: 100%;
                    height: 100%;
                    background: #ef4444;
                    border: 2px solid white;
                    border-radius: 50%;
                }

                .notification-dot .ping {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: #ef4444;
                    border-radius: 50%;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }

                @keyframes ping {
                    75%, 100% { transform: scale(2.5); opacity: 0; }
                }

                .chat-window-container {
                    background: rgba(13, 21, 38, 0.6);
                    backdrop-filter: blur(25px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .chat-window-container.minimized {
                    cursor: pointer;
                    background: var(--bg-card);
                }

                .minimized-header {
                    height: 60px;
                    padding: 0 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                }

                .minimized-header span {
                    flex: 1;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .status-indicator {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #22c55e;
                }

                .chat-window-inner {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }

                .window-actions {
                    position: absolute;
                    top: 15px;
                    right: 60px; /* Offset to stay away from the component's internal header buttons */
                    z-index: 110;
                    display: flex;
                    gap: 8px;
                }

                .window-actions button {
                    background: rgba(255,255,255,0.05);
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 0.4rem;
                    border-radius: 8px;
                    transition: all 0.2s;
                }

                .window-actions button:hover {
                    color: white;
                    background: rgba(255,255,255,0.1);
                }

                @media (max-width: 768px) {
                    .chat-window-container {
                        position: fixed !important;
                        bottom: 0 !important;
                        right: 0 !important;
                        width: 100vw !important;
                        height: 85vh !important;
                        border-radius: 24px 24px 0 0 !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ChatWidget;
