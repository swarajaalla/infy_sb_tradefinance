import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const role = localStorage.getItem("role");

  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data));
  }, []);

  return (
    <Layout role={role}>
      <h1 className="text-3xl font-bold mb-4">All Users</h1>

      <div className="bg-white shadow rounded-lg p-6">
        {users.map((u) => (
          <div key={u.id} className="border-b py-2">
            <p><b>{u.name}</b> — {u.role} — {u.org_name}</p>
            <p className="text-gray-600 text-sm">{u.email}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
