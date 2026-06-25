import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const ChatbotWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: 'Hello! I am Nexus, your AI assistant. How can I help you with your investor services today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Only show for INVESTOR or ADMIN_SUPER
    if (!user || (user.role !== 'INVESTOR' && user.role !== 'ADMIN_SUPER')) return null;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), type: 'user', text: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const res = await apiClient.post('/chat/ask', { question: userMsg.text });
            const botMsg = { id: Date.now() + 1, type: 'bot', text: res.data?.data?.response || "I couldn't process that. Could you rephrase?" };
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
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] glass-panel border border-kfintech-border shadow-2xl rounded-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-kfintech-primary/10 border-b border-kfintech-primary/20 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-kfintech-primary/20 flex items-center justify-center border border-kfintech-primary/30">
                                    <Bot className="w-4 h-4 text-kfintech-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Nexus AI</h3>
                                    <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Support Agent</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-kfintech-card/30">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-2 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1 border ${
                                            msg.type === 'user' 
                                                ? 'bg-kfintech-accent/10 border-kfintech-accent/30 text-kfintech-accent' 
                                                : 'bg-kfintech-primary/10 border-kfintech-primary/30 text-kfintech-primary'
                                        }`}>
                                            {msg.type === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                        </div>
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                            msg.type === 'user'
                                                ? 'bg-kfintech-accent text-kfintech-bg font-medium rounded-tr-sm'
                                                : 'bg-kfintech-bg border border-kfintech-border text-gray-300 rounded-tl-sm'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="flex gap-2 max-w-[80%] flex-row">
                                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1 border bg-kfintech-primary/10 border-kfintech-primary/30 text-kfintech-primary">
                                            <Bot className="w-3 h-3" />
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl bg-kfintech-bg border border-kfintech-border rounded-tl-sm flex items-center gap-1">
                                            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                                            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                                            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-3 border-t border-kfintech-border bg-kfintech-bg">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="w-full bg-kfintech-card border border-kfintech-border rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-kfintech-primary focus:ring-1 focus:ring-kfintech-primary transition-all"
                                    disabled={isTyping}
                                />
                                <button 
                                    type="submit" 
                                    disabled={isTyping || !input.trim()}
                                    className="absolute right-2 p-1.5 text-kfintech-primary hover:bg-kfintech-primary/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
                whileTap={{ scale: 0.95 }}
                className={`w-14 h-14 rounded-full shadow-lg shadow-kfintech-primary/20 flex items-center justify-center transition-colors border ${
                    isOpen 
                    ? 'bg-kfintech-card text-gray-400 border-kfintech-border hover:bg-kfintech-border' 
                    : 'bg-kfintech-primary text-white border-kfintech-primary hover:bg-blue-600'
                }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </motion.button>
        </div>
    );
};

export default ChatbotWidget;
