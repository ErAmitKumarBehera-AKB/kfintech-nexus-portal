import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, AlertCircle, Send, FileText } from 'lucide-react';

const InvestorDashboard = () => {
    const [formData, setFormData] = useState({ title: '', category: 'Mutual Funds', description: '', investorName: 'Amit', accountNumber: '9876543210' });
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Pre-load the demo document so the user doesn't have to manually upload it
        fetch('/demo_statement.png')
            .then(res => res.blob())
            .then(blob => {
                const demoFile = new File([blob], 'demo_statement.png', { type: 'image/png' });
                setFile(demoFile);
            })
            .catch(err => console.error('Failed to load demo document:', err));
    }, []);

    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const complaintText = `[${formData.category}] ${formData.title} - ${formData.description}`;
            
            const payload = new FormData();
            payload.append('complaintText', complaintText);
            payload.append('investorName', formData.investorName);
            payload.append('accountNumber', formData.accountNumber);
            if (file) {
                payload.append('file', file);
            }

            await apiClient.post('/tickets', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setStatus({ 
                type: 'success', 
                message: 'Ticket successfully transmitted. It has been queued for immediate L1 Maker review.' 
            });
            
            setFormData({ title: '', category: 'Mutual Funds', description: '', investorName: formData.investorName, accountNumber: formData.accountNumber });
            setFile(null);
        } catch (error) {
            console.error("Submission Error:", error);
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.message || 'Failed to lodge complaint. Please ensure the CRM backend is active.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 max-w-4xl mx-auto"
        >
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">Investor Service Portal</h1>
                <p className="text-gray-400 mt-3 text-lg font-medium">Securely lodge a support ticket or mutual fund complaint.</p>
            </header>

            <AnimatePresence>
                {status.message && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        className={`mb-8 p-5 rounded-xl border flex items-center gap-4 shadow-lg backdrop-blur-md ${
                            status.type === 'success' 
                                ? 'bg-kfintech-accent/10 border-kfintech-accent/50 text-emerald-400' 
                                : 'bg-kfintech-danger/10 border-kfintech-danger/50 text-red-400'
                        }`}
                    >
                        {status.type === 'success' ? <CheckCircle2 className="w-8 h-8 flex-shrink-0" /> : <AlertCircle className="w-8 h-8 flex-shrink-0" />}
                        <div>
                            <p className="font-extrabold text-sm uppercase tracking-wider text-white">
                                {status.type === 'success' ? 'Transmission Successful' : 'Transmission Error'}
                            </p>
                            <p className="font-medium mt-1">{status.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="glass-panel rounded-2xl shadow-2xl overflow-hidden relative">
                {isSubmitting && (
                    <div className="absolute inset-0 bg-kfintech-bg/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kfintech-primary"></div>
                    </div>
                )}
                
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-xs font-extrabold text-kfintech-primary mb-2 uppercase tracking-widest">Investor Name</label>
                            <select 
                                name="investorName"
                                value={formData.investorName}
                                onChange={handleChange}
                                className="w-full bg-kfintech-bg border border-kfintech-border rounded-xl p-4 text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none transition-all shadow-inner cursor-pointer appearance-none"
                            >
                                <option value="Amit">Amit (Perfect OCR Match)</option>
                                <option value="John Doe">John Doe (Failure Test)</option>
                                <option value="Jane Smith">Jane Smith (Failure Test)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold text-kfintech-primary mb-2 uppercase tracking-widest">Account Number</label>
                            <select 
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleChange}
                                className="w-full bg-kfintech-bg border border-kfintech-border rounded-xl p-4 text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none transition-all shadow-inner cursor-pointer appearance-none"
                            >
                                <option value="9876543210">9876543210 (Perfect OCR Match)</option>
                                <option value="1111111111">1111111111 (Failure Test)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-xs font-extrabold text-kfintech-primary mb-2 uppercase tracking-widest">Ticket Title</label>
                            <input 
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Brief summary of your issue"
                                className="w-full bg-kfintech-bg border border-kfintech-border rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none transition-all shadow-inner"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold text-kfintech-primary mb-2 uppercase tracking-widest">Category</label>
                            <select 
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-kfintech-bg border border-kfintech-border rounded-xl p-4 text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none transition-all shadow-inner cursor-pointer appearance-none"
                            >
                                <option value="Mutual Funds">Mutual Funds</option>
                                <option value="Corporate Registry">Corporate Registry</option>
                                <option value="Pension Services">Pension Services</option>
                                <option value="Account Access">Account Access</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-extrabold text-kfintech-primary mb-2 uppercase tracking-widest">Detailed Description</label>
                        <textarea 
                            name="description"
                            required
                            rows="5"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Please provide as much detail as possible. Our AI engine will analyze this text..."
                            className="w-full bg-kfintech-bg border border-kfintech-border rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none transition-all shadow-inner resize-none leading-relaxed"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-xs font-extrabold text-kfintech-primary mb-2 uppercase tracking-widest">Supporting Documents (Optional)</label>
                        <motion.div 
                            whileHover={{ scale: 1.01, borderColor: '#3B82F6' }}
                            whileTap={{ scale: 0.99 }}
                            onDragOver={handleDragOver}
                            onDrop={handleFileDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-kfintech-border rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer bg-kfintech-bg/50 hover:bg-kfintech-bg transition-colors group relative overflow-hidden"
                        >
                            <input 
                                type="file" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={(e) => setFile(e.target.files[0])}
                                accept="image/jpeg, image/png, application/pdf"
                            />
                            
                            <div className="bg-kfintech-card p-4 rounded-full shadow-lg mb-4 border border-kfintech-border group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                                {file ? <FileText className="w-10 h-10 text-kfintech-accent" /> : <UploadCloud className="w-10 h-10 text-gray-500 group-hover:text-kfintech-primary" />}
                            </div>
                            
                            {file ? (
                                <div className="text-center z-10">
                                    <p className="text-kfintech-accent font-extrabold text-lg drop-shadow-md">{file.name}</p>
                                    <p className="text-gray-400 text-sm mt-1">Ready for upload</p>
                                </div>
                            ) : (
                                <div className="text-center z-10">
                                    <p className="text-white font-bold text-lg mb-1">Click to upload or drag and drop</p>
                                    <p className="text-sm text-gray-500 font-medium">JPEG, PNG, or PDF up to 5MB</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>

                <div className="bg-kfintech-bg/80 p-6 flex justify-end border-t border-kfintech-border/50">
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        disabled={isSubmitting}
                        className={`flex items-center gap-2 px-10 py-4 bg-kfintech-primary text-white font-extrabold rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all uppercase tracking-widest text-sm ${
                            isSubmitting ? 'opacity-70 cursor-wait' : 'hover:bg-blue-600 hover:shadow-[0_0_25px_rgba(59,130,246,0.7)]'
                        }`}
                    >
                        {isSubmitting ? 'Processing AI Triage...' : (
                            <>
                                Lodge Ticket Securely
                                <Send className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>
                </div>
            </form>
        </motion.div>
    );
};

export default InvestorDashboard;
