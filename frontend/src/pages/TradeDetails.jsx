import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTradeById,
  updateTradeStatus,
  assignBank,
} from "../services/tradeApi";
import api from "../services/api";

export default function TradeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trade, setTrade] = useState(null);
  const [user, setUser] = useState(null);
  const [bankId, setBankId] = useState("");

  const refresh = async () => {
    const t = await getTradeById(id);
    setTrade(t.data);
  };

  useEffect(() => {
    refresh();
    api.get("/users/me").then((res) => setUser(res.data));
  }, [id]);

  if (!trade || !user) return <p>Loading...</p>;

  const isCorporate = user.role === "CORPORATE";
  const isBank = user.role === "BANK";
  const isBuyer = trade.buyer_id === user.id;
  const isSeller = trade.seller_id === user.id;

  const updateStatus = async (status) => {
    await updateTradeStatus(id, { status });
    refresh();
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Trade #{trade.id}</h2>

      <p>Status: {trade.status}</p>
      <p>Amount: {trade.amount} {trade.currency}</p>

      {/* SELLER CONFIRM */}
      {isCorporate && isSeller && trade.status === "INITIATED" && (
        <button onClick={() => updateStatus("SELLER_CONFIRMED")} className="btn-primary">
          Confirm Trade
        </button>
      )}

      {/* SELLER UPLOAD DOCS */}
      {isCorporate && isSeller && trade.status === "SELLER_CONFIRMED" && (
        <button
          onClick={() => navigate("/documents/upload", { state: { tradeId: trade.id } })}
          className="btn-primary"
        >
          Upload Documents
        </button>
      )}

      {/* BUYER ASSIGN BANK */}
      {isCorporate && isBuyer && trade.status === "DOCUMENTS_UPLOADED" && (
        <div className="space-x-2">
          <input
            placeholder="Bank ID"
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            className="input"
          />
          <button
            onClick={async () => {
              await assignBank(id, bankId);
              refresh();
            }}
            className="btn-secondary"
          >
            Assign Bank
          </button>
        </div>
      )}

      {/* BANK REVIEW */}
      {isBank && trade.status === "BANK_REVIEWING" && (
        <>
          <button
            onClick={() => updateStatus("PAYMENT_RELEASED")}
            className="btn-primary"
          >
            Approve & Release Payment
          </button>
          <button
            onClick={() => updateStatus("DISPUTED")}
            className="btn-danger"
          >
            Dispute
          </button>
        </>
      )}

      {/* COMPLETE */}
      {isCorporate && (isBuyer || isSeller) && trade.status === "PAYMENT_RELEASED" && (
        <button
          onClick={() => updateStatus("COMPLETED")}
          className="btn-primary"
        >
          Complete Trade
        </button>
      )}
    </div>
  );
}
