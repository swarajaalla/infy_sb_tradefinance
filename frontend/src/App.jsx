import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import LedgerEntries from "./pages/LedgerEntries";
import Trades from "./pages/Trades";
import AdminUsers from "./pages/AdminUsers";
import IntegrityCheckPage from "./pages/IntegrityCheckPage";
import RiskDashboard from "./pages/RiskDashboard";
import Reports from "./pages/Reports"; // Add this import

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboards */}
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute><Dashboard role="admin" /></ProtectedRoute>}
        />
        <Route
          path="/corporate/dashboard"
          element={<ProtectedRoute><Dashboard role="corporate" /></ProtectedRoute>}
        />
        <Route
          path="/bank/dashboard"
          element={<ProtectedRoute><Dashboard role="bank" /></ProtectedRoute>}
        />
        <Route
          path="/auditor/dashboard"
          element={<ProtectedRoute><Dashboard role="auditor" /></ProtectedRoute>}
        />

        {/* Shared */}
        <Route
          path="/documents"
          element={<ProtectedRoute><Documents /></ProtectedRoute>}
        />

        <Route
          path="/ledger"
          element={<ProtectedRoute><LedgerEntries /></ProtectedRoute>}
        />

        <Route
          path="/trades"
          element={<ProtectedRoute><Trades /></ProtectedRoute>}
        />

        {/* Reports - Available for all roles */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute 
              allowedRoles={['admin', 'auditor', 'bank', 'corporate']}
            >
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Risk Dashboard - Available for all roles */}
        <Route
          path="/risk-dashboard"
          element={
            <ProtectedRoute 
              allowedRoles={['admin', 'auditor', 'bank', 'corporate']}
            >
              <RiskDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/integrity-check"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <IntegrityCheckPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}