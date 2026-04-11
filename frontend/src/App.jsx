import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AnalyseStock from './pages/AnalyseStock';
import Multibagger from './pages/Multibagger';
import PennyStorm from './pages/PennyStorm';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import './index.css';
import Intraday from './pages/Intraday';
import Watchlist from './pages/Watchlist';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function AppContent({ theme, toggleTheme }) {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('token');
  
  // Define public routes that don't need Navbar/Sidebar or Protection
  const publicRoutes = ['/login'];
  const isPublicPage = publicRoutes.includes(location.pathname);
  
  // Also hide Navbar/Sidebar on root if not logged in (will redirect anyway)
  const hideShell = isPublicPage || (!isLoggedIn && location.pathname === '/');

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } }} />
      {!hideShell && <Navbar theme={theme} toggleTheme={toggleTheme} />}

      <div style={{ display: 'flex', flex: 1 }}>
        {!hideShell && <Sidebar />}

        <main style={{ flex: 1, overflowX: 'hidden' }}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/analyse-stock" element={<ProtectedRoute><AnalyseStock /></ProtectedRoute>} />
            <Route path="/multibagger" element={<ProtectedRoute><Multibagger /></ProtectedRoute>} />
            <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
            <Route path="/penny-storm" element={<ProtectedRoute><PennyStorm /></ProtectedRoute>} />
            <Route path="/intraday" element={<ProtectedRoute><Intraday /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <Router>
      <AppContent theme={theme} toggleTheme={toggleTheme} />
    </Router>
  );
}

export default App;