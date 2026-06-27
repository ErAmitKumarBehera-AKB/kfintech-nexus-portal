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
        <div>
            {/* Background Effects */}
            <div  />
            <div  />

            <div>
                <div>
                    <Shield  />
                    <span>Enterprise Grade Security</span>
                </div>

                <h1>
                    KFintech <span>Nexus</span> Portal
                </h1>
                
                <p>
                    The next-generation investor service portal. Manage your profile, track service requests, and resolve issues instantly with AI-powered assistance.
                </p>

                <div>
                    <Link to="/register">
                        Register Now
                        <ArrowRight  />
                    </Link>
                    <Link to="/login">
                        Login to Portal
                    </Link>
                </div>

                <div>
                    <div>
                        <div>
                            <Clock  />
                        </div>
                        <h3>Real-time Tracking</h3>
                        <p>Monitor your service request SLAs and audit logs directly from your dashboard.</p>
                    </div>
                    
                    <div>
                        <div>
                            <FileCheck  />
                        </div>
                        <h3>AI-Powered Validation</h3>
                        <p>Our EasyOCR engine automatically verifies your attached documents and reduces manual rejections.</p>
                    </div>
                    
                    <div>
                        <div>
                            <Shield  />
                        </div>
                        <h3>Secure & Compliant</h3>
                        <p>Fully automated access controls, encrypted data storage, and strict RBAC workflows.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
