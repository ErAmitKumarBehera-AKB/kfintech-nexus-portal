import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth, getRoleDefaultRoute } from './context/AuthContext';
import { Toaster } from "@/components/ui/sonner";
import { Leapfrog } from 'ldrs/react';
import 'ldrs/react/Leapfrog.css';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ChatbotWidget from './components/common/ChatbotWidget';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import InvestorDashboard from './pages/InvestorDashboard';
import L1MakerDesk from './pages/L1MakerDesk';
import L2CheckerDesk from './pages/L2CheckerDesk';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';

const CHATBOT_ALLOWED_PATHS = ['/', '/login', '/register', '/forgot-password', '/investor'];

const AppRoutes = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Show chatbot only on specific public/investor routes
    const showChatbot = CHATBOT_ALLOWED_PATHS.some(path =>
        location.pathname === path || location.pathname.startsWith('/investor')
    );

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white font-sans">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex justify-center">
                        <Leapfrog
                            size="40"
                            speed="2.5"
                            color="white" 
                        />
                    </div>
                    <h2 className="text-xl font-medium tracking-tight mb-2 mt-4">FinnovaX</h2>
                    <p className="text-sm text-zinc-500 max-w-xs text-center animate-pulse">
                        Restoring your secure session...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {isAuthenticated && !location.pathname.startsWith('/investor') && <Navbar />}

            <main>
                <Routes>
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
                    <Route
                        path="/investor"
                        element={
                            <ProtectedRoute allowedRoles={['INVESTOR', 'ADMIN_SUPER']}>
                                <InvestorDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/l1-maker"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_L1', 'ADMIN_SUPER']}>
                                <L1MakerDesk />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/l2-checker"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_L2', 'ADMIN_SUPER']}>
                                <L2CheckerDesk />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN_SUPER']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute allowedRoles={['INVESTOR', 'ADMIN_L1', 'ADMIN_L2', 'ADMIN_SUPER']}>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
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

            {showChatbot && <ChatbotWidget />}
        </div>
    );
};

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
