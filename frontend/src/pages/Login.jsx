import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await api.post(
        "/auth/login",
        {
          email: email.trim(),
          password: password
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");

    } catch (err) {
      console.error("LOGIN ERROR:", err.response?.data || err);

      if (err.response?.status === 401) {
        alert("Invalid credentials");
      } else if (err.response?.status === 422) {
        alert("Invalid request format");
      } else {
        alert("Login failed");
      }
    }
  };

   return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-800">
            Sign In
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access your account
          </p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
          />
        </div>

        {/* Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-slate-800 hover:bg-slate-900
                     text-white font-medium py-2.5 rounded-lg
                     transition duration-200"
        >
          Login
        </button>

        {/* Footer */}
        <p className="text-sm text-slate-600 mt-6 text-center">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-slate-800 font-medium cursor-pointer hover:underline"
          >
            Register
          </span>
        </p>

      </div>
    </div>
  );

}
