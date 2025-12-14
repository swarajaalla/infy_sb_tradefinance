import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // IMPORTANT: FormData (NOT JSON)
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Login failed");
        return;
      }

      // Save token
      localStorage.setItem("token", data.access_token);

      // Decode role from JWT payload
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      localStorage.setItem("role", payload.role);

      // Role-based redirect
      if (payload.role === "admin") {
        navigate("/admin");
      } else if (payload.role === "corporate") {
        navigate("/corporate");
      } else if (payload.role === "bank") {
        navigate("/bank");
      } else if (payload.role === "auditor") {
        navigate("/auditor");
      }
      else {
        navigate("/");
      }

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
