import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Database, ArrowRight } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-[80vh] flex flex-col justify-center items-center text-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl"
            >
                <div className="inline-block bg-kfintech-primary/10 border border-kfintech-primary/30 text-kfintech-primary font-bold px-4 py-1.5 rounded-full text-sm mb-6 uppercase tracking-widest">
                    Next-Generation Financial Portal
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-xl">
                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">KFintech Nexus</span>
                </h1>

                <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                    The enterprise-grade platform for Investors, L1 Makers, and L2 Checkers. Powered by strict data normalization, AI document analysis, and zero-trust security.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
                    <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-kfintech-primary hover:bg-blue-600 text-white font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2">
                        Enter Portal <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-widest transition-all">
                        Create Account
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="glass-panel p-6 rounded-2xl border border-kfintech-border/50">
                        <ShieldCheck className="w-10 h-10 text-emerald-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">RBAC Security</h3>
                        <p className="text-sm text-gray-400">Strict Role-Based Access Control ensuring complete data isolation between Investors and Admins.</p>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl border border-kfintech-border/50">
                        <Zap className="w-10 h-10 text-amber-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">AI Auto-Fill</h3>
                        <p className="text-sm text-gray-400">Just upload your document and watch our internal Machine Learning engine extract details instantly.</p>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl border border-kfintech-border/50">
                        <Database className="w-10 h-10 text-blue-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Normalized DB</h3>
                        <p className="text-sm text-gray-400">Enterprise MongoDB architecture strictly mapping Profiles, Nominees, and complex ticket relationships.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingPage;
