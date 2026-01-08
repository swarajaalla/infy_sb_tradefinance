// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function Dashboard({ role }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch {
        setError("Failed to load user info");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <Layout role={role}>
      <div className="space-y-8">
        {/* Page Title */}
        <h1 className="text-4xl font-bold text-gray-900">
          Trade Finance Dashboard
        </h1>

        {loading && <p className="text-gray-500">Loading dashboard...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {user && (
          <>
            {/* Welcome Card */}
            <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative p-6">
                <h2 className="text-2xl font-semibold">
                  Welcome, {user.name} 👋
                </h2>
                <div className="mt-2 text-sm space-y-1 opacity-95">
                  <p>
                    Role: <span className="font-medium">{user.role}</span>
                  </p>
                  <p>
                    Organization:{" "}
                    <span className="font-medium">{user.org_name}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-t-4 border-emerald-500 p-6 rounded-xl shadow">
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-mono text-lg text-gray-800">
                  {user.id}
                </p>
              </div>

              <div className="bg-white border-t-4 border-purple-500 p-6 rounded-xl shadow">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-mono text-sm break-all text-gray-800">
                  {user.email}
                </p>
              </div>

              <div className="bg-white border-t-4 border-amber-500 p-6 rounded-xl shadow">
                <p className="text-sm text-gray-500">Account Status</p>
                <p className="text-lg font-semibold text-green-600">
                  Active
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
