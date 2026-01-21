import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import TradeStatusBadge from "../components/TradeStatusBadge";
import CreateTradeModal from "../components/CreateTradeModal";
import TradeDetailsModal from "../components/TradeDetailsModal";
import AssignBankModal from "../components/AssignBankModal";

export default function TradesList() {
  const [trades, setTrades] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [assignTradeId, setAssignTradeId] = useState(null);

  const navigate = useNavigate();

  const loadTrades = async () => {
    const res = await api.get("/trades");
    setTrades(res.data);
  };

  const updateStatus = async (tradeId, status) => {
    try {
      await api.patch(`/trades/${tradeId}/status`, { status });
      await loadTrades();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to update trade");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.get("/users/me");
        setUser(me.data);
        await loadTrades();
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  if (loading) return <p className="p-6">Loading trades...</p>;
  if (!user) return null;

  const currentUserId = Number(user.id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-slate-800">
          Trade Transactions
        </h1>

        {user.role === "CORPORATE" && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
            + Create New Trade
          </button>
        )}
      </div>

      {/* TRADES */}
      <div className="space-y-4">
        {trades.map((trade) => {
          const isSeller = Number(trade.seller_id) === currentUserId;
          const isBuyer = Number(trade.buyer_id) === currentUserId;
          const isAssignedBank =
            user.role === "BANK" && trade.bank_id === currentUserId;

          return (
            <div
              key={trade.id}
              className="bg-white rounded-xl shadow-sm p-5 flex justify-between"
            >
              <div className="space-y-2">
                <p className="text-blue-600 font-semibold">
                  TRD-{trade.id}
                </p>

                <p className="text-sm">{trade.description}</p>

                <p className="text-sm text-slate-600">
                  Buyer ID: {trade.buyer_id}
                </p>

                <p className="text-sm text-slate-600">
                  Seller ID: {trade.seller_id}
                </p>

                {/* ACTIONS */}
                <div className="flex gap-2 flex-wrap">

                  {/* SELLER – ACCEPT / REJECT */}
                  {isSeller && trade.status === "INITIATED" && (
                    <>
                      <button
                        onClick={() => updateStatus(trade.id, "SELLER_CONFIRMED")}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateStatus(trade.id, "REJECTED")}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* SELLER – UPLOAD DOCUMENTS */}
                  {isSeller && trade.status === "SELLER_CONFIRMED" && (
                    <button
                      onClick={() =>
                        navigate("/documents/upload", {
                          state: { tradeId: trade.id }
                        })
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Upload Documents
                    </button>
                  )}

                  {/* BUYER – ASSIGN BANK */}
                  {isBuyer && trade.status === "DOCUMENTS_UPLOADED" && (
                    <button
                      onClick={() => setAssignTradeId(trade.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Assign Bank
                    </button>
                  )}

                  {/* BANK – APPROVE / DISPUTE */}
                  {isAssignedBank && trade.status === "BANK_REVIEWING" && (
                    <>
                      <button
                        onClick={() =>
                          updateStatus(trade.id, "PAYMENT_RELEASED")
                        }
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => updateStatus(trade.id, "DISPUTED")}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Dispute
                      </button>
                    </>
                  )}

                  {/* ✅ BUYER OR SELLER – MARK COMPLETE */}
                  {(isBuyer || isSeller) &&
                    trade.status === "PAYMENT_RELEASED" && (
                      <button
                        onClick={() =>
                          updateStatus(trade.id, "COMPLETED")
                        }
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Mark Complete
                      </button>
                    )}

                  {/* VIEW DETAILS */}
                  <button
                    onClick={() => setSelectedTradeId(trade.id)}
                    className="bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded text-xs"
                  >
                    View Details
                  </button>
                </div>
              </div>

              <div className="text-right space-y-2">
                <p className="text-lg font-semibold">
                  {trade.currency} {trade.amount}
                </p>
                <TradeStatusBadge status={trade.status} />
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      {showCreate && (
        <CreateTradeModal
          onClose={() => setShowCreate(false)}
          onCreated={loadTrades}
        />
      )}

      {selectedTradeId && (
        <TradeDetailsModal
          tradeId={selectedTradeId}
          onClose={() => setSelectedTradeId(null)}
        />
      )}

      {assignTradeId && (
        <AssignBankModal
          tradeId={assignTradeId}
          onClose={() => setAssignTradeId(null)}
          onAssigned={loadTrades}
        />
      )}
    </div>
  );
}
