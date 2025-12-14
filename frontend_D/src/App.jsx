import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Signup from "./pages/Signup";

import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import CorporateDashboard from "./pages/dashboards/CorporateDashboard";
import BankDashboard from "./pages/dashboards/BankDashboard";
import AuditorDashboard from "./pages/dashboards/AuditorDashboard";

export default function App() {
  return (
    <>
      {/* Global header */}
      <Header />

      {/* Page content */}
      <div className="p-6">
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* ADMIN dashboard only */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/corporate" element={<CorporateDashboard />} />
      <Route path="/bank" element={<BankDashboard />} />
      <Route path="/auditor" element={<AuditorDashboard />} />
    </Routes>
    </div>
    </>
  );
}
