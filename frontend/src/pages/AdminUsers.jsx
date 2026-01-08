// frontend/src/pages/AdminUsers.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700";
      case "bank":
        return "bg-blue-100 text-blue-700";
      case "corporate":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Layout role={role}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">User Management</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-500 text-sm">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
        </div>

        {/* Search + Refresh */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <input
            type="text"
            placeholder="Search by name, email or role..."
            className="border rounded-lg px-4 py-2 w-full md:w-1/3 focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            onClick={loadUsers}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          {loading && <p className="p-6 text-gray-500">Loading users...</p>}
          {error && <p className="p-6 text-red-500">{error}</p>}

          {!loading && filteredUsers.length > 0 && (
            <table className="min-w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Organization</th>
                  <th className="px-6 py-3 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{u.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-3">{u.org_name}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColor(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredUsers.length === 0 && (
            <p className="p-6 text-gray-500">No users found.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
