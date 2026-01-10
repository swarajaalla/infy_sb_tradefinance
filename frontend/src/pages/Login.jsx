import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";  
import { jwtDecode } from "jwt-decode";


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    // 🔥 CLEAR PREVIOUS USER
    localStorage.clear();
        const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);



const res = await axios.post(
  "http://127.0.0.1:8000/auth/login",
  formData,
  {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }
);


const token = res.data.access_token;
   
// ✅ STORE TOKEN
localStorage.setItem("access_token", token);

// ✅ DECODE TOKEN
const decoded = jwtDecode(token);

// ✅ STORE USER INFO
localStorage.setItem("username", decoded.sub);
localStorage.setItem("role", decoded.role);

navigate("/dashboard");

  } catch (err) {
    console.error(err);
    alert("❌ Invalid username or password");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-lg w-96"
      >
        <h2 className="text-3xl font-bold text-center mb-6">Login</h2>

        <label className="block text-sm font-medium mb-1">
          Username or Email
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />

        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-6 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          Login
        </button>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
