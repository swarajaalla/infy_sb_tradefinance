import { useAuth } from "../auth/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p>Welcome, <b>{user.name}</b></p>
      <p>Role: <b>{user.role}</b></p>
      <p>Organisation: <b>{user.org_name}</b></p>
    </div>
  );
};

export default Dashboard;
