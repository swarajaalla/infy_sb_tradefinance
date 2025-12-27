import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function LedgerExplorer() {
  const { documentId } = useParams();
  const [ledger, setLedger] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const res = await api.get(`/ledger/${documentId}`);
      setLedger(res.data);
    } catch (err) {
      setError("Failed to load ledger");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        Ledger Timeline – Document #{documentId}
      </h2>

      {error && <p className="text-red-500">{error}</p>}

      <ol className="border-l-4 border-blue-500 pl-4">
        {ledger.map((entry) => (
          <li key={entry.id} className="mb-6">
            <div className="font-semibold text-blue-700">
              {entry.action}
            </div>

            <div className="text-sm text-gray-600">
              {new Date(entry.created_at).toLocaleString()}
            </div>

            {entry.meta_data?.note && (
              <div className="text-gray-800 mt-1">
                📝 {entry.meta_data.note}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
