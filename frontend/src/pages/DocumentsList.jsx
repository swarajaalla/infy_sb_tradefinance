import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function DocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
  try {
    const me = await api.get("/users/me");
    setUser(me.data);

    let docs;
    if (me.data.role === "CORPORATE") {
      docs = await api.get("/documents/my");
    } else {
      docs = await api.get("/documents/list");
    }

    setDocuments(docs.data);
  } catch (err) {
    console.error(err.response?.data || err);
    navigate("/login");
  } finally {
    setLoading(false);
  }
};


    fetchData();
  }, [navigate]);

  const verifyHash = async (docId) => {
    try {
      await api.post(`/documents/verify-hash/${docId}`);
      alert("Hash verified successfully");
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Hash verification failed");
    }
  };

  // ✅ VIEW FILE (opens in new tab)
const viewFile = (docId) => {
  const token = localStorage.getItem("token");

  window.open(
    `http://127.0.0.1:8000/api/documents/view/${docId}?token=${token}`,
    "_blank"
  );
};


  if (loading) return <p className="p-4">Loading documents...</p>;

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">
            Documents
          </h2>

          {/* <button
            onClick={() => navigate("/dashboard")}
            className="bg-slate-200 hover:bg-slate-300
                       text-slate-800 px-4 py-2 rounded-md
                       text-sm transition"
          >
            Back to Dashboard
          </button> */}
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">
              No documents found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">

                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Number</th>
                    <th className="px-4 py-2 text-left">Issued At</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-t hover:bg-slate-50 transition"
                    >
                      <td className="px-4 py-2">{doc.id}</td>
                      <td className="px-4 py-2">{doc.doc_type}</td>
                      <td className="px-4 py-2">{doc.doc_number}</td>
                      <td className="px-4 py-2">
                        {new Date(doc.issued_at).toLocaleString()}
                      </td>

                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">

                          {/* VIEW FILE */}
                          <button
                            onClick={() => viewFile(doc.id)}
                            className="bg-emerald-600 hover:bg-emerald-700
                                       text-white px-3 py-1.5
                                       rounded-md text-xs transition"
                          >
                            View
                          </button>

                          {/* LEDGER */}
                          {(user.role === "BANK" ||
                            user.role === "AUDITOR" ||
                            user.role === "ADMIN") && (
                            <button
                              onClick={() => navigate(`/ledger/${doc.id}`)}
                              className="bg-slate-700 hover:bg-slate-800
                                         text-white px-3 py-1.5
                                         rounded-md text-xs transition"
                            >
                              Ledger
                            </button>
                          )}

                          {/* VERIFY HASH */}
                          {(user.role === "BANK" || user.role === "AUDITOR") && (
                            <button
                              onClick={() => verifyHash(doc.id)}
                              className="bg-amber-600 hover:bg-amber-700
                                         text-white px-3 py-1.5
                                         rounded-md text-xs transition"
                            >
                              Verify Hash
                            </button>
                          )}

                          {/* UPDATE */}
                          {user.role === "CORPORATE" && (
                            <button
                              onClick={() =>
                                navigate(`/documents/update/${doc.id}`)
                              }
                              className="bg-indigo-600 hover:bg-indigo-700
                                         text-white px-3 py-1.5
                                         rounded-md text-xs transition"
                            >
                              Update
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
