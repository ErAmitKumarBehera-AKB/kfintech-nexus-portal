import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, getRoleDefaultRoute } from './context/AuthContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import InvestorDashboard from './pages/InvestorDashboard';
import ChatbotWidget from './components/ChatbotWidget';
import L1MakerDesk from './pages/L1MakerDesk';
import L2CheckerDesk from './pages/L2CheckerDesk';
import AdminDashboard from './pages/AdminDashboard';

const AppRoutes = () => {
    const { user, isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-kfintech-bg font-sans flex flex-col">
            {/* Navbar is only shown when the user is logged in */}
            {isAuthenticated && <Navbar />}

            <main className={`flex-grow ${isAuthenticated ? 'container mx-auto max-w-7xl mt-6' : ''}`}>
                <Routes>
                    {/* ── Public Routes ── */}
                    <Route
                        path="/login"
                        element={
                            // If already logged in, redirect away from login page
                            isAuthenticated
                                ? <Navigate to={getRoleDefaultRoute(user?.role)} replace />
                                : <LoginPage />
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

            {/* AI Assistant Chatbot (Only for Investors) */}
            {isAuthenticated && user?.role === 'INVESTOR' && <ChatbotWidget />}
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
