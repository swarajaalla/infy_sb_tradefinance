import api from "./api";

export const getTrades = () => api.get("/trades/");

export const createTrade = (data) =>
  api.post("/trades", data);

export const getTradeById = (id) =>
  api.get(`/trades/${id}`);

export const updateTradeStatus = (id, data) =>
  api.patch(`/trades/${id}/status`, data);

export const assignBank = (id, bankId) =>
  api.post(`/trades/${id}/assign`, { bank_id: bankId });
export const getBanks = () => {
  const token = localStorage.getItem("token");

  return api.get("/trades/banks", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


export const assignBankToTrade = (id, bankEmail) =>
  api.post(`/trades/${id}/assign-bank`, {
    bank_email: bankEmail,
  });
