import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";

const Documents = () => {
  const { user } = useAuth();

  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    doc_type: "",
    doc_number: "",
    file_url: "",
    hash: "",
  });

  const isAuditor = user?.role === "auditor";

  // Fetch documents
  const loadDocuments = async () => {
    try {
      const res = await api.get("/documents/list");
      setDocs(res.data);
    } catch (err) {
      console.error("Failed to fetch documents");
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Create document (not for auditor)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/documents/create", form);
      alert("Document created successfully");
      setForm({
        title: "",
        description: "",
        doc_type: "",
        doc_number: "",
        file_url: "",
        hash: "",
      });
      loadDocuments();
    } catch (err) {
      alert("You are not allowed to create documents");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Documents</h1>

      {/* CREATE DOCUMENT (hidden for auditor) */}
      {!isAuditor && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded shadow space-y-3"
        >
          <h2 className="text-lg font-semibold">Create Document</h2>

          <input
            className="border p-2 w-full"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <input
            className="border p-2 w-full"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            className="border p-2 w-full"
            placeholder="Document Type"
            value={form.doc_type}
            onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
          />

          <input
            className="border p-2 w-full"
            placeholder="Document Number"
            value={form.doc_number}
            onChange={(e) =>
              setForm({ ...form, doc_number: e.target.value })
            }
          />

          <input
            className="border p-2 w-full"
            placeholder="File URL"
            value={form.file_url}
            onChange={(e) => setForm({ ...form, file_url: e.target.value })}
          />

          <input
            className="border p-2 w-full"
            placeholder="Hash"
            value={form.hash}
            onChange={(e) => setForm({ ...form, hash: e.target.value })}
          />

          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Create
          </button>
        </form>
      )}

      {/* DOCUMENTS LIST */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Document List</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Title</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Org</th>
              <th className="border p-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td className="border p-2">{d.id}</td>
                <td className="border p-2">{d.title}</td>
                <td className="border p-2">{d.doc_type}</td>
                <td className="border p-2">{d.org_name}</td>
                <td className="border p-2">
                  {new Date(d.created_at).toLocaleString()}
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
