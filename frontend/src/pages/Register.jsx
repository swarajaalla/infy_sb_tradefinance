import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    org_name: ""
  });

  const handleRegister = async (e) => {
  e.preventDefault();
  try {
    await axios.post("http://127.0.0.1:8000/auth/register", form);
    alert("Registration Successful 🎉 Now login");
    navigate("/");
  } catch (err) {
    if (err.response && err.response.status === 400) {
      alert("User already exists ❌");
    } else {
      alert("Registration failed ❌");
    }
  }
};


  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form className="bg-white p-6 w-96 rounded-lg shadow-lg space-y-4" onSubmit={handleRegister}>
        <h2 className="text-xl font-bold text-center text-gray-700">Register</h2>

        <input 
          placeholder="Name" 
          className="w-full border p-2 rounded"
          onChange={(e) => setForm({ ...form, name: e.target.value })} 
        />

        <input 
          placeholder="Email" 
          className="w-full border p-2 rounded"
          onChange={(e) => setForm({ ...form, email: e.target.value })} 
        />

        <input 
          placeholder="Organization" 
          className="w-full border p-2 rounded"
          onChange={(e) => setForm({ ...form, org_name: e.target.value })} 
        />

        {/* 👇 ROLE DROPDOWN ADDED HERE */}
        <select 
          className="w-full border p-2 rounded"
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          value={form.role}
          required
        >
          <option value="" disabled>
            Select Role
          </option>
          <option value="admin">Admin</option>
          <option value="bank">Bank</option>
          <option value="corporate">Corporate</option>
          <option value="auditor">Auditor</option>
        </select>


        <input 
          type="password" 
          placeholder="Password" 
          className="w-full border p-2 rounded"
          onChange={(e) => setForm({ ...form, password: e.target.value })} 
        />

        <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Register
        </button>

        <p className="text-sm text-center">
          Already have an account? <Link to="/" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
