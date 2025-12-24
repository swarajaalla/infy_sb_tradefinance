import { useState } from "react";
import api from "../api/axios";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    org_name: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/auth/register", form);
    alert("Registration successful");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-96 space-y-3"
      >
        <h1 className="text-xl font-bold text-center">Register</h1>

        <input className="border p-2 w-full" placeholder="Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })} />

        <input className="border p-2 w-full" placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })} />

        <input type="password" className="border p-2 w-full" placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })} />

        <select
        className="border p-2 w-full"  value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="" disabled>Select Role</option>
          <option value="bank">Bank</option>.
          <option value="corporate">Corporate</option>
          <option value="auditor">Auditor</option>
        </select>



        <input className="border p-2 w-full" placeholder="Organisation"
          onChange={(e) => setForm({ ...form, org_name: e.target.value })} />

        <button className="bg-green-600 text-white w-full py-2 rounded">
          Register
        </button>

        <Link to="/login" className="block text-center text-blue-600 underline">
          Back to Login
        </Link>
      </form>
    </div>
  );
};

export default Register;
