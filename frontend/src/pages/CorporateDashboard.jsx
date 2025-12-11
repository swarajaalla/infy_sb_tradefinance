import { useNavigate } from "react-router-dom";

export default function CorporateDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col bg-yellow-50">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-yellow-700">CORPORATE DASHBOARD</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <h2 className="text-3xl font-bold text-yellow-700">
          💼 Welcome Corporate User — Access Granted
        </h2>
      </main>
    </div>
  );
}
