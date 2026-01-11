import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";

import PageSection from "../components/ui/PageSection";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Table, { THead, TBody, TR, TH, TD } from "../components/ui/Table";

const Ledger = () => {
  const { user } = useAuth();
  const toast = useToast();
  const role = user.role.toLowerCase();

  const [searchParams] = useSearchParams();
  const documentId = searchParams.get("document_id");

  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [eventFilter, setEventFilter] = useState("ALL");

  const [manual, setManual] = useState({
    document_id: "",
    event_type: "",
    description: "",
    hash_before: "",
    hash_after: "",
  });

  const loadLedger = async () => {
    try {
      setLoading(true);

      const entriesRes = documentId
        ? await api.get(`/ledger/entries/document/${documentId}`)
        : await api.get("/ledger/entries");

      setEntries(entriesRes.data);

      if (role === "admin" || role === "auditor") {
        const summaryRes = await api.get("/ledger/summary");
        setSummary(summaryRes.data);
      } else {
        setSummary(null);
      }
    } catch {
      toast.error("Failed to load ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [documentId]);

  const createLedgerEntry = async (e) => {
    e.preventDefault();
    try {
      await api.post("/ledger/entries", manual);
      toast.success("Ledger entry created successfully");
      setManual({
        document_id: "",
        event_type: "",
        description: "",
        hash_before: "",
        hash_after: "",
      });
      loadLedger();
    } catch {
      toast.error("Failed to create ledger entry");
    }
  };

  const badge = (type) => {
    switch (type) {
      case "UPLOADED":
        return "bg-green-100 text-green-700";
      case "VERIFIED":
        return "bg-blue-100 text-blue-700";
      case "MODIFIED":
        return "bg-orange-100 text-orange-700";
      case "ACCESSED":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredEntries =
    eventFilter === "ALL"
      ? entries
      : entries.filter((e) => e.event_type === eventFilter);

  if (loading) {
    return <p className="text-slate-600">Loading ledger...</p>;
  }

  return (
    <PageSection>
      {documentId && (
        <p className="text-sm text-slate-500">
          Document ID: {documentId}
        </p>
      )}

      {/* SUMMARY */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-slate-500">Total Entries</p>
            <p className="text-2xl font-bold">{summary.total_entries}</p>
          </Card>

          <Card className="p-4 md:col-span-2">
            <p className="text-sm text-slate-500 mb-2">Events</p>
            {Object.entries(summary.by_event_type).map(([k, v]) => (
              <p key={k} className="text-sm">
                {k}: <b>{v}</b>
              </p>
            ))}
          </Card>
        </div>
      )}

      {/* ADMIN MANUAL ENTRY */}
      {role === "admin" && !documentId && (
        <Card className="p-6 space-y-3">
          <h2 className="font-semibold text-lg">
            Manual Ledger Entry (Admin)
          </h2>

          <input
            className="input"
            placeholder="Document ID"
            value={manual.document_id}
            onChange={(e) =>
              setManual({ ...manual, document_id: e.target.value })
            }
            required
          />

          <input
            className="input"
            placeholder="Event Type"
            value={manual.event_type}
            onChange={(e) =>
              setManual({ ...manual, event_type: e.target.value })
            }
            required
          />

          <input
            className="input"
            placeholder="Description"
            value={manual.description}
            onChange={(e) =>
              setManual({ ...manual, description: e.target.value })
            }
          />

          <Button onClick={createLedgerEntry}>Create Entry</Button>
        </Card>
      )}

      {/* FILTER */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm text-slate-600">Filter by Event:</label>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="input max-w-xs"
        >
          <option value="ALL">All</option>
          <option value="UPLOADED">UPLOADED</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="MODIFIED">MODIFIED</option>
          <option value="ACCESSED">ACCESSED</option>
        </select>
      </div>

      {/* LEDGER TABLE */}
      <Table>
        <THead>
          <TR>
            <TH>ID</TH>
            <TH>Document</TH>
            <TH>Event</TH>
            <TH>Description</TH>
            <TH>Time</TH>
          </TR>
        </THead>

        <TBody>
          {filteredEntries.length === 0 ? (
            <TR>
              <TD colSpan={5} className="text-center text-slate-500 py-6">
                No ledger entries found
              </TD>
            </TR>
          ) : (
            filteredEntries.map((e) => (
              <TR key={e.id}>
                <TD>{e.id}</TD>
                <TD>{e.document_id}</TD>
                <TD>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${badge(
                      e.event_type
                    )}`}
                  >
                    {e.event_type}
                  </span>
                </TD>
                <TD>{e.description || "-"}</TD>
                <TD>{new Date(e.timestamp).toLocaleString()}</TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </PageSection>
  );
};

export default Ledger;
