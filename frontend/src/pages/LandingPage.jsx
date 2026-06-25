import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Shield, Clock, FileCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
    const { isAuthenticated, user, getRoleDefaultRoute } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={getRoleDefaultRoute(user?.role)} replace />;
    }

    return (
        <div className="min-h-[85vh] flex flex-col justify-center items-center text-center px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kfintech-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="z-10 max-w-4xl mx-auto mt-12">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-kfintech-primary text-sm font-medium mb-8">
                    <Shield className="w-4 h-4" />
                    <span>Enterprise Grade Security</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6">
                    KFintech <span className="text-transparent bg-clip-text bg-gradient-to-r from-kfintech-primary to-blue-400">Nexus</span> Portal
                </h1>
                
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12">
                    The next-generation investor service portal. Manage your profile, track service requests, and resolve issues instantly with AI-powered assistance.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                    <Link to="/register" className="px-8 py-4 bg-kfintech-primary hover:bg-opacity-90 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group">
                        Register Now
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/login" className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all duration-300 flex items-center justify-center">
                        Login to Portal
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left border-t border-white/10 pt-16">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="w-12 h-12 rounded-xl bg-kfintech-primary/10 flex items-center justify-center mb-4">
                            <Clock className="w-6 h-6 text-kfintech-primary" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Real-time Tracking</h3>
                        <p className="text-gray-400 text-sm">Monitor your service request SLAs and audit logs directly from your dashboard.</p>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                            <FileCheck className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">AI-Powered Validation</h3>
                        <p className="text-gray-400 text-sm">Our EasyOCR engine automatically verifies your attached documents and reduces manual rejections.</p>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                            <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Secure & Compliant</h3>
                        <p className="text-gray-400 text-sm">Fully automated access controls, encrypted data storage, and strict RBAC workflows.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
