import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function Dashboard({ role }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/users/me").then((res) => setUser(res.data));
  }, []);

  return (
    <Layout role={role}>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

      {user && (
        <div className="bg-white shadow p-6 rounded-lg">
          <p className="text-lg">
            Welcome <span className="font-bold">{user.name}</span>
          </p>
          <p className="text-gray-600">Role: {user.role}</p>
          <p className="text-gray-600">Organization: {user.org_name}</p>
        </div>
      )}
    </Layout>
  );
}
