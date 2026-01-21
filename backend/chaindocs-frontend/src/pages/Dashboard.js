import { Link } from "react-router-dom";
import "../styles/Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-container">

      {/* Sidebar menu */}
      <div className="sidebar">
        <h3>ChainDocs</h3>
        <p>Trade Finance Explorer</p>

        <Link to="/dashboard">Overview</Link>
        <Link to="/documents">Documents</Link>
        <Link to="/ledger">Ledger Explorer</Link>
        <Link to="/audit">Audit Logs</Link>
      </div>

      {/* Main dashboard content */}
      <div className="content">
        <h2 className="heading">Dashboard Overview</h2>

        {/* Metrics */}
        <div className="metrics">
          <div>
            <strong>Total Documents:</strong> 128
          </div>
          <div>
            <strong>Active Trades:</strong> 23
          </div>
          <div>
            <strong>Disputes:</strong> 2
          </div>
        </div>

        {/* Recent Activity */}
        <h3 className="sub-heading">Recent Activity</h3>
        <ul>
          <li>Invoice INV-1001 issued by Acme Corp</li>
          <li>Bill of Lading BOL-200 verified</li>
          <li>Risk score updated for Counterparty XYZ</li>
        </ul>
      </div>

    </div>
  );
}
