import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin",
    org_name: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://127.0.0.1:8000/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    if (!res.ok) {
      alert("Signup failed");
      return;
    }

    alert("Signup success");
    navigate("/login");
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="p-6 border rounded w-96">
        <h2 className="text-xl mb-4">Signup</h2>

        <input name="username" placeholder="Username"
          className="border p-2 w-full mb-2" onChange={handleChange} />

        <input name="email" placeholder="Email"
          className="border p-2 w-full mb-2" onChange={handleChange} />

        <input name="password" type="password" placeholder="Password"
          className="border p-2 w-full mb-2" onChange={handleChange} />

        <select name="role" className="border p-2 w-full mb-2" onChange={handleChange}>
          <option value="admin">Admin</option>
          <option value="bank">Bank</option>
          <option value="corporate">Corporate</option>
          <option value="auditor">Auditor</option>
        </select>

        <input name="org_name" placeholder="Organization"
          className="border p-2 w-full mb-4" onChange={handleChange} />

        <button className="bg-green-600 text-white px-4 py-2 w-full">
          Signup
        </button>
      </form>
    </div>
  );
}
