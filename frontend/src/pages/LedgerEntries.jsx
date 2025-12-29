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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    document_id: "",
    action: "",
    meta_data: "",
  });

  const [documentId, setDocumentId] = useState("");
  const [entryId, setEntryId] = useState("");
  const [documentEntries, setDocumentEntries] = useState([]);
  const [singleEntry, setSingleEntry] = useState(null);

  /* ---------------- API CALLS ---------------- */

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
      setError(err.response?.data?.detail || "Invalid input data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentEntries = async () => {
    if (!documentId) return;
    try {
      const res = await api.get(`/ledger/documents/${documentId}/entries`);
      setDocumentEntries(res.data);
    } catch {
      setError("Failed to load entries for document " + documentId);
    }
  };

  const fetchSingleEntry = async () => {
    if (!entryId) return;
    try {
      const res = await api.get(`/ledger/entries/${entryId}`);
      setSingleEntry(res.data);
    } catch {
      setError("Failed to load entry " + entryId);
    }
  };

  useEffect(() => {
    loadEntries();
    loadStatus();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Ledger Entries</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {/* CREATE ENTRY */}
      <form
        onSubmit={createEntry}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <input
          type="number"
          className="border rounded px-3 py-2"
          placeholder="Document ID"
          value={form.document_id}
          onChange={(e) => setForm({ ...form, document_id: e.target.value })}
          required
        />

        <select
          className="border rounded px-3 py-2"
          value={form.action}
          onChange={(e) => setForm({ ...form, action: e.target.value })}
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
          onChange={(e) => setForm({ ...form, meta_data: e.target.value })}
        />

        <button
          disabled={loading}
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </form>

      {/* ALL ENTRIES TABLE */}
      <div className="bg-white rounded-lg shadow overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-center">ID</th>
              <th className="px-4 py-3 text-center">Document</th>
              <th className="px-4 py-3 text-center">Action</th>
              <th className="px-4 py-3 text-center">Actor</th>
              <th className="px-4 py-3 text-center">Created At</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr
                key={e.id}
                className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <td className="px-4 py-3 text-center">{e.id}</td>
                <td className="px-4 py-3 text-center">{e.document_id}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 rounded text-white bg-blue-600 text-xs">
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

      {/* ENTRIES BY DOCUMENT */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Entries by Document ID</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            className="border rounded px-3 py-2"
            placeholder="Document ID"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
          />
          <button
            onClick={fetchDocumentEntries}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            Load
          </button>
        </div>

        {documentEntries.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-center">ID</th>
                  <th className="px-4 py-3 text-center">Action</th>
                  <th className="px-4 py-3 text-center">Actor</th>
                  <th className="px-4 py-3 text-center">Created At</th>
                </tr>
              </thead>
              <tbody>
                {documentEntries.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="px-4 py-3 text-center">{e.id}</td>
                    <td className="px-4 py-3 text-center">{e.action}</td>
                    <td className="px-4 py-3 text-center">{e.actor_id}</td>
                    <td className="px-4 py-3 text-center">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SINGLE ENTRY BY ID */}
      <div>
        <h2 className="font-semibold mb-2">Single Entry by ID</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            className="border rounded px-3 py-2"
            placeholder="Entry ID"
            value={entryId}
            onChange={(e) => setEntryId(e.target.value)}
          />
          <button
            onClick={fetchSingleEntry}
            className="bg-purple-600 text-white px-3 py-1 rounded"
          >
            Load
          </button>
        </div>

        {singleEntry && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-center">ID</th>
                  <th className="px-4 py-3 text-center">Document</th>
                  <th className="px-4 py-3 text-center">Action</th>
                  <th className="px-4 py-3 text-center">Actor</th>
                  <th className="px-4 py-3 text-center">Created At</th>
                  {/* <th className="px-4 py-3 text-center">Meta Data</th> */}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t bg-white">
                  <td className="px-4 py-3 text-center">{singleEntry.id}</td>
                  <td className="px-4 py-3 text-center">{singleEntry.document_id}</td>
                  <td className="px-4 py-3 text-center">{singleEntry.action}</td>
                  <td className="px-4 py-3 text-center">{singleEntry.actor_id}</td>
                  <td className="px-4 py-3 text-center">{new Date(singleEntry.created_at).toLocaleString()}</td>
                  {/* <td className="px-4 py-3 text-center">{singleEntry.meta_data || "N/A"}</td> */}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LEDGER STATUS */}
      {status && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Ledger Summary</h2>

          <div className="mb-4">
            <span className="text-gray-600">Total Entries:</span>
            <span className="ml-2 font-bold text-blue-600">{status.total_entries}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(status.by_action).map(([action, count]) => (
              <div key={action} className="border rounded p-4 text-center bg-gray-50">
                <div className="text-sm text-gray-600">{action}</div>
                <div className="text-xl font-bold text-blue-600">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
