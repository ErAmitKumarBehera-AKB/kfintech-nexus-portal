import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Mic } from 'lucide-react';
import apiClient from '../api/client';

// ── TYPEWRITER COMPONENT (Streaming UI Simulation) ──
const TypewriterText = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    
    useEffect(() => {
        let i = 0;
        const speed = 15; // ms per character
        setDisplayedText('');
        
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
                if (onComplete) onComplete();
            }
        }, speed);
        
        return () => clearInterval(timer);
    }, [text, onComplete]);

    return <span>{displayedText}</span>;
};

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hello! I am the Nexus AI Assistant. How can I help you today?', isTyping: false }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Voice AI States
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ── TEXT-TO-SPEECH (Private Offline Voice Output) ──
    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any current speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    // ── SEND CHAT MESSAGE ──
    const handleSend = async (overrideText = null) => {
        const messageText = overrideText || input;
        if (!messageText.trim()) return;
        
        const userMsg = { sender: 'user', text: messageText };
        setMessages(prev => [...prev, userMsg]);
        if (!overrideText) setInput('');
        setIsLoading(true);

        try {
            const res = await apiClient.post('/summarize/chat', { message: userMsg.text });
            const botResponse = res.data?.response || "I'm sorry, I couldn't process that.";
            
            // Add bot message with typing effect enabled
            setMessages(prev => [...prev, { sender: 'bot', text: botResponse, isTyping: true }]);
            
            // Read it out loud privately!
            speakText(botResponse);
            
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: "My connection to the AI engine was lost. Please try again later.",
                isTyping: true 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // ── SPEECH-TO-TEXT (Private Voice AI Input) ──
    const handleMicrophoneClick = async () => {
        if (isRecording) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    // Stop tracks to remove red recording dot in browser tab
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Send to backend Private Whisper AI
                    await processVoiceAudio(audioBlob);
                };

                mediaRecorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Microphone access denied:", err);
                alert("Please allow microphone permissions to use Voice AI.");
            }
        }
    };

    const processVoiceAudio = async (audioBlob) => {
        setIsLoading(true);
        const formData = new FormData();
        // The backend expects 'audio_file'
        formData.append('audio_file', audioBlob, 'recording.webm');

        try {
            // Post to our new Voice endpoint
            const res = await apiClient.post('/voice/transcribe', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const transcribedText = res.data?.text;
            if (transcribedText) {
                // Instantly send the transcribed text as a chat message
                await handleSend(transcribedText);
            }
        } catch (error) {
            console.error("Voice Processing Error:", error);
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: "Failed to transcribe voice securely. Is the Whisper AI running?",
                isTyping: true 
            }]);
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    const handleTypewriterComplete = (idx) => {
        // Mark as finished typing so it doesn't re-animate on re-render
        setMessages(prev => prev.map((msg, i) => i === idx ? { ...msg, isTyping: false } : msg));
        scrollToBottom();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-80 sm:w-96 h-[550px] glass-panel rounded-2xl shadow-2xl flex flex-col border border-kfintech-border overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-kfintech-card p-4 border-b border-kfintech-border flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Bot className="w-6 h-6 text-kfintech-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                <div>
                                    <h3 className="text-white font-bold tracking-wide">Nexus Assistant</h3>
                                    <p className="text-[10px] text-emerald-400 font-mono uppercase font-black tracking-widest">
                                        Online • Llama 3.2
                                    </p>
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
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                            {messages.map((msg, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={idx} 
                                    className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner ${
                                        msg.sender === 'user' ? 'bg-kfintech-primary text-white' : 'bg-white/10 border border-white/20 text-kfintech-primary'
                                    }`}>
                                        {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl max-w-[75%] text-sm shadow-md ${
                                        msg.sender === 'user' 
                                            ? 'bg-kfintech-primary/20 border border-kfintech-primary/30 text-white rounded-tr-sm' 
                                            : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                                    }`}>
                                        {msg.isTyping ? (
                                            <TypewriterText text={msg.text} onComplete={() => handleTypewriterComplete(idx)} />
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 border border-white/20 text-kfintech-primary flex-shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 text-kfintech-primary animate-spin" />
                                        <span className="text-xs text-gray-400">Processing...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-kfintech-card/50 border-t border-kfintech-border flex items-center gap-2">
                            {/* Voice AI Microphone Button */}
                            <button 
                                onClick={handleMicrophoneClick}
                                disabled={isLoading}
                                className={`p-3 rounded-xl transition-all shadow-lg flex-shrink-0 ${
                                    isRecording 
                                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]' 
                                        : 'bg-kfintech-bg border border-kfintech-border text-gray-400 hover:text-white hover:border-kfintech-primary'
                                }`}
                                title="Hold to speak (100% Private)"
                            >
                                <Mic className="w-4 h-4" />
                            </button>
                            
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isRecording || isLoading}
                                placeholder={isRecording ? "Listening..." : "Type your message..."}
                                className="flex-1 bg-kfintech-bg border border-kfintech-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-kfintech-primary shadow-inner disabled:opacity-50"
                            />
                            
                            <button 
                                onClick={() => handleSend(null)}
                                disabled={isLoading || !input.trim() || isRecording}
                                className="p-3 bg-kfintech-primary text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg flex-shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)] flex items-center justify-center transition-all z-50 ${
                    isOpen ? 'bg-kfintech-accent hover:bg-emerald-400 text-white' : 'bg-kfintech-primary hover:bg-blue-600 text-white'
                }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </motion.button>
        </div>
    );
};

export default ChatbotWidget;
