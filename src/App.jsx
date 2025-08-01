import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

// Componente para proteger rotas que precisam de autenticação
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Carregando...</div>;
    return user ? children : <Navigate to="/login" />;
};

// Componente para proteger rotas de Admin
const AdminRoute = ({ children }) => {
    const { userProfile, loading } = useAuth();
    if (loading) return <div>Carregando...</div>;
    return userProfile?.role === 'admin' ? children : <Navigate to="/" />;
}

export default function App() {
    const { user, userProfile, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex justify-center items-center"><p>Carregando plataforma...</p></div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
                <Route path="/" element={<PrivateRoute><DashboardPage userProfile={userProfile} /></PrivateRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            </Routes>
        </Router>
    );
}