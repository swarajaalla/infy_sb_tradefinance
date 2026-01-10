import { useEffect, useState } from "react";
import { listTrades, updateTradeStatus, assignBankToTrade } from "../services/tradeApi";

export default function MyTrades() {
  const [trades, setTrades] = useState([]);
  const [message, setMessage] = useState("");
  const [bankIds, setBankIds] = useState({}); // store bank_id per trade

  const loadTrades = async () => {
    try {
      const res = await listTrades();
      setTrades(res.data);
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to load trades");
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const handleStatusChange = async (tradeId, newStatus) => {
    try {
      await updateTradeStatus(tradeId, newStatus);
      setMessage("✅ Status updated");
      loadTrades();
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to update status");
    }
  };

  const handleAssignBank = async (tradeId) => {
    try {
      const bankId = bankIds[tradeId];
      if (!bankId) {
        alert("Please enter Bank ID");
        return;
      }

      await assignBankToTrade(tradeId, Number(bankId));
      setMessage("✅ Bank assigned to trade");
      loadTrades();
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to assign bank");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-4">My Trades</h2>

      {message && (
        <p className="mb-4 font-medium text-center">{message}</p>
      )}

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Buyer</th>
              <th className="p-2 border">Seller</th>
              <th className="p-2 border">Bank</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Currency</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Update Status</th>
              <th className="p-2 border">Assign Bank</th>
            </tr>
          </thead>

          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-4 text-center">
                  No trades found
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id}>
                  <td className="p-2 border">{trade.id}</td>
                  <td className="p-2 border">{trade.buyer_id}</td>
                  <td className="p-2 border">{trade.seller_id}</td>
                  <td className="p-2 border">
                    {trade.bank_id || "Not Assigned"}
                  </td>
                  <td className="p-2 border">{trade.amount}</td>
                  <td className="p-2 border">{trade.currency}</td>
                  <td className="p-2 border">{trade.status}</td>

                  {/* Update Status */}
                  <td className="p-2 border">
                    <select
                      value={trade.status}
                      onChange={(e) =>
                        handleStatusChange(trade.id, e.target.value)
                      }
                      className="border p-1 rounded"
                    >
                      <option value="pending">pending</option>
                      <option value="in_progress">in_progress</option>
                      <option value="completed">completed</option>
                      <option value="disputed">disputed</option>
                    </select>
                  </td>

                  {/* Assign Bank */}
                  <td className="p-2 border">
                    <input
                      type="number"
                      placeholder="Bank ID"
                      className="border p-1 w-20 mr-2"
                      onChange={(e) =>
                        setBankIds({
                          ...bankIds,
                          [trade.id]: e.target.value,
                        })
                      }
                    />
                    <button
                      onClick={() => handleAssignBank(trade.id)}
                      className="bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
