import { useEffect, useState } from "react";
import api from "../api/axios";

export default function DocumentsList({ tradeId }) {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tradeId) return;

    const fetchDocs = async () => {
      try {
        const res = await api.get(`/documents/by-trade/${tradeId}`);
        setDocuments(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load documents");
      }
    };

    fetchDocs();
  }, [tradeId]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (documents.length === 0) {
    return <p>No documents found</p>;
  }

  return (
    <table className="w-full border">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2">Type</th>
          <th className="border p-2">Doc No</th>
          <th className="border p-2">Hash</th>
          <th className="border p-2">Uploaded</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr key={doc.id}>
            <td className="border p-2">{doc.doc_type}</td>
            <td className="border p-2">{doc.doc_number}</td>
            <td className="border p-2 text-xs">{doc.hash}</td>
            <td className="border p-2">
              {new Date(doc.created_at).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
