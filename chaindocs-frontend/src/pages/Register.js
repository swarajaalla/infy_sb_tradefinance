import { useState } from "react";
import axios from "axios";
import "../styles/Auth.css";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const body = {
        username: username,
        password: password,
        role: role,
        org_name: orgName
      };

      // Removed unused response variable
      await axios.post("http://127.0.0.1:8000/auth/register", body);

      setSuccess("Account created successfully!");
      setError("");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      if (err.response) {
        setError(err.response.data.detail);
      } else {
        setError("Server not reachable");
      }
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

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

      <input
        type="text"
        placeholder="Enter Role (Bank / Buyer / Corporate)"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />

      <input
        type="text"
        placeholder="Enter Organization Name"
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
      />

      <button onClick={handleRegister}>Register</button>

      <p onClick={() => navigate("/login")}>Already have an account? Login</p>
    </div>
  );
}
