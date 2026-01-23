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

  // ---- Risk & Analytics State ----
  const [riskSummary, setRiskSummary] = useState(null);
  const [riskUserId, setRiskUserId] = useState("");
  const [riskResult, setRiskResult] = useState(null);

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
      api.get("/analytics/summary"), // ✅ correct endpoint
    ]);

    const trades =
      results[0].status === "fulfilled" ? results[0].value.data : [];
    const documents =
      results[1].status === "fulfilled" ? results[1].value.data : [];
    const ledger =
      results[2].status === "fulfilled" ? results[2].value.data : [];
    const analytics =
      results[3].status === "fulfilled" ? results[3].value.data : null;

    setStats({
      totalTrades: trades.length,
      documentsUploaded: documents.length,
      ledgerEvents: ledger.length,
      pendingActions: trades.filter(
        (t) => !["COMPLETED", "CANCELLED"].includes(t.status)
      ).length,
    });

    setRecentTrades(trades.slice(0, 5));

    if (analytics) {
      setRiskSummary({
        average_risk: analytics.risk.average,
        cancelled_trades: analytics.trades.cancelled,
        total_users: analytics.users.total,
      });
    }
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
    <div className="space-y-14">
      {/* ================= PLATFORM HEALTH ================= */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Platform Health</h2>
          <p className="text-sm text-slate-500">
            System-wide risk and stability indicators
          </p>
        </div>

        {riskSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <StatCard
              title="Average Risk"
              value={riskSummary.average_risk}
              accent="from-fuchsia-500 to-fuchsia-700"
            />
            <StatCard
              title="Cancelled Trades"
              value={riskSummary.cancelled_trades}
              accent="from-red-500 to-red-700"
            />
            <StatCard
              title="Total Users"
              value={riskSummary.total_users}
              accent="from-cyan-500 to-cyan-700"
            />
          </div>
        )}
      </section>

      {/* ================= OPERATIONAL METRICS ================= */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Operational Metrics
          </h2>
          <p className="text-sm text-slate-500">
            Live trade and document activity
          </p>
        </div>

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
      </section>

      {/* ================= LIVE ANALYSIS ================= */}
      <section className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Live Analysis</h2>
          <p className="text-sm text-slate-500">
            Ongoing activity and risk evaluation
          </p>
        </div>

        {/* ---- RECENT TRADES ---- */}
        <Card>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-slate-800">
              Recent Trades
            </h3>
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
      </section>
    </div>
  );
};

/* ---- PREMIUM STAT CARD ---- */
const StatCard = ({ title, value, accent }) => (
  <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
    <div className="p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;
