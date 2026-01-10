import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
  import { Link } from "react-router-dom";
export default function DocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
const navigate = useNavigate();

const handleEdit = (doc) => {
  navigate("/documents", {
    state: {
      editMode: true,
      document: doc
    }
  });
};

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load documents");
    }
  };

  return (
    <div className="overflow-x-auto">
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <table className="w-full border border-gray-300 bg-white rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-3 text-left">Header</th>
            <th className="border p-3 text-left">Doc No</th>
            <th className="border p-3 text-left">Organization</th>
            <th className="border p-3 text-left">File</th>
            <th className="border p-3 text-left">Hash</th>
            <th className="border p-3 text-left">Uploaded</th>
            <th className="border p-3 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {documents.length === 0 && (
            <tr>
              <td colSpan="7" className="p-4 text-center text-gray-500">
                No documents found
              </td>
            </tr>
          )}

          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="border p-3 font-medium">{doc.doc_type}</td>

              <td className="border p-3">{doc.doc_number}</td>

              <td className="border p-3">
                {doc.organization || "N/A"}
              </td>

              <td className="border p-3">
                <a
                  href={`http://127.0.0.1:8000/${doc.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  View
                </a>
              </td>

              <td className="border p-3 text-xs">
                {doc.hash?.slice(0, 15)}…
              </td>

              <td className="border p-3">
                {new Date(doc.created_at).toLocaleString()}
              </td>

              <td className="border p-3">
                <button
  onClick={() => handleEdit(doc)}
  className="text-blue-600 underline"
>
  Edit
</button>

              </td>
              <td>
  <Link
    to={`/ledger/${doc.id}`}
    className="text-blue-600 hover:underline"
  >
    Ledger
  </Link>
</td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
