import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    documents: 0,
    verified: 0,
    ledger: 0,
  });

  useEffect(() => {
  async function fetchStats() {
    try {
      const res = await api.get("/dashboard/stats");
      setStats({
        documents: res.data.documents,
        verified: res.data.verified_documents,
        ledger: res.data.trades,
      });
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
  }
  fetchStats();
}, []);


  return (
    <Layout>
      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Overview of your trade finance documents
        </p>
      </div>

      {/* STATS TABLE */}
      <div className="bg-white p-6 rounded-xl shadow">
        <table className="w-full border border-gray-300 border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3 text-left">Category</th>
              <th className="border p-3 text-left">Count</th>
              <th className="border p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50">
              <td className="border p-3 font-medium">My Documents</td>
              <td className="border p-3">{stats.documents}</td>
              <td className="border p-3 text-blue-600">Uploaded</td>
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="border p-3 font-medium">Verified Documents</td>
              <td className="border p-3">{stats.verified}</td>
              <td className="border p-3 text-green-600">Verified</td>
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="border p-3 font-medium">Ledger Entries</td>
              <td className="border p-3">{stats.ledger}</td>
              <td className="border p-3 text-purple-600">
                Blockchain Records
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
