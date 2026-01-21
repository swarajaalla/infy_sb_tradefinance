import api from "../api/axios";

// ================================
// Get Risk Summary (Dashboard)
// ================================
export const getRiskSummary = () => {
  return api.get("/risk/summary");
};

// ================================
// Export Risk CSV
// ================================
export const exportRiskCSV = () => {
  return api.get("/risk/export/csv", {
    responseType: "blob",
  });
};

// ================================
// Export Risk PDF
// ================================
export const exportRiskPDF = () => {
  return api.get("/risk/export/pdf", {
    responseType: "blob",
  });
};

// ================================
// Get Risk for Single Trade (Optional)
// ================================
export const getTradeRisk = (tradeId) => {
  return api.get(`/risk/trade/${tradeId}`);
};
