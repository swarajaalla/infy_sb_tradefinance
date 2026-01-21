import Card from "../ui/Card";

const levelColor = {
  LOW: "text-green-600 bg-green-50",
  MEDIUM: "text-yellow-600 bg-yellow-50",
  HIGH: "text-red-600 bg-red-50",
};

const RiskView = ({ myRisk, allRisks, isPrivileged, onRefresh }) => {
  return (
    <div className="space-y-10 max-w-5xl">

      {/* ---- MY RISK ---- */}
      <Card>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Your Risk Score
          </h2>
          <button
            onClick={onRefresh}
            className="text-sm text-indigo-600 hover:underline"
          >
            Refresh
          </button>
        </div>

        <div className="p-8 flex items-center gap-10">
          <div className="text-5xl font-bold text-slate-900">
            {myRisk.final_score}
          </div>

          <div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${levelColor[myRisk.level]}`}
            >
              {myRisk.level}
            </span>
            <p className="text-slate-600 mt-3 max-w-md">
              {myRisk.message}
            </p>
          </div>
        </div>
      </Card>

      {/* ---- ALL USERS (ADMIN / AUDITOR) ---- */}
      {isPrivileged && (
        <Card>
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-slate-800">
              All Users Risk Overview
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">User ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allRisks.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{u.user_id}</td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3 font-medium">
                      {u.final_score}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${levelColor[u.level]}`}
                      >
                        {u.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RiskView;
