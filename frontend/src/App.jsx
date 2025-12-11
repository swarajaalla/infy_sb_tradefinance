import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import BankDashboard from "./pages/BankDashboard";
import CorporateDashboard from "./pages/CorporateDashboard";
import AuditorDashboard from "./pages/AuditorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bank/dashboard"
          element={
            <ProtectedRoute allowedRoles={["bank","admin"]}>
              <BankDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/corporate/dashboard"
          element={
            <ProtectedRoute allowedRoles={["corporate","admin"]}>
              <CorporateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auditor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["auditor","admin"]}>
              <AuditorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unauthorized page */}
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    </BrowserRouter>
  );
}
