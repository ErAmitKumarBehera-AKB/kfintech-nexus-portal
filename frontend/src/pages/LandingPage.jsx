import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Shield, Clock, FileCheck, ArrowRight, Zap, Lock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/common/LandingNavbar';
import Footer from '../components/common/Footer';
import ThreeDMarqueeDemo from '../components/ThreeDMarqueeDemo';

const LandingPage = () => {
    const { isAuthenticated, user, getRoleDefaultRoute } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={getRoleDefaultRoute(user?.role)} replace />;
    }

    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.15,
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1]
            }
        })
    };

    const featureVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: (i) => ({
            opacity: 1,
            scale: 1,
            transition: {
                delay: i * 0.1,
                duration: 0.6,
                ease: "easeOut"
            }
        })
    };

    return (
        <div className="min-h-screen bg-black selection:bg-kfintech-primary/30 text-white font-sans overflow-x-hidden">
            <LandingNavbar />

            {/* Hero Section */}
            <section className="relative min-h-[100vh] flex flex-col justify-center items-center text-center px-4 pt-20">
                {/* Background Glow Effects */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-kfintech-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

                <div className="z-10 max-w-5xl mx-auto flex flex-col items-center w-full">
                    
                    <motion.div 
                        custom={0} initial="hidden" animate="visible" variants={fadeUpVariants}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm font-medium mb-8 backdrop-blur-sm"
                    >
                        <Zap className="w-4 h-4 text-kfintech-primary" />
                        <span>FinnovaX Portal 2.0 is now live</span>
                        <ChevronRight className="w-4 h-4 ml-1 opacity-50" />
                    </motion.div>

                    <motion.h1 
                        custom={1} initial="hidden" animate="visible" variants={fadeUpVariants}
                        className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-8 leading-[1.1]"
                    >
                        Next-Gen <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500">
                            Enterprise Operations.
                        </span>
                    </motion.h1>
                    
                    <motion.p 
                        custom={2} initial="hidden" animate="visible" variants={fadeUpVariants}
                        className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
                    >
                        Streamline your workflow with real-time tracking, AI-powered validations, and strict RBAC controls. 
                        Experience the future of financial operations with FinnovaX.
                    </motion.p>

                    <motion.div 
                        custom={3} initial="hidden" animate="visible" variants={fadeUpVariants}
                        className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto"
                    >
                        <Link to="/register" className="px-8 py-4 bg-white text-black hover:bg-gray-200 font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]">
                            Start for free
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/login" className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-full border border-white/10 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                            Sign in to Portal
                        </Link>
                    </motion.div>

                </div>
            </section>

            {/* Showcase Marquee Section */}
            <section className="relative w-full overflow-hidden pb-20 pt-10">
                <div className="max-w-7xl mx-auto px-6 text-center mb-10">
                    <p className="text-gray-500 font-medium tracking-widest text-sm uppercase">Trusted by modern financial teams</p>
                </div>
                <ThreeDMarqueeDemo />
            </section>

            {/* Features Section - Minimal/No Boxy Grid */}
            <section id="features" className="relative z-10 py-32 px-6 bg-black border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    
                    <div className="text-center mb-24">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">Designed for scale. <br/> Built for speed.</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">FinnovaX replaces clunky legacy systems with a seamless, intuitive, and blisteringly fast interface.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
                        {/* Feature 1 */}
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={0} variants={featureVariants}
                            className="flex flex-col items-center md:items-start text-center md:text-left group"
                        >
                            <div className="mb-6 p-4 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/10 text-white group-hover:border-kfintech-primary/50 group-hover:text-kfintech-primary transition-all duration-500">
                                <Clock className="w-8 h-8" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-4">Real-time SLAs</h3>
                            <p className="text-gray-400 leading-relaxed font-light">
                                Monitor service requests as they move through your pipeline. Get instant alerts before SLAs are breached and keep your operations flowing.
                            </p>
                        </motion.div>

                        {/* Feature 2 */}
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={1} variants={featureVariants}
                            className="flex flex-col items-center md:items-start text-center md:text-left group"
                        >
                            <div className="mb-6 p-4 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/10 text-white group-hover:border-blue-400/50 group-hover:text-blue-400 transition-all duration-500">
                                <FileCheck className="w-8 h-8" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-4">AI Validations</h3>
                            <p className="text-gray-400 leading-relaxed font-light">
                                Stop wasting time on manual document checks. Our built-in EasyOCR engine automatically extracts and verifies data instantly.
                            </p>
                        </motion.div>

                        {/* Feature 3 */}
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} custom={2} variants={featureVariants}
                            className="flex flex-col items-center md:items-start text-center md:text-left group"
                        >
                            <div className="mb-6 p-4 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/10 text-white group-hover:border-purple-400/50 group-hover:text-purple-400 transition-all duration-500">
                                <Lock className="w-8 h-8" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-4">Zero Trust Security</h3>
                            <p className="text-gray-400 leading-relaxed font-light">
                                Fully automated access controls, strict RBAC workflows, and encrypted data storage built natively into the core of the platform.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="security" className="relative z-10 py-32 px-6 border-t border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-kfintech-primary/5 to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-8">Ready to upgrade?</h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-light">
                        Join the next generation of financial institutions streamlining their entire workflow with FinnovaX.
                    </p>
                    <Link to="/register" className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform duration-300 shadow-2xl">
                        Get Started Today
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;
