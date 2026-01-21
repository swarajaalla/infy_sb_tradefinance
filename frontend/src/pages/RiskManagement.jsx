import { useEffect, useState } from "react";
import api from "../services/api";
import RiskBadge from "../components/RiskBadge";

export default function RiskManagement() {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRisk = async () => {
      try {
        const res = await api.get("/risk/me"); // hidden from swagger
        setRisk(res.data);
      } catch (err) {
        console.error("Failed to load risk score", err.response?.data || err);
        setRisk(null);
      } finally {
        setLoading(false);
      }
    };

    loadRisk();
  }, []);

  if (loading) {
    return <p className="p-6">Loading risk analysis...</p>;
  }

  if (!risk) {
    return (
      <div className="p-6 text-red-600">
        Unable to calculate risk score.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">
          Risk Management
        </h2>

        <RiskBadge score={risk.score} level={risk.level} />
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskCard
          title="Documents"
          value={risk.documents?.score ?? 0}
          hint={`${risk.documents?.verified ?? 0} verified`}
        />

        <RiskCard
          title="Trades"
          value={risk.trades?.score ?? 0}
          hint={`${risk.trades?.completed ?? 0} completed`}
        />

        <RiskCard
          title="Activity"
          value={risk.activity?.score ?? 0}
          hint="Recent usage"
        />
      </div>

      {/* DETAILS */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
        <RiskRow label="Overall Score" value={risk.score} />
        <RiskRow label="Risk Level" value={risk.level} />
        <RiskRow label="Verified Documents" value={risk.documents?.verified ?? 0} />
        <RiskRow label="Total Trades" value={risk.trades?.total ?? 0} />
        <RiskRow label="Disputes" value={risk.trades?.disputed ?? 0} />
      </div>
    </div>
  );
}

/* ===============================
   UI HELPERS
================================ */

function RiskCard({ title, value, hint }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}

function RiskRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm border-b pb-2">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
