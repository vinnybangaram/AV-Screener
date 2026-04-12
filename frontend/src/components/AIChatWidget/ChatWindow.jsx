import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatAnalyst from '../Chat/ChatAnalyst';
import { Maximize2, Minimize2, X } from 'lucide-react';

const ChatWindow = ({ isOpen, isMinimized, onToggleMinimize, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`chat-window-container ${isMinimized ? 'minimized' : ''}`}
                    initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        height: isMinimized ? '60px' : '600px',
                        width: isMinimized ? '280px' : '400px'
                    }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                >
                    {/* Window Controls (Custom Header for Minimized state) */}
                    {isMinimized && (
                        <div className="minimized-header" onClick={onToggleMinimize}>
                            <div className="status-indicator"></div>
                            <span>AI Analyst Active</span>
                            <Maximize2 size={14} />
                        </div>
                    )}

                    {/* Main Chat Content */}
                    {!isMinimized && (
                        <div className="chat-window-inner">
                            <div className="window-actions">
                                <button onClick={onToggleMinimize} title="Minimize">
                                    <Minimize2 size={16} />
                                </button>
                                <button onClick={onClose} title="Close">
                                    <X size={16} />
                                </button>
                            </div>
                            <ChatAnalyst symbol={null} />
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatWindow;
