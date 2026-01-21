import { useState } from "react";
import { createTrade } from "../services/tradeApi";
import { useNavigate } from "react-router-dom";

export default function CreateTrade() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    seller_email: "",
    description: "",
    amount: "",
    currency: "USD",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createTrade(form);
    alert("Trade created");
    navigate("/trades");
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded">
      <h2 className="text-xl font-semibold mb-4">Create Trade</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="seller_email"
          placeholder="Seller Email"
          onChange={handleChange}
          className="input"
        />

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          className="input"
        />

        <input
          name="amount"
          type="number"
          placeholder="Amount"
          onChange={handleChange}
          className="input"
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

        <button className="btn-primary">Create</button>
      </form>
    </div>
  );
}
