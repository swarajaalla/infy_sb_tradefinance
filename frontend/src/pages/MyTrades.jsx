import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import CreateTrade from "./CreateTrade";
import api from "../api/axios";
import {
  listTrades,
  confirmTrade,
  assignBank,
  startBankReview,
  approveTrade,
  releasePayment,
  completeTrade,
} from "../services/tradeApi";

export default function MyTrades() {
  const [trades, setTrades] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showCreateForm = searchParams.get("create") === "true";

  const [assigningTradeId, setAssigningTradeId] = useState(null);
  const [bankId, setBankId] = useState("");

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadTrades();
    loadCurrentUser();
  }, []);

  const loadTrades = async () => {
    try {
      const res = await listTrades();
      setTrades(res.data);
    } catch (err) {
      console.error("Failed to load trades", err);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Failed to load current user", err);
    }
  };

  /* ================= STATUS BADGE ================= */
  const badge = (status) => {
    const base = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "INITIATED":
        return `${base} bg-yellow-100 text-yellow-800`;
      case "SELLER_CONFIRMED":
        return `${base} bg-blue-100 text-blue-800`;
      case "DOCUMENT_UPLOADED":
        return `${base} bg-purple-100 text-purple-800`;
      case "BANK_ASSIGNED":
        return `${base} bg-indigo-100 text-indigo-800`;
      case "BANK_REVIEWING":
        return `${base} bg-orange-100 text-orange-800`;
      case "BANK_APPROVED":
        return `${base} bg-green-100 text-green-800`;
      case "PAYMENT_RELEASED":
        return `${base} bg-teal-100 text-teal-800`;
      case "COMPLETED":
        return `${base} bg-green-200 text-green-900`;
      default:
        return `${base} bg-gray-200`;
    }
  };

  return (
    <Layout>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Trades</h1>

        {currentUser && currentUser.role !== "bank" && (
          <button
            onClick={() => setSearchParams({ create: "true" })}
            className="btn-primary"
          >
            + Create Trade
          </button>
        )}
      </div>

      {/* ================= CREATE TRADE ================= */}
      {showCreateForm && (
        <div className="mb-6">
          <CreateTrade
            onCancel={() => setSearchParams({})}
            onSuccess={() => {
              setSearchParams({});
              loadTrades();
            }}
          />
        </div>
      )}

      {/* ================= TRADES LIST ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trades.map((trade) => (
          <div key={trade.id} className="bg-white p-6 rounded shadow">
            <div className="flex justify-between mb-2">
              <p className="text-sm text-gray-500">TRADE #{trade.id}</p>
              <span className={badge(trade.status)}>{trade.status}</span>
            </div>

            <p><b>Buyer:</b> {trade.buyer_id}</p>
            <p><b>Seller:</b> {trade.seller_id}</p>
            <p><b>Bank:</b> {trade.bank_id || "—"}</p>
            <p>
              <b>Amount:</b> {trade.amount} {trade.currency}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                to={`/trades/${trade.id}`}
                className="border px-3 py-1 rounded"
              >
                View Details
              </Link>

              {/* ===== SELLER: CONFIRM TRADE ===== */}
              {trade.status === "INITIATED" &&
                currentUser &&
                Number(currentUser.id) === Number(trade.seller_id) && (
                  <button
                    onClick={async () => {
                      await confirmTrade(trade.id);
                      loadTrades();
                    }}
                    className="btn-primary"
                  >
                    Confirm Trade
                  </button>
                )}

              {/* ===== SELLER: UPLOAD DOCUMENT ===== */}
              {trade.status === "SELLER_CONFIRMED" &&
                currentUser &&
                Number(currentUser.id) === Number(trade.seller_id) && (
                  <button
                    onClick={() =>
                      navigate(`/documents/upload/${trade.id}`)
                    }
                    className="btn-primary"
                  >
                    Upload Documents
                  </button>
                )}

              {/* ===== BUYER: ASSIGN BANK ===== */}
              {trade.status === "DOCUMENT_UPLOADED" &&
                currentUser &&
                Number(currentUser.id) === Number(trade.buyer_id) && (
                  <>
                    {assigningTradeId === trade.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          placeholder="Bank ID"
                          value={bankId}
                          onChange={(e) => setBankId(e.target.value)}
                          className="border px-2 py-1 rounded w-28"
                        />

                        <button
                          onClick={async () => {
                            await assignBank(trade.id, Number(bankId));
                            setAssigningTradeId(null);
                            setBankId("");
                            loadTrades();
                          }}
                          className="btn-primary"
                        >
                          Assign
                        </button>

                        <button
                          onClick={() => {
                            setAssigningTradeId(null);
                            setBankId("");
                          }}
                          className="border px-3 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigningTradeId(trade.id)}
                        className="btn-primary"
                      >
                        Assign Bank
                      </button>
                    )}
                  </>
                )}

              {/* ===== BUYER: COMPLETE TRADE ===== */}
              {trade.status === "PAYMENT_RELEASED" &&
                currentUser &&
                Number(currentUser.id) === Number(trade.buyer_id) && (
                  <button
                    onClick={() =>
                      completeTrade(trade.id).then(loadTrades)
                    }
                    className="btn-primary"
                  >
                    Complete Trade
                  </button>
                )}

              {/* ===== BANK ACTIONS ===== */}
              {currentUser?.role === "bank" &&
                trade.status === "BANK_ASSIGNED" && (
                  <button
                    onClick={() =>
                      startBankReview(trade.id).then(loadTrades)
                    }
                    className="btn-primary"
                  >
                    Start Review
                  </button>
                )}

              {currentUser?.role === "bank" &&
                trade.status === "BANK_REVIEWING" && (
                  <button
                    onClick={() =>
                      approveTrade(trade.id).then(loadTrades)
                    }
                    className="btn-primary"
                  >
                    Approve
                  </button>
                )}

              {currentUser?.role === "bank" &&
                trade.status === "BANK_APPROVED" && (
                  <button
                    onClick={() =>
                      releasePayment(trade.id).then(loadTrades)
                    }
                    className="btn-primary"
                  >
                    Release Payment
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
