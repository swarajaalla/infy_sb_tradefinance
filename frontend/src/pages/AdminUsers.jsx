import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const role = localStorage.getItem("role");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      setError("Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <Layout role={role}>
      <h1 className="text-3xl font-bold mb-6">All Users</h1>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        {loading && <p className="p-4 text-gray-500">Loading users...</p>}
        {error && <p className="p-4 text-red-500">{error}</p>}
        {!loading && users.length === 0 && <p className="p-4 text-gray-500">No users found.</p>}

        {!loading && users.length > 0 && (
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 border-b text-left text-gray-700">Name</th>
                <th className="px-6 py-3 border-b text-left text-gray-700">Role</th>
                <th className="px-6 py-3 border-b text-left text-gray-700">Organization</th>
                <th className="px-6 py-3 border-b text-left text-gray-700">Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 border-b">{u.name}</td>
                  <td className="px-6 py-3 border-b">{u.role}</td>
                  <td className="px-6 py-3 border-b">{u.org_name}</td>
                  <td className="px-6 py-3 border-b text-gray-600 text-sm">{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Optional Refresh Button */}
      <div className="mt-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={loadUsers}
        >
          Refresh Users
        </button>
      </div>
    </Layout>
  );
}
