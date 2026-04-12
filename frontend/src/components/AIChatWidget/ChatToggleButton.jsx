import React from 'react';
import { Cpu, X } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatToggleButton = ({ isOpen, onClick }) => {
    return (
        <motion.button
            className={`chat-toggle-btn ${isOpen ? 'open' : ''}`}
            onClick={onClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
        >
            {isOpen ? <X size={28} /> : <Cpu size={28} />}
            {!isOpen && (
                <div className="notification-dot">
                    <span className="ping"></span>
                    <span className="dot"></span>
                </div>
            )}
        </motion.button>
    );
};

export default ChatToggleButton;
