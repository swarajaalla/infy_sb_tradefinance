import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getMyRiskScore } from "../services/riskApi";
import RiskBadge from "../components/RiskBadge";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [risk, setRisk] = useState(null);

  const [stats, setStats] = useState({
    totalDocs: 0,
    verifiedDocs: 0,
    monthDocs: 0,
    totalTrades: 0,
    pendingReviews: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      /* ===============================
         USER + RISK
      ================================*/
      const me = await api.get("/users/me");
      setUser(me.data);

      try {
        const riskRes = await getMyRiskScore();
        setRisk(riskRes.data);
      } catch (err) {
        console.warn("Risk score not available");
      }

      /* ===============================
         CORPORATE DASHBOARD
      ================================*/
      if (me.data.role === "CORPORATE") {
        const docs = await api.get("/documents/my");

        const verifiedCount = docs.data.filter(
          (d) => d.verified === true
        ).length;

        setStats({
          totalDocs: docs.data.length,
          verifiedDocs: verifiedCount,
          monthDocs: docs.data.length, // placeholder
          totalTrades: 0,
          pendingReviews: 0,
        });
      }

      /* ===============================
         BANK / ADMIN / AUDITOR DASHBOARD
      ================================*/
      if (
        me.data.role === "BANK" ||
        me.data.role === "ADMIN" ||
        me.data.role === "AUDITOR"
      ) {
        const docs = await api.get("/documents/list");
        const trades = await api.get("/trades");

        const verifiedCount = docs.data.filter(
          (d) => d.verified === true
        ).length;

        const pendingCount = docs.data.filter(
          (d) => d.verified !== true
        ).length;

        setStats({
          totalDocs: docs.data.length,
          verifiedDocs: 4,
          monthDocs: 0,
          totalTrades: trades.data.length,
          pendingReviews: 2,
        });
      }
    };

    load();
  }, []);

  if (!user) return <p className="p-6">Loading...</p>;

  return (
    <div className="space-y-8">

      {/* ===============================
         STATS CARDS
      ================================*/}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">

        {/* ✅ RISK SCORE CARD */}
        {risk && (
          <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <p className="text-sm text-slate-500">Risk Score</p>
              <p className="text-2xl font-semibold">
                {risk.score}/100
              </p>
              <div className="mt-1">
                <RiskBadge level={risk.level} />
              </div>
            </div>
          </div>
        )}

        <StatCard icon="📄" title="Total Documents" value={stats.totalDocs} />
        <StatCard icon="✅" title="Verified Documents" value={stats.verifiedDocs} />

        {user.role === "CORPORATE" && (
          <StatCard icon="📆" title="This Month" value={stats.monthDocs} />
        )}

        {(user.role === "BANK" || user.role === "ADMIN") && (
          <StatCard icon="📑" title="Total Trades" value={stats.totalTrades} />
        )}

        {(user.role === "BANK" || user.role === "AUDITOR") && (
          <StatCard
            icon="⏳"
            title="Pending Reviews"
            value={stats.pendingReviews}
          />
        )}
      </div>

      {/* ===============================
         AVAILABLE FEATURES
      ================================*/}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          Available Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            icon="📂"
            title="Documents"
            description="View documents based on your access level."
            onClick={() => navigate("/documents")}
          />

          {user.role === "CORPORATE" && (
            <FeatureCard
              icon="⬆️"
              title="Upload Document"
              description="Upload new documents with hash protection."
              onClick={() => navigate("/documents/upload")}
            />
          )}

          {user.role !== "AUDITOR" && (
            <FeatureCard
              icon="📑"
              title="Trades"
              description="View and monitor trade lifecycle."
              onClick={() => navigate("/trades")}
            />
          )}

          <FeatureCard
            icon="🧑‍💼"
            title="Role-Based Access"
            description={`Your role: ${user.role.toLowerCase()}`}
          />
        </div>
      </div>
    </div>
  );
}

/* ===============================
   UI HELPERS
================================*/

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-4 transition ${
        onClick ? "cursor-pointer hover:bg-slate-50" : "cursor-default"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-slate-500 mt-1">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
