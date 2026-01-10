import { Link, useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-indigo-700 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">Trade Finance</h1>

        <nav className="space-y-3">
          <Link to="/dashboard" className="block hover:underline">
            Dashboard
          </Link>
          <Link to="/documents" className="block hover:underline">
            Documents
          </Link>
          <Link to="/integrity-alerts" className="block hover:underline text-red-200">
           Integrity Alerts
          </Link>
          <Link to="/trades" className="block hover:underline">
          Trades
          </Link>
        </nav>

        {/* USER INFO */}
        <div className="mt-auto pt-6 border-t border-indigo-400">
          <p className="font-semibold">
            {username || "User"}
          </p>
          <p className="text-sm opacity-90">
            {role || "Role"}
          </p>

          <button
            onClick={logout}
            className="mt-4 bg-red-500 hover:bg-red-600 px-4 py-2 rounded w-full"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
