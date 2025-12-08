import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold text-gray-700">🚀 Welcome to Dashboard</h1>
      <button
        className="mt-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        onClick={logout}
      >
        Logout
      </button>
    </div>
  );
}
