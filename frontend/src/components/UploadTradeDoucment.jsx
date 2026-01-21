import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function UploadTradeDocument() {
  const { tradeId } = useParams();
  const navigate = useNavigate();

  const [docType, setDocType] = useState("INVOICE"); // ✅ DEFAULT VALUE
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!tradeId) {
      alert("Trade ID missing");
      return;
    }

    if (!docType) {
      alert("Please select document type");
      return;
    }

    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("trade_id", Number(tradeId)); // ✅ force int
    formData.append("doc_type", docType);
    formData.append("file", file);

    try {
      setLoading(true);

      await axios.post(
        "http://127.0.0.1:8000/documents/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      alert("✅ Document uploaded successfully");
      navigate(`/trades/${tradeId}`);
    } catch (err) {
      console.error("UPLOAD ERROR:", err.response?.data || err);
      alert("❌ Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded shadow p-6 max-w-xl">
      <h2 className="text-lg font-semibold mb-2">
        Upload Trade Document
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Trade ID: <b>{tradeId}</b>
      </p>

      {/* DOCUMENT TYPE */}
      <label className="block mb-2 text-sm font-medium">
        Document Type
      </label>
      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
        className="border p-2 w-full mb-4 rounded"
      >
        <option value="INVOICE">Invoice</option>
        <option value="BILL_OF_LADING">Bill of Lading</option>
        <option value="PO">Purchase Order</option>
        <option value="COO">Certificate of Origin</option>
        <option value="INSURANCE_CERT">Insurance Certificate</option>
      </select>

      {/* FILE */}
      <label className="block mb-2 text-sm font-medium">
        Upload File
      </label>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        {loading ? "Uploading..." : "Upload Document"}
      </button>
    </div>
  );
}
