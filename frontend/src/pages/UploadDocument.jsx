import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function UploadDocument() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 If redirected from trade
  const preselectedTradeId = location.state?.tradeId || "";

  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Trade linking
  const [trades, setTrades] = useState([]);
  const [linkedTradeId, setLinkedTradeId] = useState(preselectedTradeId);

  // 🔹 Load seller-confirmed trades
  useEffect(() => {
    const loadTrades = async () => {
      try {
        const res = await api.get("/trades");
        setTrades(res.data.filter(t => t.status === "SELLER_CONFIRMED"));
      } catch (err) {
        console.error(err);
      }
    };
    loadTrades();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!docType || !docNumber || !issuedAt || !file) {
      alert("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append("doc_type", docType);
    formData.append("doc_number", docNumber);
    formData.append("issued_at", issuedAt);
    formData.append("file", file);

    // 🔹 Optional trade link
    if (linkedTradeId) {
      formData.append("trade_id", linkedTradeId);
    }

    try {
      setLoading(true);

      await api.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Document uploaded successfully");
      navigate("/dashboard");

    } catch (err) {
      console.error(err.response?.data || err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm p-8">

        {/* TITLE */}
        <h2 className="text-2xl font-semibold text-slate-800 mb-1 text-center">
          Upload Document
        </h2>
        <p className="text-sm text-slate-500 mb-6 text-center">
          Add a new trade document
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* DOCUMENT TYPE */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select type</option>
              <option value="INVOICE">Invoice</option>
              <option value="BL">Bill of Lading</option>
              <option value="LOC">Letter of Credit</option>
            </select>
          </div>

          {/* DOCUMENT NUMBER */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Document Number
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {/* ISSUED DATE */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Issued Date
            </label>
            <input
              type="datetime-local"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {/* LINK TO TRADE */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Link to Trade (Optional)
            </label>
            <select
              value={linkedTradeId}
              onChange={(e) => setLinkedTradeId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">No trade (standalone)</option>
              {trades.map((trade) => (
                <option key={trade.id} value={trade.id}>
                  TRD-{trade.id} — {trade.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Linking a trade updates its status to DOCUMENTS_UPLOADED
            </p>
          </div>

          {/* FILE */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Upload File
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-md text-sm bg-slate-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md text-sm bg-slate-800 text-white"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
