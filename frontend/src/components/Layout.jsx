// layout.jsx 
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path)
      ? "text-white border-b-2 border-white"
      : "text-blue-100 hover:text-white";

  // Get the correct dashboard path based on role
  const getDashboardPath = () => {
    return `/${role}/dashboard`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ---------------- NAVBAR ---------------- */}
      <header className="bg-blue-700 shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* LEFT */}
          <div className="flex items-center gap-6">
            <span className="text-white font-bold text-lg">
              Trade Finance
            </span>

            <nav className="flex gap-4 text-sm">
              {/* FIXED: Use dynamic dashboard path */}
              <Link to={getDashboardPath()} className={isActive("/dashboard")}>
                Dashboard
              </Link>

              <Link to="/trades" className={isActive("/trades")}>
                Trades
              </Link>

              <Link to="/ledger" className={isActive("/ledger")}>
                Ledger
              </Link>

              <Link to="/documents" className={isActive("/documents")}>
                Documents
              </Link>

              {role === "admin" && (
                <>
                  <Link to="/admin/users" className={isActive("/admin/users")}>
                    Users
                  </Link>
                  <Link to="/admin/integrity-check" className={isActive("/admin/integrity-check")}>
                    Integrity Check
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <div className="text-right text-xs text-blue-100">
              <div className="font-semibold">{email}</div>
              <div className="uppercase">{role}</div>
            </div>

            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- PAGE CONTENT ---------------- */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}