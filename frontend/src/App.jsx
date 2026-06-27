import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, getRoleDefaultRoute } from './context/AuthContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ChatbotWidget from './components/common/ChatbotWidget';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import InvestorDashboard from './pages/InvestorDashboard';
import L1MakerDesk from './pages/L1MakerDesk';
import L2CheckerDesk from './pages/L2CheckerDesk';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';

const AppRoutes = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div>
                <div></div>
            </div>
        );
    }

    return (
        <div>
            {/* Navbar and Chatbot are only shown when the user is logged in */}
            {isAuthenticated && (
                <>
                    <Navbar />
                    <ChatbotWidget />
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

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
