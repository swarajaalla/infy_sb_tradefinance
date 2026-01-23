import { useState } from "react";
import api from "../../api/axios";
import Card from "../ui/Card";
import Button from "../ui/Button";

const badge = (level) => {
  if (level === "HIGH") return "bg-red-100 text-red-700";
  if (level === "MEDIUM") return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
};

const tone = (level) => {
  if (level === "HIGH") return "bg-red-500";
  if (level === "MEDIUM") return "bg-yellow-500";
  return "bg-green-500";
};

const RiskView = ({ myRisk, allRisks, isPrivileged, onRefresh }) => {
  const [filter, setFilter] = useState("ALL");
  const [runningId, setRunningId] = useState(null);
  const [runningAll, setRunningAll] = useState(false);

  const filtered =
    filter === "ALL"
      ? allRisks
      : allRisks.filter((u) => u.level === filter);

  const recomputeUser = async (id) => {
    setRunningId(id);
    await api.post(`/risk/recompute/${id}`);
    await onRefresh();
    setRunningId(null);
  };

  const recomputeAll = async () => {
    setRunningAll(true);
    for (const u of allRisks) {
      await api.post(`/risk/recompute/${u.user_id}`);
    }
    await onRefresh();
    setRunningAll(false);
  };

  const downloadUserPdf = async (userId, name) => {
    try {
      const res = await api.get(
        `/risk/export/pdf/${userId}`,
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}_risk_report.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF error:", err?.response?.status, err?.response?.data);
      alert("Failed to download PDF");
    }
  };

  const downloadMyRiskPdf = () => {
    downloadUserPdf(myRisk.user_id, "my");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      {/* YOUR RISK */}
      <Card className="p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h3 className="text-sm uppercase tracking-wide text-slate-500">
            Your Risk Profile
          </h3>
          <p className="text-slate-600 mt-2">
            Derived from trade behavior and compliance history.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[6px]">
              <div className="bg-white w-full h-full rounded-full flex items-center justify-center text-2xl font-bold">
                {myRisk.final_score}
              </div>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full ${badge(myRisk.level)}`}>
            {myRisk.level}
          </span>
          
          {!isPrivileged && (
          <Button variant="outline" onClick={onRefresh}>
            Run Risk
          </Button>
          )}

          <Button variant="outline" onClick={downloadMyRiskPdf}>
            Export PDF
          </Button>
        </div>
      </Card>

      {/* TABLE */}
      <Card className="rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {["ALL", "HIGH", "MEDIUM", "LOW"].map((f) => (
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

          {isPrivileged && (
            <Button onClick={recomputeAll} disabled={runningAll}>
              {runningAll ? "Running..." : "Run Risk Scan"}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {filtered.map((u) => (
            <div
              key={u.user_id}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow transition flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-semibold">{u.name}</p>
                <p className="text-xs text-slate-500">{u.role}</p>
              </div>

              <div className="flex-1 px-6">
                <div className="flex items-center gap-2 font-semibold">
                  {u.final_score}
                  <span className={`w-2 h-2 rounded-full ${tone(u.level)}`} />
                </div>
                <div className="w-full h-1 bg-slate-200 rounded mt-1">
                  <div
                    className={`h-1 rounded ${tone(u.level)}`}
                    style={{ width: `${u.final_score}%` }}
                  />
                </div>
              </div>

              {isPrivileged && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadUserPdf(u.user_id, u.name)}
                    className="px-3 py-1 text-xs rounded-full bg-slate-50 text-slate-700 hover:bg-slate-100"
                  >
                    Export PDF
                  </button>

                  <button
                    disabled={runningId === u.user_id}
                    onClick={() => recomputeUser(u.user_id)}
                    className="px-3 py-1 text-xs rounded-full bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {runningId === u.user_id ? "..." : "Recompute"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default RiskView;
