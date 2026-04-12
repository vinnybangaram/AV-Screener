import React, { useState, useEffect, useRef } from 'react';
import { 
    Send, 
    MessageSquare, 
    History, 
    Zap, 
    ChevronDown, 
    ChevronUp, 
    Loader2, 
    Target, 
    TrendingUp, 
    Info, 
    Cpu,
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { askAnalyst, fetchChatHistory } from '../../services/api';
import toast from 'react-hot-toast';

const ChatAnalyst = ({ symbol }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const messagesEndRef = useRef(null);

    const suggestions = symbol ? [
        `What is the price target for ${symbol}?`,
        `Should I buy ${symbol} for long term?`,
        `What are the major risks for ${symbol}?`,
        `Explain recent news impact on ${symbol}.`
    ] : [
        "What is the current market sentiment?",
        "Which sectors are performing best today?",
        "Any major macro risks I should know?",
        "How is the Nifty 50 looking?"
    ];

    useEffect(() => {
        loadHistory();
        // Initial bot greeting
        setMessages([{
            id: 'bot-1',
            type: 'bot',
            text: symbol 
                ? `System online. I am your Institutional AI Analyst for **${symbol}**. Ask me any data-backed question.`
                : "System online. I am your Global Market Analyst. Ask me anything about the Indian markets or macro trends.",
            timestamp: new Date().toISOString()
        }]);
    }, [symbol]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadHistory = async () => {
        try {
            const data = await fetchChatHistory(symbol);
            setHistory(data);
        } catch (e) {
            console.error("History failed:", e);
        }
    };

    const handleSend = async (forcedQuestion) => {
        const question = forcedQuestion || input;
        if (!question.trim()) return;

        const userMsg = {
            id: Date.now().toString(),
            type: 'user',
            text: question,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await askAnalyst(symbol, question);
            
            const botMsg = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                isStructured: true,
                data: response,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, botMsg]);
            loadHistory();
        } catch (e) {
            toast.error("AI Analysis Hub is currently saturated.");
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                text: "My neural link was interrupted. Please re-synchronize.",
                timestamp: new Date().toISOString(),
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-analyst-container">
            {/* Header */}
            <div className="chat-header">
                <div className="header-left">
                    <div className="status-pulse"></div>
                    <Cpu size={18} className="icon-ai" />
                    <span>AI QUANT ANALYST</span>
                </div>
                <button 
                    className={`btn-history ${historyOpen ? 'active' : ''}`}
                    onClick={() => setHistoryOpen(!historyOpen)}
                >
                    <History size={16} />
                </button>
            </div>

            {/* History Overlay */}
            <AnimatePresence>
                {historyOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="chat-history-overlay"
                    >
                        <h3>Recent Terminal Queries</h3>
                        <div className="history-list">
                            {history.length > 0 ? history.map(h => (
                                <div key={h.id} className="history-item" onClick={() => { handleSend(h.question); setHistoryOpen(false); }}>
                                    <MessageSquare size={12} />
                                    <span>{h.question}</span>
                                </div>
                            )) : <div className="no-history">No previous sessions found.</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Body */}
            <div className="chat-body">
                {messages.map((msg, idx) => (
                    <div key={msg.id} className={`message-wrapper ${msg.type}`}>
                        <div className="message-bubble">
                            {msg.isStructured ? (
                                <div className="structured-analysis">
                                    <div className="ai-answer">{msg.data.answer}</div>
                                    
                                    <div className="analysis-grid">
                                        <div className="meta-box">
                                            <div className="label">TARGET RANGE</div>
                                            <div className="value highlight">{msg.data.targetRange}</div>
                                        </div>
                                        <div className="meta-box">
                                            <div className="label">CONFIDENCE</div>
                                            <div className={`value ${msg.data.confidence === 'High' ? 'positive' : 'warning'}`}>
                                                {msg.data.confidence}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="reasoning-section">
                                        <div className="section-label">QUANT REASONING</div>
                                        <div className="reasoning-list">
                                            {msg.data.reasoning.map((r, i) => (
                                                <div key={i} className="reason-item">
                                                    <div className="dot"></div>
                                                    <span>{r}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="disclaimer">
                                        <ShieldCheck size={10} /> Model data based on real-time volatility. No guarantees.
                                    </div>
                                </div>
                            ) : (
                                <div className="msg-text">{msg.text}</div>
                            )}
                        </div>
                        <div className="timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                ))}
                {loading && (
                    <div className="message-wrapper bot">
                        <div className="message-bubble loading">
                            <span className="dot-typing"></span>
                            <span className="dot-typing"></span>
                            <span className="dot-typing"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-footer">
                {messages.length < 3 && !loading && (
                    <div className="suggestions-bar">
                        {suggestions.map((s, i) => (
                            <button key={i} className="suggestion-chip" onClick={() => handleSend(s)}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}
                <div className="input-wrapper">
                    <input 
                        type="text" 
                        placeholder={symbol ? `Query institutional AI for ${symbol}...` : "Query Global Market Intelligence..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        disabled={loading}
                    />
                    <button className="send-btn" onClick={() => handleSend()} disabled={loading || !input.trim()}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                    </button>
                </div>
            </div>

            <style>{`
                .chat-analyst-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    max-height: 600px;
                    background: rgba(13, 21, 38, 0.4);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    overflow: hidden;
                    position: relative;
                }

                .chat-header {
                    padding: 1rem 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.02);
                    border-bottom: 1px solid var(--border-color);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.75rem;
                    font-weight: 850;
                    letter-spacing: 1px;
                    color: var(--text-secondary);
                }

                .status-pulse {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #22c55e;
                    animation: pulse 2s infinite;
                }

                .icon-ai { color: var(--accent-primary); }

                .btn-history {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 0.4rem;
                    border-radius: 8px;
                }
                .btn-history:hover { color: var(--accent-primary); background: rgba(255,255,255,0.05); }
                .btn-history.active { color: var(--accent-primary); background: rgba(99,102,241,0.1); }

                .chat-history-overlay {
                    position: absolute;
                    top: 50px;
                    left: 0;
                    right: 0;
                    z-index: 100;
                    background: rgba(13, 21, 38, 0.95);
                    backdrop-filter: blur(10px);
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    max-height: 300px;
                    overflow-y: auto;
                }

                .chat-history-overlay h3 {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: var(--text-secondary);
                    margin-bottom: 1rem;
                    letter-spacing: 1.5px;
                }

                .history-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .history-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .history-item:hover { border-color: var(--accent-primary); background: rgba(99,102,241,0.05); }

                .chat-body {
                    flex: 1;
                    padding: 1.5rem;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    scrollbar-width: thin;
                }

                .message-wrapper {
                    display: flex;
                    flex-direction: column;
                    max-width: 85%;
                }
                .message-wrapper.user { align-self: flex-end; align-items: flex-end; }
                .message-wrapper.bot { align-self: flex-start; }

                .message-bubble {
                    padding: 1rem 1.25rem;
                    border-radius: 18px;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }

                .user .message-bubble {
                    background: var(--accent-primary);
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .bot .message-bubble {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--border-color);
                    border-bottom-left-radius: 4px;
                    color: var(--text-primary);
                }

                .structured-analysis { display: flex; flex-direction: column; gap: 1rem; }
                .ai-answer { font-weight: 500; }
                
                .analysis-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                }

                .meta-box {
                    background: rgba(0,0,0,0.2);
                    padding: 0.75rem;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                }
                .meta-box .label { font-size: 0.6rem; color: var(--text-secondary); margin-bottom: 4px; font-weight: 800; }
                .meta-box .value { font-size: 0.85rem; font-weight: 950; }
                .meta-box .value.highlight { color: var(--accent-primary); }
                .meta-box .value.positive { color: #22c55e; }
                .meta-box .value.warning { color: #f59e0b; }

                .reasoning-section {
                    background: rgba(255,255,255,0.01);
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                }
                .section-label { font-size: 0.65rem; color: var(--text-secondary); font-weight: 900; margin-bottom: 0.75rem; letter-spacing: 1px; }
                .reasoning-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .reason-item { display: flex; gap: 0.75rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; }
                .reason-item .dot { width: 5px; height: 5px; background: var(--accent-primary); border-radius: 50%; margin-top: 6px; flex-shrink: 0; }

                .disclaimer {
                    font-size: 0.6rem;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    opacity: 0.7;
                }

                .timestamp { font-size: 0.65rem; color: var(--text-muted); margin-top: 0.5rem; }
                
                .dot-typing {
                    height: 5px; width: 5px;
                    background: var(--text-secondary);
                    border-radius: 50%;
                    display: inline-block;
                    margin-right: 4px;
                    animation: typing 1s infinite alternate;
                }
                .dot-typing:nth-child(2) { animation-delay: 0.2s; }
                .dot-typing:nth-child(3) { animation-delay: 0.4s; }

                @keyframes typing { from { opacity: 0.3; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }

                .chat-footer {
                    padding: 1.5rem;
                    background: rgba(255,255,255,0.01);
                    border-top: 1px solid var(--border-color);
                }

                .suggestions-bar {
                    display: flex;
                    gap: 0.5rem;
                    overflow-x: auto;
                    padding-bottom: 1rem;
                    scrollbar-width: none;
                }
                .suggestion-chip {
                    flex-shrink: 0;
                    padding: 0.5rem 0.75rem;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--border-color);
                    border-radius: 30px;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s;
                }
                .suggestion-chip:hover { border-color: var(--accent-primary); color: var(--accent-primary); background: rgba(99,102,241,0.05); }

                .input-wrapper {
                    display: flex;
                    gap: 0.75rem;
                    background: rgba(0,0,0,0.2);
                    padding: 0.5rem 0.5rem 0.5rem 1.25rem;
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    transition: all 0.2s;
                }
                .input-wrapper:focus-within { border-color: var(--accent-primary); box-shadow: 0 0 15px rgba(99,102,241,0.1); }
                
                .input-wrapper input {
                    flex: 1;
                    background: none;
                    border: none;
                    color: white;
                    outline: none;
                    font-size: 0.9rem;
                }

                .send-btn {
                    width: 40px;
                    height: 40px;
                    background: var(--accent-primary);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                }
                .send-btn:hover { transform: scale(1.05); box-shadow: 0 6px 16px rgba(99, 102, 241, 0.6); }
                .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }

                .message-bubble.loading { display: flex; align-items: center; gap: 4px; padding: 0.75rem 1.25rem; }
            `}</style>
        </div>
    );
};

export default ChatAnalyst;
