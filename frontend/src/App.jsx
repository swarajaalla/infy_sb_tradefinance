import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import AdminUsers from "./pages/AdminUsers";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Role Dashboards */}
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

        {/* Shared Pages */}
        <Route
          path="/documents"
          element={<ProtectedRoute><Documents /></ProtectedRoute>}
        />

        {/* Admin Only */}
        <Route
          path="/admin/users"
          element={<ProtectedRoute><AdminUsers /></ProtectedRoute>}
        />

      </Routes>
    </BrowserRouter>
  );
}
