import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../context/ToastContext";
import RiskView from "../components/risk/RiskView";

const Risk = () => {
  const { user } = useAuth();
  const toast = useToast();

  const role = user?.role?.toLowerCase();
  const isPrivileged = role === "admin" || role === "auditor";

  const [myRisk, setMyRisk] = useState(null);
  const [allRisks, setAllRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRisk();
  }, []);

  const loadRisk = async () => {
    try {
      setLoading(true);

      const requests = [api.get("/risk/me")];
      if (isPrivileged) {
        requests.push(api.get("/risk/all"));
      }

      const results = await Promise.all(requests);

      setMyRisk(results[0].data);
      if (isPrivileged) {
        setAllRisks(results[1].data);
      }
    } catch {
      toast.error("Failed to load risk data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading risk analytics...</p>;
  }

  return (
    <RiskView
      myRisk={myRisk}
      allRisks={allRisks}
      isPrivileged={isPrivileged}
      onRefresh={loadRisk}
    />
  );
};

export default Risk;
