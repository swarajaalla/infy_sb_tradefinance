// frontend/src/pages/LedgerEntries.jsx
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const ACTIONS = [
  "ISSUED",
  "AMENDED",
  "SHIPPED",
  "RECEIVED",
  "PAID",
  "CANCELLED",
  "VERIFIED",
];

export default function LedgerEntries() {
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    document_id: "",
    action: "",
    meta_data: "",
  });

  const [documentId, setDocumentId] = useState("");
  const [entryId, setEntryId] = useState("");
  const [documentEntries, setDocumentEntries] = useState([]);
  const [singleEntry, setSingleEntry] = useState(null);

  /* ---------------- LOAD ---------------- */

  const loadEntries = async () => {
    try {
      const res = await api.get("/ledger/entries");
      setEntries(res.data);
    } catch {
      setError("Failed to load ledger entries");
    }
  };

  const loadStatus = async () => {
    try {
      const res = await api.get("/ledger/status");
      setStatus(res.data);
    } catch {
      setError("Failed to load ledger status");
    }
  };

  useEffect(() => {
    loadEntries();
    loadStatus();
  }, []);

  /* ---------------- CREATE ENTRY ---------------- */

  const createEntry = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/ledger/entries", {
        document_id: Number(form.document_id),
        action: form.action,
        meta_data: form.meta_data || null,
      });

      setForm({ document_id: "", action: "", meta_data: "" });
      await loadEntries();
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid input");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FILTER ---------------- */

  const fetchDocumentEntries = async () => {
    if (!documentId) return;
    try {
      const res = await api.get(`/ledger/documents/${documentId}/entries`);
      setDocumentEntries(res.data);
    } catch {
      setError("Failed to load document entries");
    }
  };

  const fetchSingleEntry = async () => {
    if (!entryId) return;
    try {
      const res = await api.get(`/ledger/entries/${entryId}`);
      setSingleEntry(res.data);
    } catch {
      setError("Failed to load entry");
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Ledger Entries</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* ---------------- CREATE ---------------- */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Create Ledger Entry</h2>

        <form
          onSubmit={createEntry}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <input
            type="number"
            className="border rounded px-3 py-2"
            placeholder="Document ID"
            value={form.document_id}
            onChange={(e) =>
              setForm({ ...form, document_id: e.target.value })
            }
            required
          />

          <select
            className="border rounded px-3 py-2"
            value={form.action}
            onChange={(e) =>
              setForm({ ...form, action: e.target.value })
            }
            required
          >
            <option value="">Select Action</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <input
            className="border rounded px-3 py-2"
            placeholder="Meta Data (optional)"
            value={form.meta_data}
            onChange={(e) =>
              setForm({ ...form, meta_data: e.target.value })
            }
          />

          <button
            disabled={loading}
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      {/* ---------------- ALL ENTRIES ---------------- */}
      <div className="bg-white rounded shadow overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-center">ID</th>
              <th className="px-4 py-3 text-center">Document</th>
              <th className="px-4 py-3 text-center">Action</th>
              <th className="px-4 py-3 text-center">Actor</th>
              <th className="px-4 py-3 text-center">Created</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr
                key={e.id}
                className={`border-t ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="px-4 py-3 text-center">{e.id}</td>
                <td className="px-4 py-3 text-center">{e.document_id}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 text-xs rounded bg-blue-600 text-white">
                    {e.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{e.actor_id}</td>
                <td className="px-4 py-3 text-center">
                  {new Date(e.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------- FILTER BY DOCUMENT ---------------- */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="font-semibold mb-3">Entries by Document</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="number"
            className="border rounded px-3 py-2"
            placeholder="Document ID"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
          />
          <button
            onClick={fetchDocumentEntries}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Load
          </button>
        </div>

        {documentEntries.length > 0 && (
          <ul className="divide-y">
            {documentEntries.map((e) => (
              <li key={e.id} className="py-2 flex justify-between text-sm">
                <span>{e.action}</span>
                <span>{new Date(e.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------------- SINGLE ENTRY ---------------- */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="font-semibold mb-3">Single Entry</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="number"
            className="border rounded px-3 py-2"
            placeholder="Entry ID"
            value={entryId}
            onChange={(e) => setEntryId(e.target.value)}
          />
          <button
            onClick={fetchSingleEntry}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Load
          </button>
        </div>

        {singleEntry && (
          <pre className="bg-gray-100 p-4 rounded text-sm">
            {JSON.stringify(singleEntry, null, 2)}
          </pre>
        )}
      </div>

      {/* ---------------- STATUS ---------------- */}
      {status && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Ledger Summary</h2>

          <p className="mb-4">
            Total Entries:{" "}
            <span className="font-bold text-blue-600">
              {status.total_entries}
            </span>
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(status.by_action).map(([action, count]) => (
              <div
                key={action}
                className="border rounded p-4 text-center bg-gray-50"
              >
                <div className="text-sm text-gray-600">{action}</div>
                <div className="text-xl font-bold text-blue-600">
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
