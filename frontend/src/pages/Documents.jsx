import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";

const Documents = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    doc_type: "",
    doc_number: "",
    issued_at: "",
    file: null,
  });

  const [verifyHash, setVerifyHash] = useState("");
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  const role = user?.role?.toLowerCase();
  const isCorporate = role === "corporate";
  const isAuditor = role === "auditor";
  const isAdmin = role === "admin";

  // ---------------- Load Docs ----------------
  const loadDocuments = async () => {
    try {
      const res = await api.get("/documents/list");
      setDocs(res.data);
    } catch (err) {
      console.error("Failed to load documents", err);
    }
  };

  useEffect(() => {
    if (!isAdmin) loadDocuments();
  }, [isAdmin]);

  // ---------------- Upload / Update ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.file) {
      return alert("❗ Please re-select the file to update/upload");
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("doc_type", form.doc_type);
      data.append("doc_number", form.doc_number);
      data.append("file", form.file);

      if (editingId) {
        await api.put(`/documents/update/${editingId}`, data);
        alert("✅ Document updated successfully");
      } else {
        data.append("issued_at", form.issued_at);
        await api.post("/documents/upload", data);
        alert("✅ Document uploaded successfully");
      }

      setForm({
        doc_type: "",
        doc_number: "",
        issued_at: "",
        file: null,
      });
      setEditingId(null);
      loadDocuments();
    } catch (err) {
      console.error("Operation failed:", err.response?.data || err.message);
      alert("❌ Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Verify Hash (Auditor) ----------------
  const handleVerify = async () => {
    if (!verifyHash || !verifyFile)
      return alert("Enter hash and choose file");

    try {
      const data = new FormData();
      data.append("hash_code", verifyHash);
      data.append("file", verifyFile);

      const res = await api.post("/documents/verify-hash", data);
      setVerifyResult(res.data);
    } catch {
      alert("❌ Verification failed");
    }
  };

  if (isAdmin) {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Admins are not allowed to access documents.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Documents</h1>

      {/* ---------------- Upload / Update Form ---------------- */}
      {isCorporate && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded shadow space-y-4"
        >
          <h2 className="text-lg font-semibold">
            {editingId ? "Update Document" : "Upload Document"}
          </h2>

          <select
            className="border p-2 w-full"
            value={form.doc_type}
            onChange={(e) =>
              setForm({ ...form, doc_type: e.target.value })
            }
            required
          >
            <option value="">Select Document Type</option>
            <option value="INVOICE">Invoice</option>
            <option value="BL">Bill of Lading</option>
            <option value="PO">Purchase Order</option>
            <option value="LOC">Letter of Credit</option>
          </select>

          <input
            className="border p-2 w-full"
            placeholder="Document Number"
            value={form.doc_number}
            onChange={(e) =>
              setForm({ ...form, doc_number: e.target.value })
            }
            required
          />

          {!editingId && (
            <input
              type="date"
              className="border p-2 w-full"
              value={form.issued_at}
              onChange={(e) =>
                setForm({ ...form, issued_at: e.target.value })
              }
              required
            />
          )}

          {/* ✅ File input with key fix */}
          <input
            key={editingId || "new"}
            type="file"
            className="border p-2 w-full"
            onChange={(e) => {
              const file = e.target.files[0];
              setForm((prev) => ({ ...prev, file }));
            }}
            required
          />

          <div className="flex gap-2">
            <button
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {loading
                ? editingId
                  ? "Updating..."
                  : "Uploading..."
                : editingId
                ? "Update"
                : "Upload"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    doc_type: "",
                    doc_number: "",
                    issued_at: "",
                    file: null,
                  });
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* ---------------- Verify (Auditor) ---------------- */}
      {isAuditor && (
        <div className="bg-white p-4 rounded shadow space-y-3">
          <h2 className="text-lg font-semibold">Verify Document Hash</h2>

          <input
            className="border p-2 w-full"
            placeholder="Enter hash"
            value={verifyHash}
            onChange={(e) => setVerifyHash(e.target.value)}
          />

          <input
            type="file"
            className="border p-2 w-full"
            onChange={(e) => setVerifyFile(e.target.files[0])}
          />

          <button
            onClick={handleVerify}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Verify
          </button>

          {verifyResult && (
            <div
              className={`p-3 rounded text-white ${
                verifyResult.matched ? "bg-green-600" : "bg-red-600"
              }`}
            >
              <p className="font-semibold">{verifyResult.message}</p>
              {verifyResult.matched && (
                <p>
                  ✅ Document ID: <b>{verifyResult.document_id}</b>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------- List ---------------- */}
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
              {isCorporate && <th className="border p-2">Action</th>}
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
                <td className="border p-2 truncate max-w-xs">{d.hash}</td>

                {isCorporate && (
                  <td className="border p-2">
                    <button
                      onClick={() => {
                        setEditingId(d.id);
                        setForm({
                          doc_type: d.doc_type,
                          doc_number: d.doc_number,
                          issued_at: d.issued_at.split("T")[0],
                          file: null,
                        });
                      }}
                      className="text-blue-600 underline"
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Documents;
