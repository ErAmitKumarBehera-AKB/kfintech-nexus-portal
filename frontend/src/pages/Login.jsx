import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const Login = ({ setRole }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const { accessToken, rbacRole } = response.data;

            localStorage.setItem('kfintech_token', accessToken);
            localStorage.setItem('kfintech_role', rbacRole);
            setRole(rbacRole);

            if (rbacRole === 'INVESTOR') navigate('/investor');
            else if (rbacRole === 'ADMIN_L1') navigate('/l1-maker');
            else if (rbacRole === 'ADMIN_L2') navigate('/l2-checker');
            
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login. Try checking your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center items-center min-h-[70vh]">
            <div className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl border border-kfintech-border/50">
                <h2 className="text-3xl font-black text-white text-center mb-6 drop-shadow-md">Welcome Back</h2>
                {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-sm text-center border border-red-500/50">{error}</div>}
                
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-extrabold tracking-widest text-kfintech-primary uppercase mb-2">Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            placeholder="investor@kfintech.com"
                            className="w-full bg-kfintech-bg/80 border border-kfintech-border rounded-xl p-3.5 text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none transition-all shadow-inner" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-extrabold tracking-widest text-kfintech-primary uppercase mb-2">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                required 
                                placeholder="••••••••"
                                className="w-full bg-kfintech-bg/80 border border-kfintech-border rounded-xl p-3.5 pr-12 text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none transition-all shadow-inner" 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full bg-kfintech-primary text-white font-extrabold uppercase tracking-widest text-sm p-4 rounded-xl mt-6 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>
                
                <div className="text-center mt-8 text-sm text-gray-400">
                    Don't have an account? <Link to="/register" className="text-kfintech-accent hover:text-emerald-400 hover:underline font-bold transition-colors">Register Here</Link>
                </div>
            </div>
        </motion.div>
    );
};

export default Login;
