import { useNavigate } from "react-router-dom";

export default function BankDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col bg-blue-50">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700">BANK DASHBOARD</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <h2 className="text-3xl font-bold text-blue-700">
          🏦 Welcome Bank User — Access Granted
        </h2>
      </main>
    </div>
  );
}
