import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});

export const getIntegrityAlerts = () =>
  axios.get(`${API_URL}/ledger/integrity-alerts`, authHeader());
