import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role?.toLowerCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
     ${
       isActive
         ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/30"
         : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
     }`;

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-[#0f172a] to-[#020617] shadow-2xl flex flex-col">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-slate-700/50">
        <h1 className="text-xl font-bold text-white tracking-wide">
          Trade Finance
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Blockchain Explorer
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink to="/" className={linkClass}>
          Dashboard
        </NavLink>

        <NavLink to="/documents" className={linkClass}>
          Documents
        </NavLink>

        {["admin", "auditor", "bank", "corporate"].includes(role) && (
          <NavLink to="/ledger" className={linkClass}>
            Ledger
          </NavLink>
        )}

        <NavLink to="/trades" className={linkClass}>
          Trades
        </NavLink>
        
        {["admin", "auditor"].includes(role) && (
          <NavLink to="/integrity-status" className={linkClass}>
            Integrity Status
          </NavLink>
        )}

        {role === "admin" && (
          <NavLink to="/users" className={linkClass}>
            Users
          </NavLink>
        )}
      </nav>

      {/* User info */}
      <div className="px-5 py-5 border-t border-slate-700/50">
        <p className="text-sm text-white font-semibold">{user.name}</p>
        <p className="text-xs text-slate-400 capitalize mt-0.5">
          {role} • {user.org_name}
        </p>

        <button
          onClick={handleLogout}
          className="mt-4 w-full bg-red-600/90 hover:bg-red-700 text-white text-sm py-2.5 rounded-lg transition shadow-md"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
