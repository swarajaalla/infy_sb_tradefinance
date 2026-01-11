import { useEffect, useState , useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const API_BASE = import.meta.env.VITE_API_URL;
const ViewDocument = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------------- LOAD DOCUMENT ----------------

const hasLoaded = useRef(false);

useEffect(() => {
  if (hasLoaded.current) return;
  hasLoaded.current = true;

  const loadDoc = async () => {
    try {
      const res = await api.get(`/documents/view/${id}`);
      setDoc(res.data);
    } catch {
      setError("Failed to load document or access denied");
    } finally {
      setLoading(false);
    }
  };

  loadDoc();
}, [id]);


  // ---------------- UI STATES ----------------
  if (loading) {
    return <p className="text-slate-600">Loading document...</p>;
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded">
        {error}
      </div>
    );
  }

  // ---------------- RENDER ----------------
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded shadow space-y-3">
        <h1 className="text-2xl font-bold">Document Details</h1>

        <p>
          <b>ID:</b> {doc.id}
        </p>
        <p>
          <b>Type:</b> {doc.doc_type}
        </p>
        <p>
          <b>Number:</b> {doc.doc_number}
        </p>
        <p>
          <b>Organisation:</b> {doc.org_name}
        </p>

<a
  href={`${API_BASE}${doc.file_url}`}
  target="_blank"
  rel="noreferrer"
  className="inline-block text-indigo-600 font-medium underline"
>
  Open Document File
</a>

      </div>

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition"
      >
        ← Back
      </button>
    </div>
  );
};

export default ViewDocument;
