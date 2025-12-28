import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";

const Ledger = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [docFilter, setDocFilter] = useState("");

  const role = user?.role?.toLowerCase();

  useEffect(() => {
    const loadLedger = async () => {
      try {
        const res = await api.get("/ledger/entries/all");
        setEntries(res.data);
      } catch (err) {
        setError("Failed to load ledger entries");
      } finally {
        setLoading(false);
      }
    };

    if (role === "auditor") {
      loadLedger();
    } else {
      setLoading(false);
    }
  }, [role]);

  if (loading) return <div className="p-6">Loading ledger...</div>;

  if (role !== "auditor") {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Access denied. Only auditors can view the ledger.
      </div>
    );
  }

  const filtered = docFilter
    ? entries.filter((e) => String(e.document_id) === docFilter)
    : entries;

  const eventColor = (type) => {
    switch (type) {
      case "UPLOADED":
        return "text-green-600 font-semibold";
      case "VERIFIED":
        return "text-blue-600 font-semibold";
      case "MODIFIED":
        return "text-orange-600 font-semibold";
      case "ACCESSED":
        return "text-gray-700";
      default:
        return "";
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Ledger Entries</h1>

      {error && <p className="text-red-500">{error}</p>}

      {/* Filter */}
      <div className="bg-white p-3 rounded shadow w-64">
        <input
          className="border p-2 w-full"
          placeholder="Filter by Document ID"
          value={docFilter}
          onChange={(e) => setDocFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Entry ID</th>
              <th className="border p-2">Doc ID</th>
              <th className="border p-2">Event</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Hash Before</th>
              <th className="border p-2">Hash After</th>
              <th className="border p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No ledger entries found
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td className="border p-2">{e.id}</td>
                  <td className="border p-2">{e.document_id}</td>
                  <td className={`border p-2 ${eventColor(e.event_type)}`}>
                    {e.event_type}
                  </td>
                  <td className="border p-2">{e.description || "-"}</td>
                  <td className="border p-2 truncate max-w-xs">
                    {e.hash_before || "-"}
                  </td>
                  <td className="border p-2 truncate max-w-xs">
                    {e.hash_after || "-"}
                  </td>
                  <td className="border p-2">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Ledger;
