import { Link, useNavigate } from "react-router-dom";

export default function Layout({ children, role }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-blue-700 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold">Trade Explorer</div>

        <nav className="flex-1 px-4 space-y-3">

          <Link to={`/${role}/dashboard`} className="block p-2 hover:bg-blue-800 rounded">
            Dashboard
          </Link>

          {(role === "admin" || role === "auditor" || role === "corporate" || role === "bank") && (
            <Link to="/documents" className="block p-2 hover:bg-blue-800 rounded">
              Documents
            </Link>
          )}

          {role === "admin" && (
            <Link to="/admin/users" className="block p-2 hover:bg-blue-800 rounded">
              All Users
            </Link>
          )}

        </nav>

        <button
          onClick={logout}
          className="m-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
