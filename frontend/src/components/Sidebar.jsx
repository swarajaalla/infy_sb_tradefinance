import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-64 min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-xl font-bold mb-6">Trade Finance</h1>

      <nav className="space-y-3">
        <Link to="/" className="block hover:text-blue-400">
          Dashboard
        </Link>

        <Link to="/documents" className="block hover:text-blue-400">
          Documents
        </Link>

        {user.role === "admin" && (
          <Link to="/users" className="block hover:text-blue-400">
            Users
          </Link>
        )}
      </nav>

      <div className="mt-10 border-t pt-4 text-sm">
        <p>{user.name}</p>
        <p className="capitalize">{user.role}</p>

        <button
          onClick={handleLogout}
          className="mt-3 bg-red-600 px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
