import api from "./api";

export const getMyRiskScore = () => api.get("/risk/me");

export const getAllRiskScores = () => api.get("/risk/all");

export const recalculateRisk = (userId) =>
  api.post(`/risk/recalculate/${userId}`);
