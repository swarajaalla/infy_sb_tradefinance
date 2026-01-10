import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import LedgerExplorer from "./pages/LedgerExplorer";
import LedgerTimeline from "./pages/LedgerTimeline";
import MyTrades from "./pages/MyTrades";   // ✅ fixed case
import CreateTrade from "./pages/CreateTrade";
import IntegrityAlerts from "./pages/IntegrityAlerts";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Core pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />

        {/* Ledger */}
        <Route path="/ledger/:id/explorer" element={<LedgerExplorer />} />
        <Route path="/ledger/:id/timeline" element={<LedgerTimeline />} />

        {/* Trades (Week 5) */}
        <Route path="/trades" element={<MyTrades />} />
        <Route path="/trades/create" element={<CreateTrade />} />
        <Route path="/integrity-alerts" element={<IntegrityAlerts />} />

      </Routes>
    </BrowserRouter>
  );
}
