import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import toast from "react-hot-toast";

export default function CreateTrade() {
  const [sellerId, setSellerId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
  await api.post("/trades", null, {
    params: {
      seller_id: Number(sellerId),
      amount: Number(amount),
      currency,
    },
  });

  toast.success("Trade created successfully");
  navigate("/trades");

} catch (err) {
  console.error(err);
  toast.error("Failed to create trade");
}
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4">Create New Trade</h2>

        {error && (
          <p className="text-red-600 mb-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            placeholder="Seller ID"
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="text"
            placeholder="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
          >
            Create Trade
          </button>
        </form>
      </div>
    </Layout>
  );
}
