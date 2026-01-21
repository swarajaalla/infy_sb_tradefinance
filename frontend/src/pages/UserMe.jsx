import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function UserMe() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    api.get("/users/me").then(res => setUser(res.data));
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
  <div className="min-h-screen bg-slate-100 px-6 py-8">

    <div className="max-w-xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">
          My Profile
        </h2>

        {/* <button
          onClick={() => navigate("/dashboard")}
          className="bg-slate-200 hover:bg-slate-300
                     text-slate-800 px-4 py-2 rounded-md
                     text-sm transition"
        >
          Back to Dashboard
        </button> */}
      </div>

      {/* PROFILE CARD */}
      <div className="bg-white rounded-2xl shadow-sm p-6">

        <div className="space-y-4 text-sm text-slate-700">

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-slate-600">User ID</span>
            <span>{user.id}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-slate-600">Name</span>
            <span>{user.name}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-slate-600">Email</span>
            <span>{user.email}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-slate-600">Role</span>
            <span>{user.role}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium text-slate-600">Organisation</span>
            <span>{user.org_name}</span>
          </div>

        </div>
      </div>

    </div>
  </div>
);

}
