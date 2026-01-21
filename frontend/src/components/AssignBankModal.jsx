import { useEffect, useState } from "react";
import { getBanks, assignBankToTrade } from "../services/tradeApi";

export default function AssignBankModal({ tradeId, onClose, onAssigned }) {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [loading, setLoading] = useState(false);

 useEffect(() => {
  const token = localStorage.getItem("token");
  console.log("BANK MODAL TOKEN:", token);

  if (!token) {
    alert("Not authenticated");
    return;
  }

  const loadBanks = async () => {
      try {
        const res = await getBanks();
        console.log("BANK LIST:", res.data);
        setBanks(res.data || []); // ✅ fallback safety
      } catch (err) {
        console.error("Failed to load banks", err.response?.data || err);
        setBanks([]); // ✅ never null
      }
    };

    loadBanks();
}, []);



  const assign = async () => {
    if (!selectedBank) {
      alert("Select a bank");
      return;
    }

    setLoading(true);
    try {
      await assignBankToTrade(tradeId, selectedBank);
      onAssigned();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to assign bank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">

        <h2 className="text-lg font-semibold mb-4">Assign Bank</h2>

        <select
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-4"
        >
          <option value="">Select Bank</option>
          {banks.map(bank => (
            <option key={bank.id} value={bank.email}>
              {bank.email} ({bank.org_name})
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 rounded"
          >
            Cancel
          </button>

          <button
            onClick={assign}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
