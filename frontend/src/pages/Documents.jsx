import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

const Documents = () => {
  const { user } = useAuth();
  const toast = useToast();
  const role = user.role.toLowerCase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tradeId = searchParams.get("trade_id");
  const editId = searchParams.get("edit");

  const isCorporate = role === "corporate";
  const isBank = role === "bank";
  const isAdmin = role === "admin";

  const [mode, setMode] = useState(editId ? "edit" : "menu");

  const [uploadForm, setUploadForm] = useState({
    doc_type: "",
    doc_number: "",
    issued_at: "",
    file: null,
  });

  const [editForm, setEditForm] = useState({
    doc_type: "",
    doc_number: "",
    file: null,
  });

  const [verifyHash, setVerifyHash] = useState("");
  const [verifyFile, setVerifyFile] = useState(null);

  useEffect(() => {
    if (!editId) return;

    const loadDoc = async () => {
      try {
        const res = await api.get(`/documents/view/${editId}`);
        setEditForm({
          doc_type: res.data.doc_type,
          doc_number: res.data.doc_number,
          file: null,
        });
      } catch {
        toast.error("Failed to load document");
      }
    };

    loadDoc();
  }, [editId, toast]);

  const handleUpload = async (e) => {
  e.preventDefault();

  if (!tradeId) {
    toast.error("No trade selected for this document");
    return;
  }

  const fd = new FormData();
  fd.append("trade_id", tradeId);
  Object.entries(uploadForm).forEach(([k, v]) => fd.append(k, v));

  try {
    // 1. Upload document
    await api.post("/documents/upload", fd);

    // 2. Mark trade as DOCUMENTS_UPLOADED
    await api.patch(`/trades/${tradeId}/status`, {
      status: "DOCUMENTS_UPLOADED",
      remarks: "Documents uploaded by seller",
    });

    toast.success("Documents uploaded and trade updated");

    // 3. Redirect back to trades
    navigate("/trades");
  } catch (err) {
    toast.error(err.response?.data?.detail || "Document upload failed");
  }
};


  const handleUpdate = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("doc_type", editForm.doc_type);
    fd.append("doc_number", editForm.doc_number);
    fd.append("file", editForm.file);

    try {
      await api.put(`/documents/update/${editId}`, fd);
      toast.success("Document updated successfully");
      navigate("/documents/list");
    } catch {
      toast.error("Document update failed");
    }
  };

  const handleVerify = async () => {
    const fd = new FormData();
    fd.append("hash_code", verifyHash);
    fd.append("file", verifyFile);

    try {
      const res = await api.post("/documents/verify-hash", fd);

      if (res.data.verified) {
        toast.success("Document hash verified successfully");
      } else {
        toast.error(res.data.reason || "Verification failed");
      }

      setMode("menu");
    } catch {
      toast.error("Verification failed");
    }
  };

  if (isAdmin) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-bold">Documents</h1>
        <p className="text-slate-600 mt-2">
          Admin users do not manage documents directly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {mode === "menu" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <button
            onClick={() => navigate("/documents/list")}
            className="bg-white border rounded-xl p-6 hover:shadow-lg transition"
          >
            📄 View Documents
          </button>

          {isCorporate && (
            <button
              onClick={() => setMode("upload")}
              className="bg-white border rounded-xl p-6 hover:shadow-lg transition"
            >
              ⬆ Upload Document
            </button>
          )}

          {(isCorporate || isBank) && (
            <button
              onClick={() => setMode("verify")}
              className="bg-white border rounded-xl p-6 hover:shadow-lg transition"
            >
              🔐 Verify Hash
            </button>
          )}
        </div>
      )}

      {mode === "upload" && isCorporate && (
        <form
          onSubmit={handleUpload}
          className="bg-white p-6 rounded-xl shadow space-y-4 max-w-xl"
        >
          <h2 className="font-semibold text-lg">Upload Document</h2>

          <input
            className="input"
            placeholder="Document Number"
            onChange={(e) =>
              setUploadForm({ ...uploadForm, doc_number: e.target.value })
            }
            required
          />

          <select
            className="input"
            onChange={(e) =>
              setUploadForm({ ...uploadForm, doc_type: e.target.value })
            }
            required
          >
            <option value="">Type</option>
            <option value="PO">Purchase Order</option>
            <option value="INVOICE">Invoice</option>
            <option value="BL">Bill of Lading</option>
            <option value="LOC">Letter of Credit</option>
          </select>

          <input
            type="date"
            className="input"
            onChange={(e) =>
              setUploadForm({ ...uploadForm, issued_at: e.target.value })
            }
            required
          />

          <input
            type="file"
            className="input"
            onChange={(e) =>
              setUploadForm({ ...uploadForm, file: e.target.files[0] })
            }
            required
          />

          <div className="flex gap-3 pt-2">
            <button className="btn btn-primary">Upload</button>
            <button
              type="button"
              onClick={() => setMode("menu")}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "verify" && (
        <div className="bg-white p-6 rounded-xl shadow space-y-4 max-w-xl">
          <h2 className="font-semibold text-lg">Verify Document Hash</h2>

          <input
            className="input"
            placeholder="Hash value"
            value={verifyHash}
            onChange={(e) => setVerifyHash(e.target.value)}
          />

          <input
            type="file"
            className="input"
            onChange={(e) => setVerifyFile(e.target.files[0])}
          />

          <div className="flex gap-3 pt-2">
            <button onClick={handleVerify} className="btn btn-primary">
              Verify
            </button>
            <button
              onClick={() => setMode("menu")}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "edit" && isCorporate && (
        <form
          onSubmit={handleUpdate}
          className="bg-white p-6 rounded-xl shadow space-y-4 max-w-xl"
        >
          <h2 className="font-semibold text-lg">
            Update Document (ID: {editId})
          </h2>

          <input
            className="input"
            value={editForm.doc_number}
            onChange={(e) =>
              setEditForm({ ...editForm, doc_number: e.target.value })
            }
            required
          />

          <select
            className="input"
            value={editForm.doc_type}
            onChange={(e) =>
              setEditForm({ ...editForm, doc_type: e.target.value })
            }
            required
          >
            <option value="INVOICE">Invoice</option>
            <option value="BL">Bill of Lading</option>
            <option value="LOC">Letter of Credit</option>
          </select>

          <input
            type="file"
            className="input"
            onChange={(e) =>
              setEditForm({ ...editForm, file: e.target.files[0] })
            }
            required
          />

          <div className="flex gap-3 pt-2">
            <button className="btn btn-primary">Update</button>
            <button
              type="button"
              onClick={() => navigate("/documents/list")}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Documents;
