import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

const STATUS_COLORS = {
  INITIATED: "bg-slate-100 text-slate-700",
  SELLER_CONFIRMED: "bg-blue-100 text-blue-700",
  DOCUMENTS_UPLOADED: "bg-indigo-100 text-indigo-700",
  BANK_ASSIGNED: "bg-purple-100 text-purple-700",
  BANK_REVIEWING: "bg-yellow-100 text-yellow-700",
  BANK_APPROVED: "bg-green-100 text-green-700",
  PAYMENT_RELEASED: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-green-200 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const RecentTrades = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const res = await api.get("/trades/");
      setTrades(res.data.slice(0, 5)); // latest 5 trades
    } catch {
      toast.error("Failed to load recent trades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading recent trades...</p>;
  }

  return (
    <div className="bg-white rounded-xl shadow border">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Recent Trades</h2>
        <p className="text-sm text-slate-500">
          Latest trade activities in the system
        </p>
      </div>

      {/* Content */}
      {trades.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">No trades found</p>
      ) : (
        <ul className="divide-y">
          {trades.map((trade) => (
            <li
              key={trade.id}
              className="px-6 py-4 hover:bg-slate-50 cursor-pointer transition"
              onClick={() => navigate(`/trades/${trade.id}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">
                    Trade #{trade.trade_number}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {trade.buyer?.org_name} → {trade.seller?.org_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Amount: {trade.amount} {trade.currency}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[trade.status]}`}
                >
                  {trade.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t text-right">
        <button
          onClick={() => navigate("/trades")}
          className="text-sm text-indigo-600 hover:underline"
        >
          View all trades →
        </button>
      </div>
    </div>
  );
};

export default RecentTrades;
