import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Copy, Check, Info } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

// --- Sound Effects Utility ---
const playSound = (type) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const now = ctx.currentTime;
        
        if (type === 'send') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'receive') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    } catch (e) {
        console.warn("AudioContext not supported or blocked");
    }
};

// --- Interactive Eye Icon Component ---
const InteractiveEyeIcon = ({ size = 24, className = "", isClosed = false }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isBlinking, setIsBlinking] = useState(false);
    const eyeRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!eyeRef.current || isClosed) return;
            const rect = eyeRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const maxRadius = 3;
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            let pupilX = 0;
            let pupilY = 0;
            
            if (distance > 0) {
                const moveDist = Math.min(distance * 0.08, maxRadius);
                pupilX = (dx / distance) * moveDist;
                pupilY = (dy / distance) * moveDist;
            }
            
            setMousePos({ x: pupilX, y: pupilY });
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isClosed]);

    useEffect(() => {
        let timeoutId;
        const blinkLoop = () => {
            if (isClosed) return;
            const timeToNextBlink = Math.random() * 4000 + 2000;
            timeoutId = setTimeout(() => {
                setIsBlinking(true);
                setTimeout(() => {
                    setIsBlinking(false);
                    blinkLoop();
                }, 150);
            }, timeToNextBlink);
        };
        blinkLoop();
        return () => clearTimeout(timeoutId);
    }, [isClosed]);

    return (
        <div ref={eyeRef} className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox="0 0 24 24" className="drop-shadow-sm overflow-visible">
                {isClosed ? (
                    // Closed eyes (straight/curved lines)
                    <>
                        <path d="M 4 12 Q 7 15 10 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-zinc-400 dark:text-zinc-600" />
                        <path d="M 14 12 Q 17 15 20 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-zinc-400 dark:text-zinc-600" />
                    </>
                ) : (
                    // Open eyes
                    <>
                        <ellipse cx="7" cy="12" rx="4.5" ry={isBlinking ? 0.5 : 5.5} fill="currentColor" strokeWidth="1.5" className="text-white stroke-transparent dark:stroke-zinc-950 transition-all" />
                        {!isBlinking && <circle cx={7 + mousePos.x} cy={12 + mousePos.y} r="2" fill="currentColor" className="text-zinc-950" />}
                        
                        <ellipse cx="17" cy="12" rx="4.5" ry={isBlinking ? 0.5 : 5.5} fill="currentColor" strokeWidth="1.5" className="text-white stroke-transparent dark:stroke-zinc-950 transition-all" />
                        {!isBlinking && <circle cx={17 + mousePos.x} cy={12 + mousePos.y} r="2" fill="currentColor" className="text-zinc-950" />}
                    </>
                )}
            </svg>
        </div>
    );
};


const ChatbotWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [isPasswordFocus, setIsPasswordFocus] = useState(false);
    const messagesEndRef = useRef(null);

    // Global session ID for unauthenticated users
    const getSessionId = () => {
        let sid = localStorage.getItem('chat_session_id');
        if (!sid) {
            sid = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            localStorage.setItem('chat_session_id', sid);
        }
        return sid;
    };

    const sessionId = getSessionId();

    const SUGGESTED_QUESTIONS = [
        "How do I create an account?",
        "What is the SLA for a KYC update?",
        "How do I escalate a ticket?"
    ];

    useEffect(() => {
        const handleFocusIn = (e) => {
            if (e.target && e.target.type === 'password') setIsPasswordFocus(true);
        };
        const handleFocusOut = (e) => {
            if (e.target && e.target.type === 'password') setIsPasswordFocus(false);
        };
        
        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);
        
        return () => {
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    useEffect(() => {
        if (!isOpen || hasLoadedHistory) return;

        const fetchHistory = async () => {
            try {
                const res = await apiClient.get('/chat/history', {
                    headers: { 'x-session-id': sessionId }
                });
                const history = res.data.messages || [];
                if (history.length > 0) {
                    setMessages(history.map((m) => ({
                        id: m._id || `${m.type}-${m.timestamp || Date.now()}`,
                        type: m.type,
                        text: m.text,
                        sources: m.sources || [],
                        sentiment: m.sentiment || 'NEUTRAL',
                        timestamp: m.timestamp || new Date().toISOString()
                    })));
                } else {
                    setMessages([{
                        id: 'welcome',
                        type: 'bot',
                        text: 'Welcome to FinnovaX! 👋 I\'m Finnora, your AI assistant. How can I help you today?',
                        timestamp: new Date().toISOString()
                    }]);
                }
                setHasLoadedHistory(true);
            } catch (error) {
                console.error('Failed to load history:', error);
                setMessages([{
                    id: 'welcome',
                    type: 'bot',
                    text: 'Welcome to FinnovaX! 👋 I\'m Finnora, your AI assistant. How can I help you today?',
                    timestamp: new Date().toISOString()
                }]);
                setHasLoadedHistory(true);
            }
        };

        fetchHistory();
    }, [isOpen, hasLoadedHistory, sessionId]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isOpen, messages, isTyping]);

    const handleSend = async (textToSend) => {
        if (!textToSend.trim()) return;

        const userMsg = { id: Date.now(), type: 'user', text: textToSend.trim(), timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        playSound('send');

        try {
            const res = await apiClient.post('/chat/ask', { question: userMsg.text }, {
                headers: { 'x-session-id': sessionId }
            });
            const aiData = res.data?.data?.botMessage || res.data?.data;
            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: aiData?.text || aiData?.response || 'I could not process that. Please try again.',
                sources: aiData?.sources || aiData?.retrieved_data_source || [],
                sentiment: aiData?.sentiment || 'NEUTRAL',
                timestamp: new Date().toISOString()
            };
            setMessages((prev) => [...prev, botMsg]);
            playSound('receive');
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                text: 'Sorry, I am having trouble connecting to the AI engine right now.',
                timestamp: new Date().toISOString()
            }]);
            playSound('receive');
        } finally {
            setIsTyping(false);
        }
    };

    const onSubmit = (e) => {
        e.preventDefault();
        handleSend(input);
    };

    const handleCopy = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="mb-4 w-[24rem] max-w-[calc(100vw-1.5rem)] flex flex-col h-[34rem] max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 backdrop-blur-xl shadow-2xl dark:border-zinc-800 dark:bg-zinc-950/70"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-zinc-200/60 bg-white/40 px-4 py-3 dark:border-zinc-800/60 dark:bg-zinc-900/40 backdrop-blur-md z-10 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 shadow-md dark:bg-zinc-100 border border-zinc-700 dark:border-zinc-300">
                                    <InteractiveEyeIcon size={20} isClosed={isPasswordFocus} />
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-zinc-900"></span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-1">
                                        Finnora <span className="bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1 border border-zinc-300 dark:border-zinc-700">RAG</span>
                                    </h3>
                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                        <Info className="h-3 w-3" /> Support Assistant
                                    </p>
                                </div>
                            </div>
                            {/* Removed Header Close Button */}
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar bg-zinc-50/30 dark:bg-[#0f0f12]/40 relative">
                            {messages.map((msg, index) => {
                                const isUser = msg.type === 'user';
                                const isConsecutive = index > 0 && messages[index - 1].type === msg.type;

                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={msg.id} 
                                        className={`flex gap-2 relative z-10 ${isUser ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}
                                    >
                                        <div 
                                            className={`
                                                group relative max-w-[85%] px-3.5 py-2 text-[13px] leading-relaxed shadow-sm
                                                ${isUser ? 
                                                    'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900' : 
                                                    'bg-white text-zinc-900 border border-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'}
                                                ${isUser ? 
                                                    (isConsecutive ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tr-sm') : 
                                                    (isConsecutive ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-tl-sm')}
                                            `}
                                        >
                                            {!isConsecutive && (
                                                <svg 
                                                    viewBox="0 0 8 13" 
                                                    width="8" 
                                                    height="13" 
                                                    className={`absolute top-0 ${isUser ? '-right-1.5 text-zinc-900 dark:text-zinc-100' : '-left-1.5 text-white dark:text-zinc-900'}`}
                                                >
                                                    {isUser ? (
                                                        <path opacity="1" fill="currentColor" d="M5.188,1H0v11.193l6.467-8.625 C7.526,2.156,6.958,1,5.188,1z"></path>
                                                    ) : (
                                                        <path opacity="1" fill="currentColor" d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"></path>
                                                    )}
                                                </svg>
                                            )}

                                            <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                                            
                                            {msg.type === 'bot' && msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                    {msg.sources.map((src, i) => (
                                                        <span key={i} className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 shadow-sm">
                                                            DOC: {src}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className={`mt-1.5 flex items-center justify-end gap-1.5 text-[9px] font-bold ${isUser ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                                <span>{formatTime(msg.timestamp)}</span>
                                                {isUser && <Check className="h-3 w-3" />}
                                                {msg.type === 'bot' && (
                                                    <button 
                                                        onClick={() => handleCopy(msg.id, msg.text)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-zinc-900 dark:hover:text-zinc-200 ml-1"
                                                        title="Copy message"
                                                    >
                                                        {copiedId === msg.id ? <Check className="h-3 w-3 text-zinc-900 dark:text-zinc-100" /> : <Copy className="h-3 w-3" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {isTyping && (
                                <div className="flex gap-2 justify-start mt-4 relative z-10">
                                    <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 shadow-sm dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 relative">
                                        <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-1.5 text-white dark:text-zinc-900">
                                            <path opacity="1" fill="currentColor" d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"></path>
                                        </svg>
                                        <div className="flex items-center gap-1.5 h-4">
                                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ animationDelay: '0ms' }} />
                                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ animationDelay: '150ms' }} />
                                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isTyping && messages.length <= 2 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                    className="mt-6 flex flex-wrap gap-2 relative z-10 justify-end"
                                >
                                    {SUGGESTED_QUESTIONS.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(q)}
                                            className="rounded-full border border-zinc-200/60 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold text-zinc-700 shadow-sm transition-all hover:bg-zinc-100 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={onSubmit} className="border-t border-zinc-200/60 bg-white/60 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/60 backdrop-blur-md z-10">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={isTyping}
                                    className="h-10 flex-1 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800 transition-all shadow-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={isTyping || !input.trim()}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 transition-all disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 hover:scale-105 active:scale-95 shadow-md"
                                >
                                    <Send className="h-4 w-4 ml-0.5" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen((prev) => !prev)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] ring-1 ring-black/5 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white relative overflow-hidden"
                aria-label="Toggle chatbot"
            >
                <AnimatePresence>
                    {isOpen ? (
                        <motion.span
                            key="close"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.12 }}
                            className="absolute flex items-center justify-center"
                        >
                            <X className="h-6 w-6" />
                        </motion.span>
                    ) : (
                        <motion.span
                            key="eyes"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.12 }}
                            className="absolute flex items-center justify-center"
                        >
                            <InteractiveEyeIcon size={28} isClosed={isPasswordFocus} className="group-hover:scale-110 transition-transform" />
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
};

export default ChatbotWidget;
