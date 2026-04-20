import { Navigate } from 'react-router-dom';
import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('user_role') || JSON.parse(localStorage.getItem('user') || '{}').role;
    const isLoggedIn = !!token;

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && userRole !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
