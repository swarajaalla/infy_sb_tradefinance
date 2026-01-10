import { useEffect, useState } from "react";
import { getIntegrityAlerts } from "../services/integrityApi";

export default function IntegrityAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function loadAlerts() {
      const res = await getIntegrityAlerts();
      setAlerts(res.data);
    }
    loadAlerts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-4 text-red-600">
        🚨 Integrity Alerts
      </h2>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Document ID</th>
              <th className="p-2 border">Reason</th>
              <th className="p-2 border">Details</th>
              <th className="p-2 border">Detected At</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center">
                  ✅ No integrity issues found
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="bg-red-50">
                  <td className="p-2 border">{alert.document_id}</td>
                  <td className="p-2 border font-semibold text-red-600">
                    {alert.meta_data?.reason}
                  </td>
                  <td className="p-2 border text-sm">
                    {JSON.stringify(alert.meta_data)}
                  </td>
                  <td className="p-2 border">
                    {new Date(alert.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
