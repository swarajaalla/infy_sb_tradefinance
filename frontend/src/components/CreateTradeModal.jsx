import { useState } from "react";
import { createTrade } from "../services/tradeApi";

export default function CreateTradeModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    seller_email: "",
    description: "",
    amount: "",
    currency: "USD",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    await createTrade(form);
    onCreated(); // refresh trades
    onClose();   // close modal
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          Create New Trade
        </h2>

        <form onSubmit={submit} className="space-y-4">
          <input
            name="seller_email"
            placeholder="Seller Email"
            onChange={handleChange}
            className="input w-full"
            required
          />

          <textarea
            name="description"
            placeholder="Describe the trade..."
            onChange={handleChange}
            className="input w-full"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              name="amount"
              type="number"
              placeholder="Amount"
              onChange={handleChange}
              className="input"
              required
            />

            <select
              name="currency"
              onChange={handleChange}
              className="input"
            >
              <option>USD</option>
              <option>INR</option>
              <option>EUR</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 px-4 py-2 rounded-md text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700
                         text-white px-4 py-2 rounded-md text-sm"
            >
              Create Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
