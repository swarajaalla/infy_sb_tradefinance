import { useState } from "react";
import axios from "axios";
import "../styles/Auth.css";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://127.0.0.1:8000/auth/login", {
        username,
        password
      });

      // Save username for protected routes
      localStorage.setItem("username", response.data.username);

      setError("");

      // Redirect to dashboard
      navigate("/dashboard");
    }
    catch (err) {
      if (err.response) {
        setError(err.response.data.detail);
      } else {
        setError("Server not reachable");
      }
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="text"
        placeholder="Enter Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

      <p onClick={() => navigate("/register")}>
        Don't have an account? Register
      </p>
    </div>
  );
}
