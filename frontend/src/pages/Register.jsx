import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const Register = ({ setRole }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        phoneNumber: '',
        panNumber: '',
        aadharNumber: '',
        dateOfBirth: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await apiClient.post('/auth/register', formData);
            const { accessToken, rbacRole } = response.data;
            
            setSuccess('Registration successful! Redirecting to Dashboard...');
            
            localStorage.setItem('kfintech_token', accessToken);
            localStorage.setItem('kfintech_role', rbacRole);
            setRole(rbacRole);
            
            setTimeout(() => {
                navigate('/investor');
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register account.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center items-center min-h-[85vh] py-10">
            <div className="glass-panel p-8 rounded-2xl w-full max-w-lg shadow-2xl border border-kfintech-border/50">
                <h2 className="text-3xl font-black text-white text-center mb-2 drop-shadow-md">Create Account</h2>
                <p className="text-gray-400 text-center mb-6 text-sm font-medium">Investor Service Portal</p>
                
                {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-sm text-center border border-red-500/50">{error}</div>}
                {success && <div className="bg-green-500/10 text-emerald-400 p-3 rounded-lg mb-6 text-sm text-center border border-green-500/50">{success}</div>}
                
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-extrabold tracking-widest text-kfintech-primary uppercase mb-1">Email Address</label>
                            <input 
                                type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="investor@kfintech.com"
                                className="w-full bg-kfintech-bg/80 border border-kfintech-border rounded-xl p-3 text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none shadow-inner" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold tracking-widest text-kfintech-primary uppercase mb-1">Phone Number</label>
                            <input 
                                type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required placeholder="+91 9876543210"
                                className="w-full bg-kfintech-bg/80 border border-kfintech-border rounded-xl p-3 text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none shadow-inner" 
                            />
                        </div>
                    </div>
                    
                    <div className="relative">
                        <label className="block text-xs font-extrabold tracking-widest text-kfintech-primary uppercase mb-1">Secure Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" value={formData.password} onChange={handleChange} required minLength="6" placeholder="••••••••"
                                className="w-full bg-kfintech-bg/80 border border-kfintech-border rounded-xl p-3 pr-12 text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none shadow-inner" 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-extrabold tracking-widest text-kfintech-primary uppercase mb-1">PAN Number</label>
                            <input 
                                type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} required placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }}
                                className="w-full bg-kfintech-bg/80 border border-kfintech-border rounded-xl p-3 text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none shadow-inner font-mono" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold tracking-widest text-kfintech-primary uppercase mb-1">Aadhaar Number</label>
                            <input 
                                type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} required placeholder="1234 5678 9012"
                                className="w-full bg-kfintech-bg/80 border border-kfintech-border rounded-xl p-3 text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none shadow-inner font-mono" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-extrabold tracking-widest text-kfintech-primary uppercase mb-1">Date of Birth</label>
                        <input 
                            type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required
                            className="w-full bg-kfintech-bg/80 border border-kfintech-border rounded-xl p-3 text-white focus:ring-2 focus:ring-kfintech-primary/50 focus:border-kfintech-primary outline-none shadow-inner" 
                        />
                    </div>
                    
                    <button 
                        type="submit" disabled={loading} 
                        className="w-full bg-kfintech-primary text-white font-extrabold uppercase tracking-widest text-sm p-4 rounded-xl mt-6 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Register Securely'}
                    </button>
                </form>
                
                <div className="text-center mt-6 text-sm text-gray-400">
                    Already have an account? <Link to="/login" className="text-kfintech-accent hover:text-emerald-400 hover:underline font-bold transition-colors">Sign In Here</Link>
                </div>
            </div>
        </motion.div>
    );
};

export default Register;
