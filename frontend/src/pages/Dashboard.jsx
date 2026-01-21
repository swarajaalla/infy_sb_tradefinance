import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { listTrades } from "../services/tradeApi";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      const res = await listTrades();
      setTrades(res.data || []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const totalTrades = trades.length;
  const pendingActions = trades.filter(
    (t) => t.status === "pending"
  ).length;

  return (
    <Layout>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <span className="px-4 py-2 bg-green-600 text-white rounded">
          Login successful
        </span>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Trades" value={totalTrades} />
        <StatCard title="Documents Uploaded" value={6} />
        <StatCard title="Ledger Events" value={53} />
        <StatCard title="Pending Actions" value={pendingActions} />
      </div>

      {/* RECENT TRADES */}
      <div className="bg-white rounded-xl shadow">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Trades</h2>

          <Link
            to="/trades"
            className="text-indigo-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <p className="p-6">Loading trades...</p>
        ) : trades.length === 0 ? (
          <p className="p-6 text-gray-600">No trades found</p>
        ) : (
          <div className="divide-y">
            {trades.slice(0, 5).map((trade) => (
              <div
                key={trade.id}
                className="flex justify-between items-center px-6 py-4"
              >
                <div>
                  <p className="font-medium">
                    {trade.description || "Trade"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {trade.amount} {trade.currency}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      trade.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : trade.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {trade.status.toUpperCase()}
                  </span>

                  <Link
                    to={`/trades/${trade.id}`}
                    className="text-indigo-600 hover:underline"
                  >
                    Open →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

/* SMALL STAT CARD COMPONENT */
function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
