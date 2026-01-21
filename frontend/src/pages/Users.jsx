import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  const role = user?.role?.toLowerCase();

  useEffect(() => {
    if (role === "admin") {
      api
        .get("/users/")
        .then((res) => setUsers(res.data))
        .catch(() => setError("Failed to load users"));
    }
  }, [role]);

  /* ---- SOFT ACCESS MESSAGE ---- */
  if (role !== "admin") {
    return (
      <div className="max-w-2xl mx-auto mt-20 bg-white rounded-2xl shadow p-10 text-center">
        <h2 className="text-2xl font-semibold text-slate-800">
          Access Restricted
        </h2>
        <p className="mt-3 text-slate-600 leading-relaxed">
          User management is limited to system administrators.
          Corporate users manage documents and trades within their organisation,
          while administrative controls remain centralized for security.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          User Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage platform users and their organisational roles
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {error && (
          <div className="px-6 py-4 bg-red-50 text-red-600 text-sm border-b">
            {error}
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide text-xs">
            <tr>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Organisation</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-slate-50 transition"
              >
                <td className="px-6 py-4 text-slate-700">{u.id}</td>
                <td className="px-6 py-4 font-medium text-slate-800">
                  {u.name}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {u.email}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {u.org_name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && !error && (
          <div className="px-6 py-12 text-center text-slate-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
