import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function LedgerExplorer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await api.get(`/ledger/document/${id}`);
        setEntries(res.data);
      } catch (err) {
        console.error(err.response?.data || err);
        alert("Unable to load ledger");
        navigate("/documents");
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, [id, navigate]);

  if (loading) return <p className="p-4">Loading ledger...</p>;

  return (
  <div className="min-h-screen bg-slate-100 px-6 py-8">

    <div className="max-w-3xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">
          Ledger Timeline
        </h2>

        <button
          onClick={() => navigate("/documents")}
          className="bg-slate-200 hover:bg-slate-300
                     text-slate-800 px-4 py-2 rounded-md
                     text-sm transition"
        >
          Back to Documents
        </button>
      </div>

      <p className="text-sm text-slate-500 mb-6">
        Document ID: <span className="font-medium text-slate-700">#{id}</span>
      </p>

      {/* CONTENT */}
      <div className="bg-white rounded-2xl shadow-sm p-6">

        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">
            No ledger entries found.
          </p>
        ) : (
          <div className="space-y-6">

            {entries.map((entry, index) => (
  <div
    key={entry.id}
    className="relative pl-6 border-l-2 border-slate-300"
  >
    {/* Timeline Dot */}
    <span
      className="absolute -left-[7px] top-2
                 h-3 w-3 rounded-full bg-slate-600"
    />

    {/* Entry Card */}
    <div className="bg-slate-50 rounded-lg p-4">

      <h3 className="font-semibold text-slate-800 mb-1">
        {index + 1}. {entry.event_type}
      </h3>

      <div className="text-sm text-slate-700 space-y-1">

        {/* ✅ SHOW TRADE ID ONLY IF PRESENT */}
        {entry.trade_id && (
          <p>
            <span className="font-medium">Trade ID:</span>{" "}
            #{entry.trade_id}
          </p>
        )}

        <p>
          <span className="font-medium">Performed By (User ID):</span>{" "}
          {entry.performed_by}
        </p>

        <p>
          <span className="font-medium">Role:</span>{" "}
          {entry.role}
        </p>

        <p>
          <span className="font-medium">Timestamp:</span>{" "}
          {new Date(entry.created_at).toLocaleString()}
        </p>

        {entry.previous_hash && (
          <p className="break-all">
            <span className="font-medium">Previous Hash:</span>{" "}
            {entry.previous_hash}
          </p>
        )}

        {entry.current_hash && (
          <p className="break-all">
            <span className="font-medium">Current Hash:</span>{" "}
            {entry.current_hash}
          </p>
        )}
      </div>
    </div>
  </div>
))}


          </div>
        )}

      </div>
    </div>
  </div>
);

}
