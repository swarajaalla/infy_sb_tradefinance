import { updateTradeStatus, assignBank } from "../services/tradeApi";
import { useState } from "react";

export default function TradeActionPanel({ trade, user, refresh }) {
  const [bankId, setBankId] = useState("");

  const isCorporate = user.role === "CORPORATE";
  const isBank = user.role === "BANK";
  const isBuyer = trade.buyer_id === user.id;
  const isSeller = trade.seller_id === user.id;

  const changeStatus = async (status) => {
    await updateTradeStatus(trade.id, { status });
    refresh();
  };

  const assign = async () => {
    if (!bankId) return alert("Enter Bank ID");
    await assignBank(trade.id, bankId);
    refresh();
  };

  return (
    <div className="mt-6 space-y-4">

      {/* SELLER: CONFIRM TRADE */}
      {isCorporate &&
        isSeller &&
        trade.status === "INITIATED" && (
          <button
            onClick={() => changeStatus("SELLER_CONFIRMED")}
            className="btn-primary"
          >
            Confirm Trade
          </button>
        )}

      {/* SELLER: UPLOAD DOCUMENTS */}
      {isCorporate &&
        isSeller &&
        trade.status === "SELLER_CONFIRMED" && (
          <button
            onClick={() =>
              window.location.href = "/documents/upload"
            }
            className="btn-primary"
          >
            Upload Documents
          </button>
        )}

      {/* BUYER: ASSIGN BANK */}
      {isCorporate &&
        isBuyer &&
        trade.status === "DOCUMENTS_UPLOADED" && (
          <div className="flex items-center gap-2">
            <input
              placeholder="Bank ID"
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="input"
            />
            <button onClick={assign} className="btn-secondary">
              Assign Bank
            </button>
          </div>
        )}

      {/* BANK: RELEASE PAYMENT */}
      {isBank &&
        trade.status === "BANK_REVIEWING" && (
          <button
            onClick={() => changeStatus("PAYMENT_RELEASED")}
            className="btn-primary"
          >
            Release Payment
          </button>
        )}

      {/* BUYER OR SELLER: COMPLETE */}
      {isCorporate &&
        (isBuyer || isSeller) &&
        trade.status === "PAYMENT_RELEASED" && (
          <button
            onClick={() => changeStatus("COMPLETED")}
            className="btn-success"
          >
            Complete Trade
          </button>
        )}
    </div>
  );
}
