import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* AUTH */
import Login from "./pages/Login";
import Signup from "./pages/Signup";

/* CORE */
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import IntegrityAlerts from "./pages/IntegrityAlerts";

/* LEDGER */
import LedgerExplorer from "./pages/LedgerExplorer";
import LedgerTimeline from "./pages/LedgerTimeline";

/* TRADES */
import MyTrades from "./pages/MyTrades";
import CreateTrade from "./pages/CreateTrade";
import TradeDetails from "./pages/TradeDetails";


/* DOCUMENT UPLOAD (TRADE FLOW) */
import UploadDocuments from "./pages/UploadDocuments";
import RiskDashboard from "./pages/RiskDashboard";

export default function App() {
  return (
    
      <Routes>
        {/* DEFAULT */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* DASHBOARD */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* DOCUMENTS */}
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/upload/:tradeId" element={<UploadDocuments />} />

        {/* INTEGRITY */}
        <Route path="/integrity-alerts" element={<IntegrityAlerts />} />

        {/* LEDGER */}
        <Route path="/ledger/:id/explorer" element={<LedgerExplorer />} />
        <Route path="/ledger/:id/timeline" element={<LedgerTimeline />} />

        {/* 🔥 TRADES (ORDER MATTERS) */}
        <Route path="/trades/new" element={<CreateTrade />} />
        <Route path="/trades/:id" element={<TradeDetails />} />
        <Route path="/trades" element={<MyTrades />} />
        <Route path="/risk" element={<RiskDashboard />} />
      </Routes>
    
  );
}
