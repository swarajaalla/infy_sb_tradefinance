import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getIntegrityStatus,
  runIntegrityCheck,
} from "../services/integrityApi";

export default function IntegrityAlerts() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await getIntegrityStatus();
    setData(res.data.records);
    setSummary(res.data.summary);
  };

  const filteredData =
    filter === "ALL"
      ? data
      : data.filter((d) => d.status === filter);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Integrity Status</h1>

      {/* SUMMARY */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card title="Total Checks" value={summary.total} />
        <Card title="Passed" value={summary.passed} color="green" />
        <Card title="Failed" value={summary.failed} color="red" />
        <Card title="Pending" value={summary.pending} color="yellow" />
      </div>

      {/* FILTER + ACTION */}
      <div className="flex justify-between mb-4">
        <div className="space-x-2">
          {["ALL", "PASSED", "FAILED", "PENDING"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "border"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={runIntegrityCheck}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Run Integrity Check
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th>ID</th>
            <th>Document</th>
            <th>Type</th>
            <th>Status</th>
            <th>Stored Hash</th>
            <th>Computed Hash</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row) => (
            <tr key={row.id} className="border-t">
              <td>{row.id}</td>
              <td>{row.document_id}</td>
              <td>{row.type}</td>
              <td>
                <span className={`px-2 py-1 rounded text-sm ${
                  row.status === "PASSED"
                    ? "bg-green-100 text-green-700"
                    : row.status === "FAILED"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {row.status}
                </span>
              </td>
              <td className="truncate max-w-xs">{row.stored_hash}</td>
              <td className="truncate max-w-xs">{row.computed_hash || "-"}</td>
              <td>{new Date(row.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

function Card({ title, value, color }) {
  return (
    <div className="bg-white shadow rounded p-4">
      <p className="text-gray-500">{title}</p>
      <p className={`text-2xl font-bold text-${color || "black"}-600`}>
        {value || 0}
      </p>
    </div>
  );
}
