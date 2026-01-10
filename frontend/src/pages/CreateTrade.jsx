import { useState } from "react";
import { createTrade } from "../services/tradeApi";

export default function CreateTrade() {
  const [sellerId, setSellerId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createTrade({
        seller_id: Number(sellerId),
        amount: Number(amount),
        currency: currency,
      });

      setMessage("✅ Trade created successfully");
      setSellerId("");
      setAmount("");
    } catch (error) {
      setMessage("❌ Failed to create trade");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Create Trade</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            placeholder="Seller ID"
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Create Trade
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
