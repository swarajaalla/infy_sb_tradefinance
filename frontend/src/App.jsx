import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UserMe from "./pages/UserMe";
import UsersList from "./pages/UsersList";
import RiskManagement from "./pages/RiskManagement";

import UploadDocument from "./pages/UploadDocument";
import DocumentsList from "./pages/DocumentsList";
import UpdateDocument from "./pages/UpdateDocument";
import LedgerExplorer from "./pages/LedgerExplorer";

import Layout from "./components/Layout";

import TradesList from "./pages/TradesList";
import TradeDetails from "./pages/TradeDetails";
import CreateTrade from "./pages/CreateTrade";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* DEFAULT */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* APP */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/users/me" element={<UserMe />} />
          <Route path="/users" element={<UsersList />} />

          <Route path="/documents" element={<DocumentsList />} />
          <Route path="/documents/upload" element={<UploadDocument />} />
          <Route path="/documents/update/:id" element={<UpdateDocument />} />

          <Route path="/ledger/:id" element={<LedgerExplorer />} />
          <Route path="/risk" element={<RiskManagement />} />

          {/* 🔑 TRADES */}
          <Route path="/trades" element={<TradesList />} />
          <Route path="/trades/create" element={<CreateTrade />} />
          <Route path="/trades/:id" element={<TradeDetails />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
