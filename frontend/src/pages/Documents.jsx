import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({
    doc_type: "",
    doc_number: "",
    file_url: "",
    hash: "",
    issued_at: "",
  });

  const role = localStorage.getItem("role");

  const loadDocs = () => {
    api.get("/list_docs").then((res) => setDocs(res.data));
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const createDocument = async (e) => {
    e.preventDefault();
    await api.post("/create_docs", form);
    loadDocs();
    alert("Document created ✔");
  };

  return (
    <Layout role={role}>
      <h1 className="text-3xl font-bold mb-4">Documents</h1>

      {/* Form */}
      <form onSubmit={createDocument} className="bg-white shadow p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Create Document</h2>

        <div className="grid grid-cols-2 gap-4">

          <select
            className="p-2 border rounded bg-white"
            onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
            required
            >
            <option value="">Select Document Type</option>
            <option value="LOC">Letter of Credit (LOC)</option>
            <option value="INVOICE">Invoice</option>
            <option value="BILL_OF_LADING">Bill of Lading</option>
            <option value="PO">Purchase Order (PO)</option>
            <option value="COO">Certificate of Origin (COO)</option>
            <option value="INSURANCE_CERT">Insurance Certificate</option>
          </select>


          <input
            type="text"
            placeholder="Document Number"
            className="p-2 border rounded"
            onChange={(e) => setForm({ ...form, doc_number: e.target.value })}
          />

          <input
            type="text"
            placeholder="File URL"
            className="p-2 border rounded"
            onChange={(e) => setForm({ ...form, file_url: e.target.value })}
          />

          <input
            type="text"
            placeholder="Hash"
            className="p-2 border rounded"
            onChange={(e) => setForm({ ...form, hash: e.target.value })}
          />

          <input
            type="datetime-local"
            className="p-2 border rounded"
            onChange={(e) => setForm({ ...form, issued_at: e.target.value })}
          />

        </div>

        <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
          Submit
        </button>
      </form>

      {/* List */}
      <h2 className="text-xl font-bold mb-4">All Documents</h2>

      <div className="grid gap-4">
        {docs.map((d) => (
          <div key={d.id} className="bg-white shadow p-4 rounded-lg">
            <p><b>{d.doc_type}</b> — {d.doc_number}</p>
            <p className="text-gray-600">Org: {d.org_name}</p>
            <a href={d.file_url} className="text-blue-600 underline" target="_blank">
              Open File
            </a>
          </div>
        ))}
      </div>
    </Layout>
  );
}
