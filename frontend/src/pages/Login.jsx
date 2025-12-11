// src/pages/Login.jsx
import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://127.0.0.1:8000/auth/login", form);

      const { access_token, user } = res.data;
      const { role, org_name } = user;

      // Store in localStorage
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("role", role.toLowerCase());
      localStorage.setItem("org", org_name);

      // Redirect based on backend role
      switch (role.toLowerCase()) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "bank":
          navigate("/bank/dashboard");
          break;
        case "corporate":
          navigate("/corporate/dashboard");
          break;
        case "auditor":
          navigate("/auditor/dashboard");
          break;
        default:
          navigate("/unauthorized");
      }
    } catch (err) {
      console.error(err);
      alert("Invalid Credentials ❌");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 w-80 rounded-lg shadow-lg space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-700">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Login
        </button>

        <p className="text-sm text-center">
          New user?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
