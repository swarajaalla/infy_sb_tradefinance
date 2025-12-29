// frontend/src/pages/Documents.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [uploadForm, setUploadForm] = useState({
    doc_type: "",
    doc_number: "",
    file: null,
  });
  const [verifyForm, setVerifyForm] = useState({
    file: null,
    hash_code: "",
  });
  const [updateForm, setUpdateForm] = useState({
    document_id: "",
    mode: "overwrite",
    file: null,
  });
  const [searchHash, setSearchHash] = useState("");
  const [hashResult, setHashResult] = useState(null);

  // ---------------- Load Documents ----------------
  const loadDocs = async () => {
    try {
      const res = await api.get("/list_docs");
      setDocs(res.data);
    } catch {
      alert("Failed to load documents");
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  // ---------------- Upload Document ----------------
  const uploadDocument = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("doc_type", uploadForm.doc_type);
    fd.append("doc_number", uploadForm.doc_number);
    fd.append("file", uploadForm.file);

    await api.post("/create_docs", fd);
    alert("Document uploaded successfully ✔");
    loadDocs();
  };

  // ---------------- Verify Document ----------------
  const verifyDocument = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("file", verifyForm.file);
    fd.append("hash_code", verifyForm.hash_code);

    const res = await api.post("/documents/verify", fd);
    alert(res.data.verified ? "Verified ✔" : "Not Verified ❌");
  };

  // ---------------- Search By Hash ----------------
  const getByHash = async () => {
    try {
      const res = await api.get(`/documents/hash/${searchHash}`);
      setHashResult(res.data);
    } catch {
      alert("Document not found");
    }
  };

  // ---------------- Update Document File ----------------
  const updateDocumentFile = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("file", updateForm.file);
    fd.append("mode", updateForm.mode);

    await api.put(`/documents/${updateForm.document_id}/file`, fd);
    alert("Document file updated successfully ✔");
    loadDocs();
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Documents</h1>

      {/* Upload Document */}
      <form onSubmit={uploadDocument} className="bg-white p-5 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <select
            className="border p-2 rounded"
            required
            onChange={(e) => setUploadForm({ ...uploadForm, doc_type: e.target.value })}
          >
            <option value="">Type</option>
            <option value="LOC">LOC</option>
            <option value="INVOICE">INVOICE</option>
            <option value="BILL_OF_LADING">BILL OF LADING</option>
            <option value="PO">PO</option>
            <option value="COO">COO</option>
            <option value="INSURANCE_CERT">INSURANCE CERT</option>
          </select>

          <input
            className="border p-2 rounded"
            placeholder="Document Number"
            required
            onChange={(e) => setUploadForm({ ...uploadForm, doc_number: e.target.value })}
          />

          <input
            type="file"
            className="border p-2 rounded"
            required
            onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
          />
        </div>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Upload
        </button>
      </form>

      {/* Verify Document */}
      <form onSubmit={verifyDocument} className="bg-white p-5 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Verify Document</h2>
        <input
          type="file"
          className="border p-2 rounded w-full mb-2"
          required
          onChange={(e) => setVerifyForm({ ...verifyForm, file: e.target.files[0] })}
        />
        <input
          className="border p-2 rounded w-full mb-2"
          placeholder="Hash Code"
          required
          onChange={(e) => setVerifyForm({ ...verifyForm, hash_code: e.target.value })}
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Verify
        </button>
      </form>

      {/* Update Document File */}
      <form onSubmit={updateDocumentFile} className="bg-white p-5 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Update Document File</h2>
        <select
          className="border p-2 rounded w-full mb-2"
          required
          onChange={(e) => setUpdateForm({ ...updateForm, document_id: e.target.value })}
        >
          <option value="">Select Document</option>
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.doc_type} — {d.doc_number}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded w-full mb-2"
          onChange={(e) => setUpdateForm({ ...updateForm, mode: e.target.value })}
        >
          <option value="overwrite">OverWrite</option>
          <option value="append">Append</option>
        </select>

        <input
          type="file"
          className="border p-2 rounded w-full mb-2"
          required
          onChange={(e) => setUpdateForm({ ...updateForm, file: e.target.files[0] })}
        />

        <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
          Update File
        </button>
      </form>

      {/* Search By Hash */}
      <div className="bg-white p-5 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Find Document by Hash</h2>
        <div className="flex gap-2 mb-2">
          <input
            className="border p-2 rounded flex-1"
            placeholder="Enter hash"
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
          />
          <button
            onClick={getByHash}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Search
          </button>
        </div>
        {hashResult && (
          <div className="mt-2 p-3 bg-gray-100 rounded shadow">
            <b>{hashResult.doc_type}</b> — {hashResult.doc_number}
            <p className="text-sm text-gray-600">Org: {hashResult.org_name}</p>
            <a
              href={hashResult.file_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              View File
            </a>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <h2 className="text-2xl font-semibold mb-4">All Documents</h2>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {docs.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.doc_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.doc_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{d.org_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 underline">
                  <a href={d.file_url} target="_blank" rel="noreferrer">View File</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
