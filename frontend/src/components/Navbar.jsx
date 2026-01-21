import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/users/me")
      .then((res) => setUser(res.data))
      .catch(() => navigate("/login"));
  }, [navigate]);

  if (!user) return null;

  const linksByRole = {
    CORPORATE: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Trades", path: "/trades" },
      { name: "Documents", path: "/documents" },
      { name: "Upload Document", path: "/documents/upload" },
    ],

    BANK: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Trades", path: "/trades" },
      { name: "Documents", path: "/documents" },
      { name: "Risk Management", path: "/risk" },
    ],

    ADMIN: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Trades", path: "/trades" },
      { name: "Documents", path: "/documents" },
      { name: "Risk Management", path: "/risk" }, 
      // ✅ NEW ADMIN-ONLY LINK
      { name: "Manage Users", path: "/users" },
    ],

    AUDITOR: [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Documents", path: "/documents" },
    ],
  };

  const links = linksByRole[user.role] || [];

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0">
      {/* LOGO */}
      <div className="px-6 py-5 text-lg font-semibold border-b border-slate-800">
        ChainDocs
      </div>

      {/* NAV LINKS */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-md text-sm transition ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="px-4 py-4 border-t border-slate-800 text-xs text-slate-400 text-center">
        © {new Date().getFullYear()} ChainDocs
        <br />
        Secure Trade Finance Platform
      </div>
    </aside>
  );
}
