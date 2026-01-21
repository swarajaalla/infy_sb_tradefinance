import api from "../api/axios";

export const listTrades = () => api.get("/trades");

export const createTrade = (data) =>
  api.post("/trades", null, { params: data });

export const confirmTrade = (tradeId) =>
  api.post(`/trades/${tradeId}/confirm`);

export const assignBank = (tradeId, bankId) =>
  api.post(`/trades/${tradeId}/assign-bank`, null, {
    params: { bank_id: bankId },
  });

export const startBankReview = (tradeId) =>
  api.post(`/trades/${tradeId}/bank/start-review`);

export const approveTrade = (tradeId) =>
  api.post(`/trades/${tradeId}/bank/approve`);

export const releasePayment = (tradeId) =>
  api.post(`/trades/${tradeId}/bank/release-payment`);

export const completeTrade = (tradeId) =>
  api.post(`/trades/${tradeId}/complete`);
