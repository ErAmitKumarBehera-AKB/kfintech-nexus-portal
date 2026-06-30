import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, getRoleDefaultRoute } from './context/AuthContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import InvestorDashboard from './pages/InvestorDashboard';
import L1MakerDesk from './pages/L1MakerDesk';
import L2CheckerDesk from './pages/L2CheckerDesk';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import ThreeDMarqueeDemo from './components/ThreeDMarqueeDemo';

const AppRoutes = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-sans">
                <div className="relative flex items-center justify-center mb-8">
                    {/* Outer glowing ring */}
                    <div className="absolute w-24 h-24 border-4 border-white/10 rounded-full animate-[spin_3s_linear_infinite]" />
                    {/* Inner spinning ring */}
                    <div className="absolute w-16 h-16 border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_1s_cubic-bezier(0.5,0,0.5,1)_infinite]" />
                    {/* Center Dot */}
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                </div>
                
                <h2 className="text-xl font-medium tracking-tight mb-2">FinnovaX</h2>
                <p className="text-sm text-zinc-500 max-w-xs text-center animate-pulse">
                    Establishing secure connection...<br/>
                    <span className="text-xs mt-2 block opacity-70">(Booting up servers, this may take up to 50 seconds on first load)</span>
                </p>
            </div>
        );
    }

    return (
        <div>
            {isAuthenticated && !location.pathname.startsWith('/investor') && (
                <>
                    <Navbar />
                </>
            )}

            <main>
                <Routes>
                    {/* ── Public Routes ── */}
                    <Route 
                        path="/" 
                        element={
                            isAuthenticated 
                                ? <Navigate to={getRoleDefaultRoute(user?.role)} replace /> 
                                : <LandingPage />
                        } 
                    />

                    <Route
                        path="/login"
                        element={
                            // If already logged in, redirect away from login page
                            isAuthenticated
                                ? <Navigate to={getRoleDefaultRoute(user?.role)} replace />
                                : <LoginPage />
                        }
                    />
                    
                    <Route
                        path="/register"
                        element={
                            isAuthenticated
                                ? <Navigate to={getRoleDefaultRoute(user?.role)} replace />
                                : <RegisterPage />
                        }
                    />

                    <Route
                        path="/forgot-password"
                        element={
                            isAuthenticated
                                ? <Navigate to={getRoleDefaultRoute(user?.role)} replace />
                                : <ForgotPasswordPage />
                        }
                    />

                    {/* ── Protected: Investor ── */}
                    <Route
                        path="/investor"
                        element={
                            <ProtectedRoute allowedRoles={['INVESTOR', 'ADMIN_SUPER']}>
                                <InvestorDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* ── Protected: L1 Maker Desk ── */}
                    <Route
                        path="/l1-maker"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_L1', 'ADMIN_SUPER']}>
                                <L1MakerDesk />
                            </ProtectedRoute>
                        }
                    />

                    {/* ── Protected: L2 Checker Desk ── */}
                    <Route
                        path="/l2-checker"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_L2', 'ADMIN_SUPER']}>
                                <L2CheckerDesk />
                            </ProtectedRoute>
                        }
                    />

                    {/* ── Protected: Super Admin Center ── */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_SUPER']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* ── Protected: Profile Page ── */}
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute allowedRoles={['INVESTOR', 'ADMIN_L1', 'ADMIN_L2', 'ADMIN_SUPER']}>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />

                    {/* ── Fallback: redirect to role home or login ── */}
                    <Route
                        path="*"
                        element={
                            isAuthenticated
                                ? <Navigate to={getRoleDefaultRoute(user?.role)} replace />
                                : <Navigate to="/login" replace />
                        }
                    />
                </Routes>
            </main>
        </div>
    );
};

import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from "@/components/ui/sonner";

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <AppRoutes />
                    <Toaster position="top-center" />
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
