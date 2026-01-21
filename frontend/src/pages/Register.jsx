import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",          // 🔴 must be empty initially
    org_name: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      await api.post(
        "/auth/register",
        {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          org_name: form.org_name,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      alert("Registered successfully");
      navigate("/login");
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Registration failed");
    }
  };

return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 px-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-slate-800">
          Create Account
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Register a new user
        </p>
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Name
        </label>
        <input
          name="name"
          placeholder="Full name"
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Email
        </label>
        <input
          name="email"
          placeholder="you@example.com"
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
        />
      </div>

      {/* Password */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Password
        </label>
        <input
          name="password"
          type="password"
          placeholder="••••••••"
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
        />
      </div>

      {/* Organisation */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Organisation
        </label>
        <input
          name="org_name"
          placeholder="Organisation name"
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
        />
      </div>

      {/* Role */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Role
        </label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
        >
          <option value="">Select role</option>
          <option value="CORPORATE">Corporate</option>
          <option value="BANK">Bank</option>
          <option value="AUDITOR">Auditor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Register Button */}
      <button
        onClick={handleRegister}
        className="w-full bg-slate-800 hover:bg-slate-900
                   text-white font-medium py-2.5 rounded-lg
                   transition duration-200"
      >
        Register
      </button>

      {/* Footer */}
      <p className="text-sm text-slate-600 mt-6 text-center">
        Already have an account?{" "}
        <span
          onClick={() => navigate("/login")}
          className="text-slate-800 font-medium cursor-pointer hover:underline"
        >
          Login
        </span>
      </p>

    </div>
  </div>
);

}
