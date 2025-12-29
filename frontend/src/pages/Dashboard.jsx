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
        setLoading(true);
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch (err) {
        setError("Failed to load user info");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <Layout role={role}>
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {loading && <p className="text-gray-500">Loading user info...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {user && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Welcome, {user.name}!</h2>
            <p className="text-sm">You are logged in as <span className="font-semibold">{user.role}</span></p>
            <p className="text-sm mt-1">Organization: <span className="font-semibold">{user.org_name}</span></p>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition duration-200">
            <h3 className="font-semibold text-lg mb-2">Your Details</h3>
            <p className="text-gray-600">User ID: <span className="font-mono">{user.id}</span></p>
            <p className="text-gray-600 mt-1">Email: <span className="font-mono">{user.email}</span></p>
          </div>

          {/* Placeholder for Actions / Stats */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition duration-200">
            <h3 className="font-semibold text-lg mb-2">Quick Actions</h3>
            <ul className="text-gray-700 list-disc list-inside">
              <li>View Documents</li>
              <li>Upload Document</li>
              <li>Verify Document</li>
            </ul>
          </div>
        </div>
      )}
    </Layout>
  );
}
