import { useLocation, Link } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  // Hide navbar on login & register
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <nav className="navbar">
      <h2>ChainDocs</h2>

      <div style={{ marginLeft: "auto", display: "flex", gap: "20px" }}>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/documents">Documents</Link>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
