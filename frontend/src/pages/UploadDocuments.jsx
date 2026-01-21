import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import axios from "axios";

export default function UploadDocuments() {
  const { tradeId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("INVOICE");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();

    // 🚨 FASTAPI EXPECTS STRINGS
    formData.append("trade_id", String(tradeId));
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
            // ❌ DO NOT set Content-Type manually
          },
        }
      );

      setMessage("✅ Document uploaded successfully");

      setTimeout(() => {
        navigate(`/trades/${tradeId}`);
      }, 1000);
    } catch (err) {
      console.error("UPLOAD ERROR:", err.response?.data || err);
      setMessage("❌ Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Upload Trade Documents</h1>

      <p className="mb-2 text-sm text-gray-600">
        Trade ID: <b>{tradeId}</b>
      </p>

      {message && <p className="mb-4">{message}</p>}

      <label className="block mb-2 font-medium">Document Type</label>
      <select
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
        className="border p-2 mb-4 w-full rounded"
      >
        <option value="INVOICE">Invoice</option>
        <option value="BILL_OF_LADING">Bill of Lading</option>
        <option value="PO">Purchase Order</option>
        <option value="COO">Certificate of Origin</option>
        <option value="INSURANCE_CERT">Insurance Certificate</option>
      </select>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </Layout>
  );
}
