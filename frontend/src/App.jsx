import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Documents from "./pages/Documents";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import Ledger from "./pages/Ledger";


const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <Layout>
              <Documents />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ledger"
        element={
          <ProtectedRoute>
            <Layout>
              <Ledger />
            </Layout>
          </ProtectedRoute>
        }
      />


      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
