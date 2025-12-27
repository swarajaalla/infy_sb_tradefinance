import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function DocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data);
    } catch (err) {
      setError("Failed to load documents");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
        
        {/* Header */}
        <h2 className="text-3xl font-bold text-gray-800 mb-1">
          My Documents
        </h2>
        <p className="text-gray-500 mb-6">
          Secure trade documents with blockchain-backed audit trail
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {documents.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500">
            📂 No documents uploaded yet
          </div>
        )}

        {documents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden">
              <thead className="bg-blue-50">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 border-b">Type</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 border-b">Number</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 border-b">Hash</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 border-b">Uploaded</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 border-b">Status</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 border-b">Ledger</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 border-b">Verify</th>
                </tr>
              </thead>

              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="p-4 text-sm text-gray-800 border-b">
                      {doc.doc_type}
                    </td>

                    <td className="p-4 text-sm text-gray-800 border-b">
                      {doc.doc_number}
                    </td>

                    <td className="p-4 text-sm text-gray-600 border-b">
                      {doc.hash.slice(0, 16)}…
                    </td>

                    <td className="p-4 text-sm text-gray-600 border-b">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>

                    <td className="p-4 border-b">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        VERIFIED
                      </span>
                    </td>

                    <td className="p-4 border-b">
                      <Link
                        to={`/ledger/${doc.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </Link>
                    </td>

                    <td className="p-4 border-b">
                      <button
                        onClick={() => verifyDocument(doc.id)}
                        className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-1.5 rounded-md text-sm"
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

async function verifyDocument(id) {
  try {
    await api.get(`/documents/${id}/verify`);
    alert("✅ Document is VALID");
  } catch {
    alert("❌ Document has been TAMPERED");
  }
}
