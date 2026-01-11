import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

const STATUS_COLORS = {
  INITIATED: "border-slate-400",
  SELLER_CONFIRMED: "border-blue-500",
  DOCUMENTS_UPLOADED: "border-indigo-500",
  BANK_ASSIGNED: "border-purple-500",
  BANK_REVIEWING: "border-yellow-500",
  BANK_APPROVED: "border-green-500",
  PAYMENT_RELEASED: "border-emerald-500",
  COMPLETED: "border-green-700",
  CANCELLED: "border-red-500",
};

const TradeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------- LOAD TRADE ----------------
  const loadTrade = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/trades/${id}`);
      setTrade(res.data);
    } catch {
      toast.error("Failed to load trade details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrade();
  }, [id]);

  if (loading) {
    return <p className="text-slate-600">Loading trade...</p>;
  }

  if (!trade) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded">
        Trade not found
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Trade #{trade.trade_number}
        </h1>

        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline"
        >
          ← Back
        </button>
      </div>

      {/* TRADE INFO */}
      <div className="bg-white p-6 rounded shadow space-y-2">
        <p>
          <b>Description:</b> {trade.description}
        </p>
        <p>
          <b>Buyer:</b> {trade.buyer?.org_name}
        </p>
        <p>
          <b>Seller:</b> {trade.seller?.org_name}
        </p>
        <p>
          <b>Bank:</b> {trade.bank?.org_name || "Not assigned"}
        </p>
        <p>
          <b>Amount:</b> {trade.amount} {trade.currency}
        </p>
        <p>
          <b>Current Status:</b>{" "}
          <span className="font-semibold">
            {trade.status}
          </span>
        </p>
      </div>

      {/* STATUS TIMELINE */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">
          Trade Status Timeline
        </h2>

        <div className="space-y-4">
          {trade.status_history.length === 0 ? (
            <p className="text-slate-500">
              No status history available
            </p>
          ) : (
            trade.status_history.map((s) => (
              <div
                key={s.id}
                className={`border-l-4 pl-4 ${
                  STATUS_COLORS[s.status] || "border-gray-400"
                }`}
              >
                <p className="font-semibold">{s.status}</p>
                <p className="text-sm text-slate-600">
                  {s.remarks || "—"}
                </p>
                <p className="text-xs text-slate-500">
                  Changed by User ID: {s.changed_by_id}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(s.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeDetails;
