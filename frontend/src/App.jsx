import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import ViewDocument from "./pages/ViewDocument";
import Trades from "./pages/Trades";
import TradeDetails from "./pages/TradeDetails";
import IntegrityStatus from "./pages/IntegrityStatus";

import Documents from "./pages/Documents";
import DocumentsList from "./pages/DocumentsList";
import Ledger from "./pages/Ledger";

import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";

const App = () => {
  return (
    <Routes>
      {/* ---------- AUTH ---------- */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ---------- DASHBOARD ---------- */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout title="Dashboard">
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ---------- DOCUMENTS MENU ---------- */}
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <Layout title="Documents">
              <Documents />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ---------- DOCUMENTS LIST ---------- */}
      <Route
        path="/documents/list"
        element={
          <ProtectedRoute>
            <Layout title="Documents List">
              <DocumentsList />
            </Layout>
          </ProtectedRoute>
        }
      />
<Route
  path="/documents/view/:id"
  element={
    <ProtectedRoute>
      <Layout title="View Document">
        <ViewDocument />
      </Layout>
    </ProtectedRoute>
  }
/>
      <Route
       path="/trades"
       element={
       <ProtectedRoute>
        <Layout title="Trades">
          <Trades />
        </Layout>
       </ProtectedRoute>
      }
    />
      <Route
  path="/trades/:id"
  element={
    <ProtectedRoute>
      <Layout title="Trade Details">
        <TradeDetails />
      </Layout>
    </ProtectedRoute>
  }
/>

      {/* ---------- LEDGER ---------- */}
      <Route
        path="/ledger"
        element={
          <ProtectedRoute>
            <Layout title="Ledger">
              <Ledger />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ---------- USERS (ADMIN) ---------- */}
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout title="Users">
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* ---------- INTEGRITY STATUS (ADMIN / AUDITOR) ---------- */}
<Route
  path="/integrity-status"
  element={
    <ProtectedRoute>
      <Layout title="Integrity Status">
        <IntegrityStatus />
      </Layout>
    </ProtectedRoute>
  }
/>


      {/* ---------- FALLBACK ---------- */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
