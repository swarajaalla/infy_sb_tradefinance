import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";

// 🔐 Protect Pages (Dashboard, Documents)
const RequireLogin = ({ children }) => {
  const username = localStorage.getItem("username");
  return username ? children : <Login />;
};

function App() {
  return (
    <BrowserRouter>
      {/* Navbar always visible */}
      <Navbar />

      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Register */}
        <Route path="/register" element={<Register />} />

        {/* Dashboard (Protected) */}
        <Route
          path="/dashboard"
          element={
            <RequireLogin>
              <Dashboard />
            </RequireLogin>
          }
        />

        {/* Documents (Protected) */}
        <Route
          path="/documents"
          element={
            <RequireLogin>
              <Documents />
            </RequireLogin>
          }
        />

        {/* Default Route → Login */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
