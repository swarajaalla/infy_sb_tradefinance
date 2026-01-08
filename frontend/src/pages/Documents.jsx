// frontend/src/pages/Documents.jsx - UPDATED
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    doc_type: "INVOICE",
    doc_number: "",
    trade_id: "",
    issued_at: "",
    file: null,
  });

  // Verify form
  const [verifyForm, setVerifyForm] = useState({ hash_code: "", file: null });
  const [verifyResult, setVerifyResult] = useState(null);

  // Update form
  const [updateForm, setUpdateForm] = useState({
    document_id: "",
    mode: "overwrite",
    file: null,
  });

  // Tabs
  const tabs = ["list", "upload", "verify", "update"];

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  // Handle upload - FIXED VERSION
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    
    // Append all required fields
    formData.append("doc_type", uploadForm.doc_type);
    formData.append("doc_number", uploadForm.doc_number);
    formData.append("file", uploadForm.file);
    
    // Append optional fields only if they have values
    if (uploadForm.trade_id && uploadForm.trade_id.trim()) {
      formData.append("trade_id", uploadForm.trade_id);
    }
    
    if (uploadForm.issued_at && uploadForm.issued_at.trim()) {
      formData.append("issued_at", uploadForm.issued_at);
    }

    console.log("Uploading document:", {
      doc_type: uploadForm.doc_type,
      doc_number: uploadForm.doc_number,
      trade_id: uploadForm.trade_id,
      issued_at: uploadForm.issued_at,
      file_name: uploadForm.file?.name
    });

    try {
      const response = await api.post("/documents", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      console.log("Upload response:", response.data);
      
      alert(`✓ Document uploaded successfully!\nDocument ID: ${response.data.document_id}\nHash: ${response.data.hash}`);
      
      // Reset form
      setUploadForm({ 
        doc_type: "INVOICE", 
        doc_number: "", 
        trade_id: "", 
        issued_at: "", 
        file: null 
      });
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      
      fetchDocuments();
      setActiveTab("list");
    } catch (err) {
      console.error("Upload error details:", err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          "Upload failed";
      alert(`Upload failed: ${errorMessage}`);
    }
  };

  // Handle verify
  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!verifyForm.file) {
      alert("Please select a file to verify");
      return;
    }

    if (!verifyForm.hash_code.trim()) {
      alert("Please enter a hash code");
      return;
    }

    const formData = new FormData();
    formData.append("hash_code", verifyForm.hash_code);
    formData.append("file", verifyForm.file);

    try {
      const res = await api.post("/documents/verify", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      setVerifyResult(res.data);
    } catch (err) {
      console.error("Verification error:", err);
      alert(err.response?.data?.detail || "Verification failed");
    }
  };

  // Handle update file
  const handleUpdateFile = async (e) => {
    e.preventDefault();
    
    if (!updateForm.document_id) {
      alert("Please enter a document ID");
      return;
    }
    
    if (!updateForm.file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("mode", updateForm.mode);
    formData.append("file", updateForm.file);

    try {
      await api.put(`/documents/${updateForm.document_id}/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      alert("✓ Document updated successfully");
      
      // Reset form
      setUpdateForm({ document_id: "", mode: "overwrite", file: null });
      
      // Clear file input
      const fileInput = document.querySelectorAll('input[type="file"]')[1];
      if (fileInput) fileInput.value = "";
      
      fetchDocuments();
      setActiveTab("list");
    } catch (err) {
      console.error("Update error:", err);
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize ${
                activeTab === tab 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      {activeTab === "list" && (
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">All Documents ({documents.length})</h2>
              <button
                onClick={fetchDocuments}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-3">No documents found</p>
              <button
                onClick={() => setActiveTab("upload")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload Your First Document
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">ID</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Type</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Number</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Trade</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Organization</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Created</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono text-sm">#{doc.id}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {doc.doc_type}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{doc.doc_number}</td>
                      <td className="p-4">
                        {doc.trade_id ? (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            Trade #{doc.trade_id}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">{doc.org_name || "-"}</td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
                          >
                            View
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(doc.hash);
                              alert("Hash copied to clipboard!");
                            }}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm"
                            title="Copy hash"
                          >
                            Copy Hash
                          </button>
                          <button
                            onClick={() => {
                              setVerifyForm({ ...verifyForm, hash_code: doc.hash });
                              setActiveTab("verify");
                            }}
                            className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => {
                              setUpdateForm({ 
                                document_id: doc.id, 
                                mode: "overwrite", 
                                file: null 
                              });
                              setActiveTab("update");
                            }}
                            className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-sm"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Upload Form */}
      {activeTab === "upload" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Upload New Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type *
                  </label>
                  <select
                    value={uploadForm.doc_type}
                    onChange={e => setUploadForm({...uploadForm, doc_type: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="INVOICE">Invoice (INVOICE)</option>
                    <option value="LC">Letter of Credit (LC)</option>
                    <option value="BL">Bill of Lading (BL)</option>
                    <option value="CO">Certificate of Origin (CO)</option>
                    <option value="INSURANCE_CERT">Insurance Certificate</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Backend accepts: INVOICE, LC, BL, CO, INSURANCE_CERT
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Number *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.doc_number}
                    onChange={e => setUploadForm({...uploadForm, doc_number: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., INV-2023-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trade ID (Optional)
                  </label>
                  <input
                    type="number"
                    value={uploadForm.trade_id}
                    onChange={e => setUploadForm({...uploadForm, trade_id: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter trade ID"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Link document to a specific trade
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issued Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={uploadForm.issued_at}
                    onChange={e => setUploadForm({...uploadForm, issued_at: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File *
                  </label>
                  <input
                    type="file"
                    onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})}
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Select any file (PDF, image, text, etc.)
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Upload Document
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="px-6 py-3 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Form */}
      {activeTab === "verify" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Verify Document Integrity</h2>
              <button
                onClick={() => setActiveTab("list")}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to List
              </button>
            </div>
            
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Hash (SHA-256)
                </label>
                <input
                  type="text"
                  value={verifyForm.hash_code}
                  onChange={e => setVerifyForm({...verifyForm, hash_code: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter 64-character SHA-256 hash"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can copy hash from document list
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document File *
                </label>
                <input
                  type="file"
                  onChange={e => setVerifyForm({...verifyForm, file: e.target.files[0]})}
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select the file you want to verify against the hash
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
                >
                  Verify Document
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setVerifyForm({ hash_code: "", file: null }); 
                    setVerifyResult(null); 
                  }}
                  className="px-6 py-3 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg"
                >
                  Clear
                </button>
              </div>
            </form>

            {verifyResult && (
              <div className={`mt-8 p-6 rounded-lg ${verifyResult.verified 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-4 h-4 rounded-full ${verifyResult.verified ? 'bg-green-500' : 'bg-red-500'}`} />
                  <h3 className="font-semibold text-lg">
                    {verifyResult.verified ? '✓ Document Verified Successfully' : '✗ Verification Failed'}
                  </h3>
                </div>
                {verifyResult.verified ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="font-medium">Document ID:</span>
                        <div className="font-mono mt-1 bg-white p-2 rounded border">#{verifyResult.document_id}</div>
                      </div>
                      <div>
                        <span className="font-medium">Type:</span>
                        <div className="mt-1 bg-white p-2 rounded border">{verifyResult.doc_type}</div>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Document Number:</span>
                      <div className="font-mono mt-1 bg-white p-2 rounded border">{verifyResult.doc_number}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p className="font-medium">Error:</p>
                    <p className="mt-1 bg-white p-3 rounded border">{verifyResult.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update File Form */}
      {activeTab === "update" && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Update Document File</h2>
              <button
                onClick={() => setActiveTab("list")}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to List
              </button>
            </div>
            
            <form onSubmit={handleUpdateFile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document ID *
                </label>
                <input
                  type="number"
                  value={updateForm.document_id}
                  onChange={e => setUpdateForm({...updateForm, document_id: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter document ID from the list"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find the ID in the documents list
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Mode
                </label>
                <select
                  value={updateForm.mode}
                  onChange={e => setUpdateForm({...updateForm, mode: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="overwrite">Overwrite File</option>
                  <option value="append">Append to File</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  "Append" adds new content to existing file
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New File *
                </label>
                <input
                  type="file"
                  onChange={e => setUpdateForm({...updateForm, file: e.target.files[0]})}
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg"
                >
                  Update File
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setUpdateForm({ document_id: "", mode: "overwrite", file: null }); 
                  }}
                  className="px-6 py-3 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}