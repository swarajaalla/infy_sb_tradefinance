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
      api.get("/users/")
        .then((res) => setUsers(res.data))
        .catch(() => setError("Failed to load users"));
    }
  }, [role]);

  if (role !== "admin") {
    return <div className="p-6 text-red-600">Access denied</div>;
  }

  return (
    <div className="p-6">
      {error && <p className="text-red-500">{error}</p>}

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Org</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="border p-2">{u.id}</td>
              <td className="border p-2">{u.name}</td>
              <td className="border p-2">{u.email}</td>
              <td className="border p-2">{u.role}</td>
              <td className="border p-2">{u.org_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default Users;
