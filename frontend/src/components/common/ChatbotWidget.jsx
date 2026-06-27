import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const ChatbotWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const messagesEndRef = useRef(null);

    // Only show for INVESTOR or ADMIN_SUPER
    if (!user || (user.role !== 'INVESTOR' && user.role !== 'ADMIN_SUPER')) return null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && !hasLoadedHistory) {
            const fetchHistory = async () => {
                try {
                    const res = await apiClient.get('/chat/history');
                    if (res.data.messages && res.data.messages.length> 0) {
                        setMessages(res.data.messages.map(m => ({
                            id: m._id || Math.random(),
                            type: m.type,
                            text: m.text,
                            sources: m.sources,
                            sentiment: m.sentiment
                        })));
                    } else {
                        setMessages([{ id: 1, type: 'bot', text: 'Hello! I am Nexus, your AI assistant. How can I help you with your investor services today?' }]);
                    }
                    setHasLoadedHistory(true);
                } catch (error) {
                    console.error("Failed to load history:", error);
                    setMessages([{ id: 1, type: 'bot', text: 'Hello! I am Nexus, your AI assistant. How can I help you with your investor services today?' }]);
                    setHasLoadedHistory(true);
                }
            };
            fetchHistory();
        }
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, hasLoadedHistory]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), type: 'user', text: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const res = await apiClient.post('/chat/ask', { question: userMsg.text });
            const aiData = res.data?.data?.botMessage || res.data?.data;
            const botMsg = { 
                id: Date.now() + 1, 
                type: 'bot', 
                text: aiData?.text || aiData?.response || "I couldn't process that. Could you rephrase?",
                sources: aiData?.sources || aiData?.retrieved_data_source || [],
                sentiment: aiData?.sentiment || 'NEUTRAL'
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg = { id: Date.now() + 1, type: 'bot', text: "Sorry, I am having trouble connecting to the AI Engine right now." };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}>
                        {/* Header */}
                        <div>
                            <div>
                                <div>
                                    <Bot  />
                                </div>
                                <div>
                                    <h3>Nexus AI</h3>
                                    <p>Support Agent</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}>
                                <X  />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div>
                            {messages.map((msg) => (
                                <div key={msg.id}>
                                    <div>
                                        <div>
                                            {msg.type === 'user' ? <User  /> : <Bot  />}
                                        </div>
                                        <div>
                                            <div>{msg.text}</div>
                                            {msg.type === 'bot' && msg.sources && msg.sources.length> 0 && (
                                                <div>
                                                    <span>Sources:</span> {msg.sources.join(', ')}
                                                </div>
                                            )}
                                            {msg.type === 'bot' && msg.sentiment === 'NEGATIVE' && (
                                                <div>
                                                    I sense this issue is frustrating. You can escalate directly by creating a complaint ticket.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div>
                                    <div>
                                        <div>
                                            <Bot  />
                                        </div>
                                        <div>
                                            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}  />
                                            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}  />
                                            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}  />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend}>
                            <div>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    
                                    disabled={isTyping}
                                />
                                <button 
                                    type="submit" 
                                    disabled={isTyping || !input.trim()}>
                                    {isTyping ? <Loader2  /> : <Send  />}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                {isOpen ? <X  /> : <MessageSquare  />}
            </motion.button>
        </div>
    );
};

export default ChatbotWidget;
