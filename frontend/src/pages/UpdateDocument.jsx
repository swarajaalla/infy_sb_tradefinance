import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function UpdateDocument() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [file, setFile] = useState(null);

  // ✅ LOAD DOCUMENT USING /documents/my
  useEffect(() => {
    const loadDocument = async () => {
      try {
        const res = await api.get("/documents/my");

        const found = res.data.find(
          (d) => Number(d.id) === Number(id)
        );

        if (!found) {
          alert("Document not found or access denied");
          navigate("/documents");
          return;
        }

        setDoc(found);
        setDocType(found.doc_type);
        setDocNumber(found.doc_number);
        setIssuedAt(found.issued_at.slice(0, 16));
      } catch (err) {
        console.error(err.response?.data || err);
        alert("Unable to load document");
        navigate("/documents");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [id, navigate]);

  if (loading) return <p className="p-4">Loading document...</p>;
  if (!doc) return null;

  // ✅ UPDATE HANDLER
  const handleUpdate = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("doc_type", docType);
    formData.append("doc_number", docNumber);
    formData.append("issued_at", issuedAt);

    if (file) {
      formData.append("file", file);
    }

    try {
      await api.put(`/documents/update/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Document updated successfully");
      navigate("/documents");
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm p-8">

        <h2 className="text-2xl font-semibold text-slate-800 mb-1 text-center">
          Update Document
        </h2>
        <p className="text-sm text-slate-500 mb-6 text-center">
          Modify document details
        </p>

        <form onSubmit={handleUpdate} className="space-y-5">

          {/* DOCUMENT TYPE */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="INVOICE">Invoice</option>
              <option value="BL">Bill of Lading</option>
              <option value="LOC">Letter of Credit</option>
            </select>
          </div>

          {/* DOCUMENT NUMBER */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Document Number
            </label>
            <input
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {/* ISSUED DATE */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Issued Date
            </label>
            <input
              type="datetime-local"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {/* FILE */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Replace File (optional)
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/documents")}
              className="px-4 py-2 bg-slate-200 rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-slate-800 text-white rounded"
            >
              Update
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
