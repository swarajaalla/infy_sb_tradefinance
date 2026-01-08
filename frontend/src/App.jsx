import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import LedgerEntries from "./pages/LedgerEntries";
import Trades from "./pages/Trades";
import AdminUsers from "./pages/AdminUsers";
import IntegrityCheckPage from "./pages/IntegrityCheckPage"; 

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

        {/* Trades (ONLY ONE PAGE) */}
        <Route
          path="/trades"
          element={<ProtectedRoute><Trades /></ProtectedRoute>}
        />

        {/* Admin */}
        <Route
          path="/admin/users"
          element={<ProtectedRoute><AdminUsers /></ProtectedRoute>}
        />
        <Route
          path="/admin/integrity-check"
          element={<ProtectedRoute><IntegrityCheckPage /></ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}
