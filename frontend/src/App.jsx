import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout and Components
import Layout from './components/Layout';

// Pages - Ensure these imports point to your newly updated files
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Upload from './pages/Upload';
import AuditLogs from './pages/AuditLogs';
import RiskAnalysis from './pages/RiskAnalysis';
// Ensure this filename matches your updated dynamic security status file
import SecurityStatus from './pages/SecurityStatus'; 
import Ledger from './pages/Ledger';

/**
 * ProtectedRoute Component
 * Redirects users to /login if they are not authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. PUBLIC ROUTES (No Sidebar/Navbar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 2. PROTECTED ROUTES (Wrapped in Layout + Auth Check) */}
        <Route 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Default landing page after login */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Document Management */}
          <Route path="/documents" element={<Documents />} />
          <Route path="/upload" element={<Upload />} />
          
          {/* Blockchain & Security Monitoring */}
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="/risk-analysis" element={<RiskAnalysis />} />
          
          {/* FIXED: This path must match your Sidebar link for Security Status */}
          <Route path="/integrity-status" element={<SecurityStatus />} />
          
          {/* Handle root path redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* 3. 404 NOT FOUND - Catch-all Route */}
        <Route path="*" element={
          <div className="h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white">
            <h1 className="text-9xl font-black text-blue-600 animate-pulse">404</h1>
            <p className="text-xl mt-4 text-slate-400">Page not found.</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="mt-8 bg-blue-600 px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 active:scale-95"
            >
              Back to Safety
            </button>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;