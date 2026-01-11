import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";

const Dashboard = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalTrades: 0,
    documentsUploaded: 0,
    ledgerEvents: 0,
    pendingActions: 0,
  });

  const [recentTrades, setRecentTrades] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        api.get("/trades/"),
        api.get("/documents/list"),
        api.get("/ledger/entries"),
      ]);

      const trades =
        results[0].status === "fulfilled" ? results[0].value.data : [];
      const documents =
        results[1].status === "fulfilled" ? results[1].value.data : [];
      const ledger =
        results[2].status === "fulfilled" ? results[2].value.data : [];

      setStats({
        totalTrades: trades.length,
        documentsUploaded: documents.length,
        ledgerEvents: ledger.length,
        pendingActions: trades.filter(
          (t) => !["COMPLETED", "CANCELLED"].includes(t.status)
        ).length,
      });

      setRecentTrades(trades.slice(0, 5));
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-10">
      {/* ---- STATS ROW ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Trades"
          value={stats.totalTrades}
          accent="from-indigo-500 to-indigo-700"
        />
        <StatCard
          title="Documents Uploaded"
          value={stats.documentsUploaded}
          accent="from-emerald-500 to-emerald-700"
        />
        <StatCard
          title="Ledger Events"
          value={stats.ledgerEvents}
          accent="from-amber-500 to-amber-700"
        />
        <StatCard
          title="Pending Actions"
          value={stats.pendingActions}
          accent="from-rose-500 to-rose-700"
        />
      </div>

      {/* ---- RECENT TRADES ---- */}
      <Card>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">
            Recent Trades
          </h2>
          <button
            onClick={() => navigate("/trades")}
            className="text-sm text-indigo-600 hover:underline"
          >
            View all →
          </button>
        </div>

        {recentTrades.length === 0 ? (
          <p className="p-6 text-slate-500">No recent trades</p>
        ) : (
          <div className="divide-y">
            {recentTrades.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition"
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {t.description}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t.amount} {t.currency}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    {t.status}
                  </span>
                  <button
                    onClick={() => navigate(`/trades/${t.id}`)}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Open →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

/* ---- PREMIUM STAT CARD ---- */
const StatCard = ({ title, value, accent }) => (
  <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
    <div
      className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`}
    />
    <div className="p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;
