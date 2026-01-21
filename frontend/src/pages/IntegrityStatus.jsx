import { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

import PageSection from "../components/ui/PageSection";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Table, { THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { useAuth } from "../auth/AuthContext";

const STATUS_BADGE = {
  PASSED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
};

const FILTERS = ["ALL", "PASSED", "FAILED", "PENDING"];

const IntegrityStatus = () => {
  const toast = useToast();
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();

  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const [filter, setFilter] = useState("ALL");

  const loadAll = async () => {
    try {
      setLoading(true);
      const [s, c, a] = await Promise.all([
        api.get("/integrity/summary"),
        api.get("/integrity/checks?limit=100"),
        api.get("/integrity/alerts"),
      ]);

      setSummary(s.data);
      setChecks(c.data);
      setAlerts(a.data);
    } catch {
      toast.error("Failed to load integrity data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (["auditor", "admin"].includes(role)) {
    loadAll();
  }
}, [role]);


  const runIntegrity = async () => {
    try {
      setRunning(true);
      const res = await api.post("/integrity/run", {
        document_ids: null,
      });

      toast.success(
        `Integrity run completed: ${res.data.failed} failed`
      );
      loadAll();
    } catch {
      toast.error("Integrity check failed");
    } finally {
      setRunning(false);
    }
  };

  const acknowledge = async (id) => {
    try {
      await api.post(`/integrity/alerts/${id}/acknowledge`);
      toast.success("Alert acknowledged");
      loadAll();
    } catch {
      toast.error("Failed to acknowledge alert");
    }
  };

  const filtered =
    filter === "ALL"
      ? checks
      : checks.filter((c) => c.status === filter);
 
  if (["corporate", "bank"].includes(role)) {
  return (
    <PageSection>
      <Card className="p-12 max-w-3xl bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl">
        <h2 className="text-2xl font-semibold text-slate-900">
          System Integrity Oversight
        </h2>

        <p className="mt-4 text-slate-600 leading-relaxed">
          Integrity monitoring ensures that all documents recorded on the
          platform remain cryptographically consistent with their original
          blockchain entries. These controls are part of the platform’s
          compliance and audit framework.
        </p>

        <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-sm font-medium text-slate-800">
            Your current role: <span className="capitalize">{role}</span>
          </p>

          <ul className="mt-3 text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Verify document authenticity using hash comparison</li>
            <li>Review ledger history for your uploaded documents</li>
            <li>Detect tampering at the document level</li>
          </ul>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          System-wide integrity audits and remediation workflows are restricted
          to Auditors and Administrators in accordance with compliance policy.
        </p>
      </Card>
    </PageSection>
  );
}


  if (loading) {
    return <p className="text-slate-600">Loading integrity dashboard...</p>;
  }

  return (
    <PageSection>
      {/* SUMMARY */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="p-5">
            <p className="text-sm text-slate-500">Total Checks</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Passed</p>
            <p className="text-2xl font-bold text-green-600">
              {summary.passed}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {summary.failed}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {summary.pending}
            </p>
          </Card>
        </div>
      )}

      {/* ACTION BAR */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm border ${
                filter === f
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <Button onClick={runIntegrity} disabled={running}>
          {running ? "Running..." : "Run Integrity Check"}
        </Button>
      </div>

      {/* ALERTS */}
      {alerts.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50">
          <h2 className="font-semibold text-red-700 mb-3">
            Active Alerts
          </h2>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <div className="text-sm">
                  Document #{a.document_id} – {a.message}
                </div>
                <Button
                  variant="outline"
                  onClick={() => acknowledge(a.id)}
                >
                  Acknowledge
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TABLE */}
      <Table>
        <THead>
          <TR>
            <TH>ID</TH>
            <TH>Document</TH>
            <TH>Type</TH>
            <TH>Status</TH>
            <TH>Stored Hash</TH>
            <TH>Computed Hash</TH>
            <TH>Timestamp</TH>
          </TR>
        </THead>

        <TBody>
          {filtered.length === 0 ? (
            <TR>
              <TD colSpan={7} className="text-center text-slate-500 py-6">
                No records
              </TD>
            </TR>
          ) : (
            filtered.map((c) => (
              <TR key={c.id}>
                <TD>{c.id}</TD>
                <TD>{c.document_id}</TD>
                <TD>{c.check_type}</TD>
                <TD>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      STATUS_BADGE[c.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </TD>
                <TD className="max-w-xs break-all text-xs font-mono">
                  {c.stored_hash || "—"}
                </TD>
                <TD className="max-w-xs break-all text-xs font-mono">
                  {c.computed_hash || "—"}
                </TD>
                <TD>
                  {new Date(c.created_at).toLocaleString()}
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </PageSection>
  );
};

export default IntegrityStatus;
