import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageSection from "../components/ui/PageSection";
import Table, { THead, TBody, TR, TH, TD } from "../components/ui/Table";

const DocumentsList = () => {
  const { user } = useAuth();
  const role = user.role.toLowerCase();
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isCorporate = role === "corporate";
  const canView = ["corporate", "bank", "auditor"].includes(role);

  // ---------------- LOAD DOCUMENTS ----------------
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const res = await api.get("/documents/list");
        setDocs(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    loadDocs();
  }, []);

  // ---------------- UI STATES ----------------
  if (loading) {
    return <p className="text-slate-600">Loading documents...</p>;
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-3 rounded">
        {error}
      </div>
    );
  }

  // ---------------- RENDER ----------------
  return (
    <PageSection>
      <Table>
        <THead>
          <TR>
            <TH>ID</TH>
            <TH>Type</TH>
            <TH>Number</TH>
            <TH>Organisation</TH>
            <TH>Hash</TH>
            <TH>Actions</TH>
          </TR>
        </THead>

        <TBody>
          {docs.length === 0 ? (
            <TR>
              <TD colSpan={6} className="text-center text-slate-500 py-6">
                No documents found
              </TD>
            </TR>
          ) : (
            docs.map((d) => (
              <TR key={d.id}>
                <TD>{d.id}</TD>
                <TD>{d.doc_type}</TD>
                <TD>{d.doc_number}</TD>
                <TD>{d.org_name}</TD>

                {/* HASH */}
                <TD>
                  <div className="max-w-xs break-all text-xs font-mono">
                    {d.hash}
                  </div>
                  <button
                    className="text-indigo-600 text-xs mt-1 hover:underline"
                    onClick={() =>
                      navigator.clipboard.writeText(d.hash)
                    }
                  >
                    Copy
                  </button>
                </TD>

                {/* ACTIONS */}
                <TD className="flex flex-wrap gap-2">
                  {canView && (
                    <Button
                      variant="primary"
                      onClick={() =>
                        navigate(`/documents/view/${d.id}`)
                      }
                    >
                      View
                    </Button>
                  )}

                  {isCorporate && (
                    <Button
                      variant="primary"
                      onClick={() =>
                        navigate(`/documents?edit=${d.id}`)
                      }
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/ledger?document_id=${d.id}`)
                    }
                  >
                    View Ledger
                  </Button>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </PageSection>
  );
};

export default DocumentsList;
