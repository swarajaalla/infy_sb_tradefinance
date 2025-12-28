import { useState } from "react";
import api from "../api/axios";

export default function DocumentUpload() {
  const [docType, setDocType] = useState("INVOICE");
  const [docNumber, setDocNumber] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!file) {
      setError("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("doc_type", docType);
    formData.append("doc_number", docNumber);
    formData.append("file", file);

    try {
      const res = await api.post("/documents/upload", formData);

      setMessage("Document uploaded successfully");
      setDocNumber("");
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          Upload Document
        </h2>

        {message && <p className="text-green-600 mb-3">{message}</p>}
        {error && <p className="text-red-600 mb-3">{error}</p>}

        <select
          className="w-full mb-3 p-2 border rounded"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        >
          <option value="LOC">LOC</option>
          <option value="INVOICE">INVOICE</option>
          <option value="BILL_OF_LADING">BILL_OF_LADING</option>
          <option value="PO">PO</option>
          <option value="COO">COO</option>
          <option value="INSURANCE_CERT">INSURANCE_CERT</option>
        </select>

        <input
          type="text"
          placeholder="Document Number"
          className="w-full mb-3 p-2 border rounded"
          value={docNumber}
          onChange={(e) => setDocNumber(e.target.value)}
          required
        />

        <input
          type="file"
          className="w-full mb-3"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Upload
        </button>
      </form>
    </div>
  );
}
