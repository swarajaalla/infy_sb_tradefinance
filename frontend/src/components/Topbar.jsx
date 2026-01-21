import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react"; // ✅ THIS WAS MISSING
import api from "../services/api";

export default function Topbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.get("/users/me").then((res) => setUser(res.data));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user) return null;

  const pageTitle =
    location.pathname.split("/")[1]?.replace("-", " ") || "Dashboard";

  return (
    <header
      className="
        fixed top-0 left-64
        h-14 w-[calc(100%-16rem)]
        bg-slate-900 text-white
        flex items-center justify-between
        px-6 border-b border-slate-800
        z-50
      "
    >
      {/* PAGE TITLE */}
      <h1 className="text-sm font-medium capitalize text-slate-200">
        {pageTitle}
      </h1>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">
        <span className="px-2 py-1 text-xs rounded bg-emerald-600">
          {user.role.toLowerCase()}
        </span>

        {/* PROFILE */}
        <div
          onClick={() => navigate("/users/me")}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90"
          title="View Profile"
        >
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm hover:underline">
            {user.email}
          </span>
        </div>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
