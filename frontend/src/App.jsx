import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AnalyseStock from './pages/AnalyseStock';
import Multibagger from './pages/Multibagger';
import Navbar from './components/Navbar';
import './index.css';

function AppContent({ theme, toggleTheme }) {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem("token");
  const isLoginPage = location.pathname === '/login' || (!isLoggedIn && location.pathname === '/');

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isLoginPage && <Navbar theme={theme} toggleTheme={toggleTheme} />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={isLoggedIn ? <Dashboard /> : <Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Login />} />
          <Route path="/analyse-stock" element={<AnalyseStock />} />
          <Route path="/multibagger" element={<Multibagger />} />
        </Routes>
      </main>
    </div>
  );
}


function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router>
      <AppContent theme={theme} toggleTheme={toggleTheme} />
    </Router>
  );
}

export default App;
