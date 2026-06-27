
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Hero from "../components/Hero";
import Footer from "../components/Footer";

const LandingPage = () => {
    const { isAuthenticated, user, getRoleDefaultRoute } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={getRoleDefaultRoute(user?.role)} replace />;
    }

    return (
        <>
            <Hero />
            <Footer />
        </>
    );
};

export default LandingPage;