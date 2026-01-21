import { useEffect, useState } from "react";
import api from "../api/axios";
import { useSearchParams } from "react-router-dom";

export default function DocumentUpload({ editMode = false, document = null }) {
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [file, setFile] = useState(null);

  // ✅ READ trade_id from URL
  const [searchParams] = useSearchParams();
  const tradeId = searchParams.get("trade_id");

  // 🔹 Prefill form when editing
  useEffect(() => {
    if (editMode && document) {
      setDocType(document.doc_type);
      setDocNumber(document.doc_number);
    }
  }, [editMode, document]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tradeId) {
      alert("❌ Trade ID missing");
      return;
    }

    if (!file && !editMode) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("trade_id", tradeId); // ✅ REQUIRED
    formData.append("doc_type", docType);
    formData.append("doc_number", docNumber);

    if (file) {
      formData.append("file", file);
    }

    try {
      if (editMode) {
        // 🔁 UPDATE DOCUMENT
        await api.put(
          `/documents/${document.id}/update`,
          formData
        );
        alert("✅ Document updated successfully");
      } else {
        // ➕ UPLOAD DOCUMENT
        await api.post("/documents/upload", formData);
        alert("✅ Document uploaded successfully");
      }

      window.location.reload();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("❌ Operation failed (check console)");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* DOCUMENT TYPE */}
      <select
        className="w-full border p-2 rounded"
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
        required
      >
        <option value="">Select Document Type</option>
        <option value="INVOICE">Invoice</option>
        <option value="LC">Letter of Credit</option>
        <option value="BL">Bill of Lading</option>
      </select>

      {/* DOCUMENT NUMBER */}
      <input
        type="text"
        placeholder="Document Number"
        className="w-full border p-2 rounded"
        value={docNumber}
        onChange={(e) => setDocNumber(e.target.value)}
        required
      />

      {/* FILE */}
      <input
        type="file"
        className="w-full border p-2 rounded"
        onChange={(e) => setFile(e.target.files[0])}
      />

      {/* SUBMIT */}
      <button
        type="submit"
        className={`px-4 py-2 rounded text-white ${
          editMode ? "bg-orange-600" : "bg-blue-600"
        }`}
      >
        {editMode ? "Update Document" : "Upload Document"}
      </button>
    </form>
  );
}
