import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";

// Compute SHA-256 hash of file
async function computeSHA256(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

const Documents = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    doc_type: "",
    doc_number: "",
    issued_at: "",
    file: null,
  });

  const role = user?.role?.toLowerCase();
  const isCorporate = role === "corporate";
  const isAdmin = role === "admin";

  // Fetch documents
  const loadDocuments = async () => {
    try {
      const res = await api.get("/documents/list");
      setDocs(res.data);
    } catch (err) {
      console.error("Failed to load documents");
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      loadDocuments();
    }
  }, [isAdmin]);

  // Upload document (only corporate)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.file) {
      alert("Please select a file");
      return;
    }

    try {
      setLoading(true);

      const hash = await computeSHA256(form.file);

      const data = new FormData();
      data.append("doc_type", form.doc_type);
      data.append("doc_number", form.doc_number);
      data.append("issued_at", form.issued_at);
      data.append("hash", hash);
      data.append("file", form.file);

      await api.post("/documents/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Document uploaded successfully");

      setForm({
        doc_type: "",
        doc_number: "",
        issued_at: "",
        file: null,
      });

      loadDocuments();
    } catch (err) {
      alert("❌ Upload failed or you are not authorized");
    } finally {
      setLoading(false);
    }
  };

  // Admin should not see documents at all
  if (isAdmin) {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Admins are not allowed to access business documents.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Documents</h1>

      {/* Upload form only for Corporate */}
      {isCorporate && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded shadow space-y-4"
        >
          <h2 className="text-lg font-semibold">Upload Document</h2>

          <input
            className="border p-2 w-full"
            placeholder="Document Type (INVOICE / BL / LOC)"
            value={form.doc_type}
            onChange={(e) =>
              setForm({ ...form, doc_type: e.target.value })
            }
            required
          />

          <input
            className="border p-2 w-full"
            placeholder="Document Number"
            value={form.doc_number}
            onChange={(e) =>
              setForm({ ...form, doc_number: e.target.value })
            }
            required
          />

          <input
            type="date"
            className="border p-2 w-full"
            value={form.issued_at}
            onChange={(e) =>
              setForm({ ...form, issued_at: e.target.value })
            }
            required
          />

          <input
            type="file"
            className="border p-2 w-full"
            onChange={(e) =>
              setForm({ ...form, file: e.target.files[0] })
            }
            required
          />

          <button
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}

      {/* Documents list for Bank, Corporate, Auditor */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Document List</h2>

        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Number</th>
              <th className="border p-2">Org</th>
              <th className="border p-2">Issued</th>
              <th className="border p-2">File</th>
              <th className="border p-2">Hash</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td className="border p-2">{d.id}</td>
                <td className="border p-2">{d.doc_type}</td>
                <td className="border p-2">{d.doc_number}</td>
                <td className="border p-2">{d.org_name}</td>
                <td className="border p-2">
                  {new Date(d.issued_at).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  <a
                    href={`${import.meta.env.VITE_API_URL}${d.file_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    View
                  </a>
                </td>
                <td className="border p-2 truncate max-w-xs">
                  {d.hash}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Documents;
